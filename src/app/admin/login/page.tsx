import Link from 'next/link'
import { LoginForm } from '@/components/admin/login-form'
import { siteConfig } from '@/config/site'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="block text-center text-xs font-bold uppercase tracking-[0.14em] text-ink-950"
        >
          {siteConfig.name}
        </Link>

        <div className="mt-6 rounded-[var(--radius-card)] border border-line bg-paper-raised p-7 shadow-[var(--shadow-card)]">
          <h1 className="text-xl font-bold">Sign in</h1>
          <p className="mt-1.5 text-sm text-slate-muted">
            Manage your projects, photos and enquiries.
          </p>
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-muted">
          <Link href="/" className="hover:text-ink-900">
            Back to the website
          </Link>
        </p>
      </div>
    </div>
  )
}
