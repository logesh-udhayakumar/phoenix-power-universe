import { SettingsForm } from '@/components/admin/settings-form'
import { adminGetSettings } from '@/lib/admin-queries'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Settings' }

export default async function AdminSettingsPage() {
  const values = await adminGetSettings()

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-slate-muted">
        Your contact details. These appear across the website straight away.
      </p>

      <div className="mt-7 rounded-[var(--radius-card)] border border-line bg-paper-raised p-5">
        <SettingsForm values={values} />
      </div>

    </div>
  )
}
