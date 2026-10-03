'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { slugify, uniqueSlug } from '@/lib/utils/slug'
import {
  categorySchema,
  projectSchema,
  serviceSchema,
  settingsSchema,
  testimonialSchema,
} from '@/lib/validation/schemas'
import type { MediaType, ProjectMedia } from '@/types/db'
import { parseLinkInput, serialiseLinks } from '@/lib/media-links'

export interface ActionState {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string>
  /** Set after a create so the client can move on to uploading photos. */
  id?: string
}

/** Server Actions are POSTs to whatever route they are used from, and a proxy
 *  matcher does not reliably cover them — so every action re-checks admin
 *  access itself. RLS is the third layer underneath. */
async function guard() {
  await requireAdmin()
  return createClient()
}

function fieldErrorsFrom(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    fieldErrors[key] ??= issue.message
  }
  return fieldErrors
}

function readList(formData: FormData, key: string): string[] {
  const raw = formData.get(key)
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 40)
}

function bool(formData: FormData, key: string) {
  const value = formData.get(key)
  return value === 'on' || value === 'true'
}

/** The media_links column arrives with supabase/migrations/0004_media_links.sql.
 *
 *  Until that has been run, writing the column fails — and losing a whole
 *  project edit because one optional field has no home yet is the wrong
 *  trade. These let the save retry without it and say so, rather than
 *  rejecting the edit. PostgREST reports the unknown column as PGRST204,
 *  Postgres itself as 42703.
 */
const MEDIA_LINKS_PENDING =
  'Project saved, but the photo and video links were not stored: run supabase/migrations/0004_media_links.sql to enable them.'

function isMissingMediaLinks(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === 'PGRST204' || error.code === '42703') {
    return (error.message ?? '').includes('media_links')
  }
  return false
}

function withoutMediaLinks<T extends { media_links?: string | null }>(row: T) {
  const copy = { ...row }
  delete copy.media_links
  return copy
}

function revalidateProject() {
  revalidatePath('/admin/projects')
  revalidatePath('/projects')
  revalidatePath('/')
}

/** display_order is owned by the up/down arrows on the list pages, so no save
 *  form may write it — including it would reset a row's position on a save. */
function withoutDisplayOrder<T extends { display_order?: number }>(data: T) {
  const fields = { ...data }
  delete fields.display_order
  return fields
}

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

/** Tables whose rows the owner can reorder with the up/down arrows. A
 *  whitelist, not a free-form table name, so this can never be pointed at
 *  something it should not write to. */
const ORDERABLE = {
  projects: '/admin/projects',
  categories: '/admin/categories',
  services: '/admin/services',
  testimonials: '/admin/testimonials',
} as const

export type OrderableTable = keyof typeof ORDERABLE

/** New rows go to the end of the list rather than jumping to the top, which
 *  is what display_order 0 would do once other rows are ordered. */
async function nextDisplayOrder(table: OrderableTable): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from(table)
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
  return (data?.[0]?.display_order ?? -1) + 1
}

/** Move one row up or down the list.
 *
 *  Reorders by rewriting positions rather than swapping two values, because
 *  every row starts at display_order 0 — swapping identical numbers would do
 *  nothing at all. The whole list is normalised to 0..n-1 on the first move,
 *  and only rows whose position actually changed are written.
 */
export async function moveEntity(formData: FormData) {
  const supabase = await guard()

  const table = text(formData, 'table') as OrderableTable
  const id = text(formData, 'id')
  const direction = text(formData, 'direction')

  if (!(table in ORDERABLE) || !id) return
  if (direction !== 'up' && direction !== 'down') return

  const { data: rows } = await supabase
    .from(table)
    .select('id, display_order, created_at')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (!rows || rows.length < 2) return

  const index = rows.findIndex((r) => r.id === id)
  if (index === -1) return

  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= rows.length) return

  const ordered = [...rows]
  const [moved] = ordered.splice(index, 1)
  ordered.splice(target, 0, moved)

  await Promise.all(
    ordered
      .map((row, position) => ({ row, position }))
      .filter(({ row, position }) => row.display_order !== position)
      .map(({ row, position }) =>
        supabase.from(table).update({ display_order: position }).eq('id', row.id),
      ),
  )

  revalidatePath(ORDERABLE[table])
  // Layout scope, not just the obvious page: categories and services also
  // appear in the footer and the hero line, which live in the shared layout,
  // so a narrower revalidation would leave the old order on every other page.
  revalidatePath('/', 'layout')
}

