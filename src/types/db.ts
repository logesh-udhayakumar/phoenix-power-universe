/** Database row shapes. Kept hand-written and small — these mirror
 *  supabase/migrations/0001_schema.sql. */

export type ProjectType = 'Residential' | 'Commercial' | 'Industrial' | 'Other'
export type ProjectStatus = 'draft' | 'published'
export type MediaType = 'image' | 'video'
export type EnquiryStatus = 'new' | 'contacted' | 'closed'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  display_order: number
  is_active: boolean
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  title: string
  slug: string
  description: string | null
  scope_of_work: string[]
  category_id: string | null
  project_type: ProjectType
  location: string | null
  city: string | null
  state: string | null
  completion_date: string | null
  featured: boolean
  status: ProjectStatus
  cover_image_url: string | null
  /** JSON array of external media URLs. See lib/media-links.ts.
   *  Optional: absent on a database where 0004_media_links.sql has not run. */
  media_links?: string | null
  display_order: number
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface ProjectMedia {
  id: string
  project_id: string
  media_type: MediaType
  file_url: string
  thumbnail_url: string | null
  caption: string | null
  display_order: number
  created_at: string
}

export interface Service {
  id: string
  name: string
  slug: string
  description: string | null
  details: string[]
  image_url: string | null
  icon: string | null
  display_order: number
  is_active: boolean
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface Testimonial {
  id: string
  customer_name: string
  company_name: string | null
  content: string
  rating: number | null
  image_url: string | null
  is_published: boolean
  display_order: number
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface Enquiry {
  id: string
  name: string
  phone: string
  email: string | null
  company: string | null
  message: string | null
  project_type: string | null
  status: EnquiryStatus
  created_at: string
}

/** A project joined with its category and media — what the detail page needs. */
export interface ProjectWithRelations extends Project {
  category: Pick<Category, 'id' | 'name' | 'slug'> | null
  media: ProjectMedia[]
}

/** A project joined with just its category — what listing cards need. */
export interface ProjectListItem extends Project {
  category: Pick<Category, 'id' | 'name' | 'slug'> | null
  has_video?: boolean
}

export type AdminRole = 'admin' | 'owner'

export interface AdminUserRow {
  id: string
  email: string
  full_name: string | null
  role: AdminRole
  created_at: string
}
