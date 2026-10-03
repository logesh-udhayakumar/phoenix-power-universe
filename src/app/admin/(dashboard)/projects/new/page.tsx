import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProjectForm } from '@/components/admin/project-form'
import { adminGetCategories } from '@/lib/admin-queries'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Add project' }

export default async function NewProjectPage() {
  const categories = await adminGetCategories()

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-2 text-sm text-slate-muted hover:text-ink-900"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All projects
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Add new project</h1>
      <p className="mt-1 text-sm text-slate-muted">
        Save the basic details first. You can add photos and videos on the next step.
      </p>

      <div className="mt-7">
        <ProjectForm categories={categories} />
      </div>
    </div>
  )
}