/** The owner never types a slug. One is generated from the name and made
 *  unique against what is already stored. An advanced field can still
 *  override it, which is why the form value wins when present. */
async function resolveSlug(
  table: 'projects' | 'categories' | 'services',
  desired: string,
  fallbackSource: string,
  currentId?: string,
) {
  const supabase = await createClient()
  const base = slugify(desired || fallbackSource)
  const { data } = await supabase.from(table).select('id, slug')
  const taken = new Set(
    (data ?? [])
      .filter((row) => row.id !== currentId)
      .map((row) => row.slug as string),
  )
  return uniqueSlug(base, taken)
}

/* ------------------------------------------------------------------ projects */

export async function saveProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await guard()
  const id = text(formData, 'id') || undefined

  const parsed = projectSchema.safeParse({
    title: text(formData, 'title'),
    slug: text(formData, 'slug'),
    description: text(formData, 'description'),
    scope_of_work: readList(formData, 'scope_of_work'),
    category_id: text(formData, 'category_id') || null,
    project_type: text(formData, 'project_type') || 'Other',
    location: text(formData, 'location'),
    city: text(formData, 'city'),
    state: text(formData, 'state'),
    completion_date: text(formData, 'completion_date'),
    featured: bool(formData, 'featured'),
    status: text(formData, 'status') || 'draft',
    cover_image_url: text(formData, 'cover_image_url'),
    media_links: text(formData, 'media_links'),
    display_order: text(formData, 'display_order') || 0,
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    }
  }

  const slug = await resolveSlug('projects', parsed.data.slug ?? '', parsed.data.title, id)

  // display_order is controlled by the arrows on the list, not by this form,
  // so it is never written here — including it would reset the position to 0
  // on every save.
  const fields = withoutDisplayOrder(parsed.data)
  // Stored as a JSON array, so the column holds one predictable shape no
  // matter how the owner separated the URLs they pasted.
  const row = {
    ...fields,
    slug,
    media_links: serialiseLinks(parseLinkInput(parsed.data.media_links ?? '')),
  }

  if (id) {
    let { error } = await supabase.from('projects').update(row).eq('id', id)

    if (isMissingMediaLinks(error)) {
      ;({ error } = await supabase.from('projects').update(withoutMediaLinks(row)).eq('id', id))
      if (!error) {
        revalidateProject()
        return { status: 'success', message: MEDIA_LINKS_PENDING, id }
      }
    }

    if (error) return { status: 'error', message: `Could not save: ${error.message}` }

    revalidateProject()
    redirect('/admin/projects')
  } else {
    const display_order = await nextDisplayOrder('projects')
    let { data, error } = await supabase
      .from('projects')
      .insert({ ...row, display_order })
      .select('id')
      .single()

    if (isMissingMediaLinks(error)) {
      ;({ data, error } = await supabase
        .from('projects')
        .insert({ ...withoutMediaLinks(row), display_order })
        .select('id')
        .single())
    }

    if (error || !data) {
      return { status: 'error', message: `Could not save: ${error?.message}` }
    }
    revalidatePath('/admin/projects')
    // A new project goes to its own edit page rather than back to the list:
    // photos are the next thing the owner needs to add, and they can only be
    // uploaded once the project has an id.
    redirect(`/admin/projects/${data.id}/edit?created=1`)
  }
}

export async function deleteProject(formData: FormData) {
  const supabase = await guard()
  const id = text(formData, 'id')
  if (!id) return

  // Storage files are removed first: if that fails the rows stay, which is
  // recoverable. Deleting rows first would orphan the files instead.
  const { data: media } = await supabase
    .from('project_media')
    .select('file_url, media_type')
    .eq('project_id', id)

  for (const item of media ?? []) {
    await removeStorageObject(item.file_url, item.media_type as MediaType)
  }

  await supabase.from('projects').delete().eq('id', id)
  revalidatePath('/admin/projects')
  revalidatePath('/projects')
  redirect('/admin/projects')
}

export async function setProjectStatus(formData: FormData) {
  const supabase = await guard()
  const id = text(formData, 'id')
  const status = text(formData, 'status')
  if (!id || (status !== 'draft' && status !== 'published')) return

  await supabase.from('projects').update({ status }).eq('id', id)
  revalidatePath('/admin/projects')
  revalidatePath('/projects')
}

