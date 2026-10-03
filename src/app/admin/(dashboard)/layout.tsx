import { AdminShell } from '@/components/admin/admin-shell'
import { requireAdmin } from '@/lib/auth'

/** Every page in this group is behind requireAdmin(). proxy.ts already
 *  redirected signed-out visitors, but that check only reads a cookie — this
 *  is the one that confirms the user is actually an admin. */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireAdmin()
  return <AdminShell email={admin.email}>{children}</AdminShell>
}
