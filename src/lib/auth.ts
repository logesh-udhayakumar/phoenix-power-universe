import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface AdminUser {
  id: string
  email: string
  fullName: string | null
  role: string
}

/** The real authorization check: signed in AND listed in admin_users.
 *  Called by every admin page and every admin server action — never rely on
 *  proxy.ts alone, which only sees a cookie. */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    role: data.role,
  }
}

/** Use at the top of every admin page and action. Redirects instead of
 *  rendering when the caller is not an admin. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser()
  if (!admin) redirect('/admin/login')
  return admin
}