export async function toggleProjectFeatured(formData: FormData) {
  const supabase = await guard()
  const id = text(formData, 'id')
  if (!id) return
  await supabase
    .from('projects')
    .update({ featured: bool(formData, 'featured') })
    .eq('id', id)
  revalidatePath('/admin/projects')
  revalidatePath('/')
}

/* -------------------------------------------------------------------- media */

/** Called by the uploader after the file itself has been pushed to Storage
 *  from the browser. The browser upload runs as the signed-in admin, so the
 *  storage policy still applies — the service-role key is never involved. */
export async function addProjectMedia(
  projectId: string,
  items: { url: string; mediaType: MediaType; thumbnailUrl?: string | null }[],
): Promise<{ ok: boolean; message?: string; media?: ProjectMedia[] }> {
  const supabase = await guard()

  const { data: existing } = await supabase
    .from('project_media')
    .select('display_order')
    .eq('project_id', projectId)
    .order('display_order', { ascending: false })
    .limit(1)

  let nextOrder = (existing?.[0]?.display_order ?? -1) + 1

  const rows = items.map((item) => ({
    project_id: projectId,
    media_type: item.mediaType,
    file_url: item.url,
    thumbnail_url: item.thumbnailUrl ?? null,
    display_order: nextOrder++,
  }))

  // Return the inserted rows: the uploader needs their real database ids.
  // Inventing placeholder ids client-side meant a reorder immediately after
  // an upload sent "temp-..." to Postgres, which rejected it as a bad uuid.
  const { data: inserted, error } = await supabase
    .from('project_media')
    .insert(rows)
    .select('*')
  if (error) return { ok: false, message: error.message }

  revalidatePath('/admin/projects')
  revalidatePath('/projects')
  return { ok: true, media: (inserted ?? []) as ProjectMedia[] }
}

