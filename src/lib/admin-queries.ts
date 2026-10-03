import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type {
  AdminUserRow,
  Category,
  Enquiry,
  Project,
  ProjectMedia,
  Service,
  Testimonial,
} from '@/types/db'

/** Admin reads. These run as the signed-in admin, so RLS returns drafts and
 *  unpublished rows here but not to the public site. */

export async function adminGetProjects(): Promise<
  (Project & { category: { name: string } | null; media_count: number })[]
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, category:categories(name), project_media(count)')
    // Ordered the same way the public site orders them, so what the owner
    // arranges here is exactly what a visitor sees.
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Could not load projects: ${error.message}`)

  return (data ?? []).map((row) => {
    const counts = row.project_media as unknown as { count: number }[] | null
    return {
      ...(row as unknown as Project),
      category: (row.category as unknown as { name: string } | null) ?? null,
      media_count: counts?.[0]?.count ?? 0,
    }
  })
}

export async function adminGetProject(
  id: string,
): Promise<{ project: Project; media: ProjectMedia[] } | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, media:project_media(*)')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null

  const { media, ...project } = data as unknown as Project & { media: ProjectMedia[] }
  return {
    project,
    media: [...(media ?? [])].sort((a, b) => a.display_order - b.display_order),
  }
}

export async function adminGetCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
  return data ?? []
}

export async function adminGetServices(): Promise<Service[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('services')
    .select('*')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
  return data ?? []
}

export async function adminGetTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('testimonials')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function adminGetEnquiries(): Promise<Enquiry[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('enquiries')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function adminGetStats() {
  const supabase = await createClient()

  const [projects, published, drafts, enquiries, newEnquiries] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft'),
    supabase.from('enquiries').select('id', { count: 'exact', head: true }),
    supabase
      .from('enquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new'),
  ])

  return {
    projects: projects.count ?? 0,
    published: published.count ?? 0,
    drafts: drafts.count ?? 0,
    enquiries: enquiries.count ?? 0,
    newEnquiries: newEnquiries.count ?? 0,
  }
}

export async function adminGetSettings(): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('key, value')
  const result: Record<string, string> = {}
  for (const row of data ?? []) result[row.key] = row.value ?? ''
  return result
}

export async function adminGetUsers(): Promise<AdminUserRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: true })
  if (error) throw new Error(`Could not load users: ${error.message}`)
  return (data ?? []) as AdminUserRow[]
}
