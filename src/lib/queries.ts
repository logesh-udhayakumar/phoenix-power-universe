import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type {
  Category,
  ProjectListItem,
  ProjectWithRelations,
  Service,
  Testimonial,
} from '@/types/db'

/** Read-side data access. Everything here runs on the server with the anon
 *  key, so RLS decides what comes back: drafts and unpublished rows are
 *  invisible to visitors even if a query forgets to filter.
 *
 *  react `cache()` dedupes repeated calls within one render pass (the layout
 *  and the page both want settings, for example) without caching across
 *  requests — publishing a project shows up on the next load, not in an hour.
 */

const PROJECT_LIST_SELECT =
  'id, title, slug, description, scope_of_work, category_id, project_type, location, city, state, completion_date, featured, status, cover_image_url, display_order, is_demo, created_at, updated_at, category:categories(id, name, slug)'

export type ProjectSort = 'newest' | 'oldest' | 'featured' | 'manual'

export interface ProjectFilters {
  category?: string | null
  type?: string | null
  search?: string | null
  sort?: ProjectSort
  limit?: number
}

function applySort<T extends { order: (col: string, opts?: object) => T }>(
  query: T,
  sort: ProjectSort,
): T {
  switch (sort) {
    case 'oldest':
      return query.order('created_at', { ascending: true })
    case 'featured':
      return query
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
    case 'manual':
      return query
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
    default:
      return query.order('created_at', { ascending: false })
  }
}

export const getPublishedProjects = cache(
  async (filters: ProjectFilters = {}): Promise<ProjectListItem[]> => {
    if (!isSupabaseConfigured()) return []
    const supabase = await createClient()
    let query = supabase
      .from('projects')
      .select(PROJECT_LIST_SELECT)
      .eq('status', 'published')

    if (filters.category) query = query.eq('categories.slug', filters.category)
    if (filters.type) query = query.eq('project_type', filters.type)

    if (filters.search) {
      // Escape PostgREST's or() delimiters so a comma or paren in the search
      // box cannot rewrite the filter expression.
      const term = filters.search.replace(/[,()]/g, ' ').trim()
      if (term) {
        query = query.or(
          `title.ilike.%${term}%,city.ilike.%${term}%,location.ilike.%${term}%`,
        )
      }
    }

    // 'manual' by default: the admin's up/down arrows are what decides the
    // order on the website, so a reorder is visible immediately.
    query = applySort(query, filters.sort ?? 'manual')
    if (filters.limit) query = query.limit(filters.limit)

    const { data, error } = await query
    if (error) throw new Error(`Could not load projects: ${error.message}`)

    // Category is filtered client-side for slug matching because PostgREST
    // cannot filter an embedded resource without an inner join hint.
    const rows = (data ?? []) as unknown as ProjectListItem[]
    return filters.category
      ? rows.filter((p) => p.category?.slug === filters.category)
      : rows
  },
)

export const getFeaturedProjects = cache(
  async (limit: number): Promise<ProjectListItem[]> => {
    if (!isSupabaseConfigured()) return []
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_LIST_SELECT)
      .eq('status', 'published')
      .eq('featured', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Could not load featured projects: ${error.message}`)
    return (data ?? []) as unknown as ProjectListItem[]
  },
)

export const getProjectBySlug = cache(
  async (slug: string): Promise<ProjectWithRelations | null> => {
    if (!isSupabaseConfigured()) return null
    const supabase = await createClient()
    // `*` rather than the explicit column list: media_links is read only
    // here, and a star select keeps this query valid on a database where the
    // column migration has not been applied yet, instead of failing the whole
    // page with "column does not exist".
    const { data, error } = await supabase
      .from('projects')
      .select('*, category:categories(id, name, slug), media:project_media(*)')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (error) throw new Error(`Could not load project: ${error.message}`)
    if (!data) return null

    const project = data as unknown as ProjectWithRelations
    project.media = [...(project.media ?? [])].sort(
      (a, b) => a.display_order - b.display_order,
    )
    return project
  },
)

export const getPublishedProjectSlugs = cache(async (): Promise<
  { slug: string; updated_at: string }[]
> => {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('slug, updated_at')
    .eq('status', 'published')
  if (error) return []
  return data ?? []
})

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw new Error(`Could not load categories: ${error.message}`)
  return data ?? []
})

export const getServices = cache(async (): Promise<Service[]> => {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw new Error(`Could not load services: ${error.message}`)
  return data ?? []
})

export const getServiceBySlug = cache(async (slug: string): Promise<Service | null> => {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw new Error(`Could not load service: ${error.message}`)
  return data
})

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  if (!isSupabaseConfigured()) return []
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true })
  if (error) return []
  return data ?? []
})