export async function deleteProjectMedia(
  mediaId: string,
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await guard()

  const { data: item } = await supabase
    .from('project_media')
    .select('file_url, media_type, project_id')
    .eq('id', mediaId)
    .maybeSingle()

  if (!item) return { ok: false, message: 'That photo no longer exists.' }

  await removeStorageObject(item.file_url, item.media_type as MediaType)

  const { error } = await supabase.from('project_media').delete().eq('id', mediaId)
  if (error) return { ok: false, message: error.message }

  // If this file was the cover, clear it so the project does not point at a
  // deleted image.
  await supabase
    .from('projects')
    .update({ cover_image_url: null })
    .eq('id', item.project_id)
    .eq('cover_image_url', item.file_url)

  revalidatePath('/admin/projects')
  revalidatePath('/projects')
  return { ok: true }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function reorderProjectMedia(
  orderedIds: string[],
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await guard()

  // Validate before writing: a non-uuid id reaches Postgres as a raw type
  // error ("invalid input syntax for type uuid"), which means nothing to the
  // person looking at the screen.
  if (!orderedIds.every((id) => UUID_RE.test(id))) {
    return {
      ok: false,
      message: 'Could not save the new order. Please reload the page and try again.',
    }
  }

  for (const [index, id] of orderedIds.entries()) {
    const { error } = await supabase
      .from('project_media')
      .update({ display_order: index })
      .eq('id', id)
    if (error) return { ok: false, message: error.message }
  }

  revalidatePath('/projects')
  return { ok: true }
}

export async function setProjectCover(
  projectId: string,
  url: string,
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await guard()
  const { error } = await supabase
    .from('projects')
    .update({ cover_image_url: url })
    .eq('id', projectId)
  if (error) return { ok: false, message: error.message }
  revalidatePath('/admin/projects')
  revalidatePath('/projects')
  return { ok: true }
}

/** Best-effort delete of the underlying file. A failure here is logged and
 *  swallowed: an orphaned file costs storage, but a thrown error would block
 *  the owner from removing a photo they no longer want shown. */
async function removeStorageObject(url: string, mediaType: MediaType) {
  const bucket = mediaType === 'video' ? 'project-videos' : 'project-images'
  const marker = `/storage/v1/object/public/${bucket}/`
  const index = url.indexOf(marker)
  if (index === -1) return

  const path = decodeURIComponent(url.slice(index + marker.length))
  try {
    const supabase = await createClient()
    await supabase.storage.from(bucket).remove([path])
  } catch (error) {
    console.error('Could not remove storage object', path, error)
  }
}

/* ---------------------------------------------------------------- categories */

export async function saveCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await guard()
  const id = text(formData, 'id') || undefined

  const parsed = categorySchema.safeParse({
    name: text(formData, 'name'),
    slug: text(formData, 'slug'),
    description: text(formData, 'description'),
    image_url: text(formData, 'image_url'),
    display_order: text(formData, 'display_order') || 0,
    is_active: bool(formData, 'is_active'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    }
  }

  const slug = await resolveSlug('categories', parsed.data.slug ?? '', parsed.data.name, id)
  const fields = withoutDisplayOrder(parsed.data)
  const row = { ...fields, slug }

  const { error } = id
    ? await supabase.from('categories').update(row).eq('id', id)
    : await supabase
        .from('categories')
        .insert({ ...row, display_order: await nextDisplayOrder('categories') })

  if (error) return { status: 'error', message: `Could not save: ${error.message}` }

  revalidatePath('/admin/categories')
  revalidatePath('/projects')
  return { status: 'success', message: 'Category saved.' }
}

export async function deleteCategory(formData: FormData) {
  const supabase = await guard()
  const id = text(formData, 'id')
  if (!id) return
  // Projects keep existing with no category (ON DELETE SET NULL).
  await supabase.from('categories').delete().eq('id', id)
  revalidatePath('/admin/categories')
  revalidatePath('/projects')
}

/* ------------------------------------------------------------------ services */

export async function saveService(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await guard()
  const id = text(formData, 'id') || undefined

  const parsed = serviceSchema.safeParse({
    name: text(formData, 'name'),
    slug: text(formData, 'slug'),
    description: text(formData, 'description'),
    details: readList(formData, 'details'),
    image_url: text(formData, 'image_url'),
    icon: text(formData, 'icon'),
    display_order: text(formData, 'display_order') || 0,
    is_active: bool(formData, 'is_active'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    }
  }

  const slug = await resolveSlug('services', parsed.data.slug ?? '', parsed.data.name, id)
  const fields = withoutDisplayOrder(parsed.data)
  const row = { ...fields, slug }

  const { error } = id
    ? await supabase.from('services').update(row).eq('id', id)
    : await supabase
        .from('services')
        .insert({ ...row, display_order: await nextDisplayOrder('services') })

  if (error) return { status: 'error', message: `Could not save: ${error.message}` }

  revalidatePath('/admin/services')
  revalidatePath('/services')
  return { status: 'success', message: 'Service saved.' }
}

export async function deleteService(formData: FormData) {
  const supabase = await guard()
  const id = text(formData, 'id')
  if (!id) return
  await supabase.from('services').delete().eq('id', id)
  revalidatePath('/admin/services')
  revalidatePath('/services')
}

/* -------------------------------------------------------------- testimonials */

export async function saveTestimonial(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await guard()
  const id = text(formData, 'id') || undefined

  const ratingRaw = text(formData, 'rating')
  const parsed = testimonialSchema.safeParse({
    customer_name: text(formData, 'customer_name'),
    company_name: text(formData, 'company_name'),
    content: text(formData, 'content'),
    rating: ratingRaw ? ratingRaw : null,
    image_url: text(formData, 'image_url'),
    is_published: bool(formData, 'is_published'),
    display_order: text(formData, 'display_order') || 0,
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    }
  }

  const fields = withoutDisplayOrder(parsed.data)

  const { error } = id
    ? await supabase.from('testimonials').update(fields).eq('id', id)
    : await supabase
        .from('testimonials')
        .insert({ ...fields, display_order: await nextDisplayOrder('testimonials') })

  if (error) return { status: 'error', message: `Could not save: ${error.message}` }

  revalidatePath('/admin/testimonials')
  revalidatePath('/')
  return { status: 'success', message: 'Testimonial saved.' }
}

export async function deleteTestimonial(formData: FormData) {
  const supabase = await guard()
  const id = text(formData, 'id')
  if (!id) return
  await supabase.from('testimonials').delete().eq('id', id)
  revalidatePath('/admin/testimonials')
  revalidatePath('/')
}

/* ----------------------------------------------------------------- enquiries */

export async function setEnquiryStatus(formData: FormData) {
  const supabase = await guard()
  const id = text(formData, 'id')
  const status = text(formData, 'status')
  if (!id || !['new', 'contacted', 'closed'].includes(status)) return
  await supabase.from('enquiries').update({ status }).eq('id', id)
  revalidatePath('/admin/enquiries')
}

export async function deleteEnquiry(formData: FormData) {
  const supabase = await guard()
  const id = text(formData, 'id')
  if (!id) return
  await supabase.from('enquiries').delete().eq('id', id)
  revalidatePath('/admin/enquiries')
}

/* ------------------------------------------------------------------ settings */

export async function saveSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await guard()

  const parsed = settingsSchema.safeParse({
    phone: text(formData, 'phone'),
    whatsapp: text(formData, 'whatsapp'),
    email: text(formData, 'email'),
    address: text(formData, 'address'),
    service_areas: text(formData, 'service_areas'),
    maps_url: text(formData, 'maps_url'),
    instagram: text(formData, 'instagram'),
    facebook: text(formData, 'facebook'),
    linkedin: text(formData, 'linkedin'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please check the highlighted fields.',
      fieldErrors: fieldErrorsFrom(parsed.error),
    }
  }

  const rows = Object.entries(parsed.data).map(([key, value]) => ({
    key,
    value: value ?? '',
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' })
  if (error) return { status: 'error', message: `Could not save: ${error.message}` }

  // Contact details appear in the footer of every page.
  revalidatePath('/', 'layout')
  return { status: 'success', message: 'Settings saved.' }
}

/* -------------------------------------------------------------------- users */

export async function addUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin()
  const email = text(formData, 'email').toLowerCase().trim()
  const password = text(formData, 'password')
  const fullName = text(formData, 'full_name').trim() || null
  const role = text(formData, 'role') || 'admin'

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 'error', message: 'Please enter a valid email address.' }
  }
  if (password.length < 8) {
    return { status: 'error', message: 'Password must be at least 8 characters.' }
  }
  if (role !== 'admin' && role !== 'owner') {
    return { status: 'error', message: 'Invalid role.' }
  }

  // All writes go through the service-role client so RLS is not a barrier.
  const adminSupabase = createAdminClient()

  // Check for an existing admin_users row first to give a friendly message.
  const { data: existing } = await adminSupabase
    .from('admin_users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return { status: 'error', message: 'A user with that email is already an admin.' }
  }

  // Create the auth user directly — no invite email, email is pre-confirmed.
  let userId: string | undefined
  const { data: created, error: createErr } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createErr) {
    // The email already exists in auth.users (e.g. from a previous failed invite).
    // Look up that user and update their password so the credentials we set work.
    const alreadyExists =
      createErr.message.toLowerCase().includes('already been registered') ||
      createErr.message.toLowerCase().includes('already registered') ||
      createErr.message.toLowerCase().includes('already exists')

    if (!alreadyExists) {
      return { status: 'error', message: `Could not create user: ${createErr.message}` }
    }

    // Find the orphaned auth user by listing and matching email.
    const { data: listData, error: listErr } = await adminSupabase.auth.admin.listUsers({
      perPage: 1000,
    })
    if (listErr) {
      return { status: 'error', message: `Could not look up existing user: ${listErr.message}` }
    }

    const orphan = (listData?.users ?? []).find(
      (u) => u.email?.toLowerCase() === email,
    )
    if (!orphan) {
      return {
        status: 'error',
        message: 'Email already registered in auth but could not locate the account.',
      }
    }

    // Update their password so the credentials we just set are the active ones.
    await adminSupabase.auth.admin.updateUserById(orphan.id, { password, email_confirm: true })
    userId = orphan.id
  } else {
    userId = created?.user?.id
  }

  if (!userId) {
    return { status: 'error', message: 'Could not retrieve user id.' }
  }

  // Register this user as an admin so is_admin() returns true for them.
  const { error: insertErr } = await adminSupabase
    .from('admin_users')
    .insert({ id: userId, email, full_name: fullName, role })

  if (insertErr) {
    return {
      status: 'error',
      message: `User created but could not save admin record: ${insertErr.message}`,
    }
  }

  revalidatePath('/admin/users')
  return {
    status: 'success',
    message: `User ${email} created successfully. They can now log in with their password.`,
  }
}

export async function deleteAdminUser(formData: FormData) {
  const caller = await requireAdmin()
  const id = text(formData, 'id')
  if (!id) return

  // Prevent self-deletion.
  if (id === caller.id) return

  // Removing from admin_users is enough — they lose all admin access immediately.
  // The auth.users row stays so the person can log in to other Supabase projects
  // they may own; this matches how Supabase itself treats removal.
  const supabase = await createClient()
  await supabase.from('admin_users').delete().eq('id', id)

  revalidatePath('/admin/users')
}
