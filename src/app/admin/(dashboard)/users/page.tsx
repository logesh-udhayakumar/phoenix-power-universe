import { Suspense } from 'react'
import { adminGetUsers } from '@/lib/admin-queries'
import { requireAdmin } from '@/lib/auth'
import { addUser, deleteAdminUser } from '@/app/admin/actions'
import { UsersClient } from './users-client'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Users' }

export default async function AdminUsersPage() {
  const [users, caller] = await Promise.all([adminGetUsers(), requireAdmin()])

  return (
    <Suspense>
      <UsersClient
        users={users}
        callerId={caller.id}
        addAction={addUser}
        deleteAction={deleteAdminUser}
      />
    </Suspense>
  )
}
