import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react'
import { ProjectForm } from '@/components/admin/project-form'
import { MediaManager } from '@/components/admin/media-manager'
import { adminGetCategories, adminGetProject } from '@/lib/admin-queries'
import { deleteProject } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Edit project' }

/** Next 16: both params and searchParams are Promises. */
export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const result = await adminGetProject(id)
  if (!result) notFound()

  const { project, media } = result
  const categories = await adminGetCategories()
  const justCreated = query.created === '1'

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/projects"
        className="inline-flex items-center gap-2 text-sm text-slate-muted hover:text-ink-900"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All projects
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{project.title}</h1>
          <p className="mt-1 text-sm text-slate-muted">
            {project.status === 'published' ? 'Live on the website' : 'Draft — not visible yet'}
          </p>
        </div>
        {project.status === 'published' ? (
          <a
            href={`/projects/${project.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-card)] border border-line-strong px-4 text-sm font-medium hover:bg-paper-sunken"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            View on site
          </a>
        ) : null}
      </div>

      {justCreated ? (
        <div
          role="status"
          className="mt-5 rounded-[var(--radius-card)] border border-success/30 bg-success/5 p-4 text-sm text-success"
        >
          Project created. Now add photos below, then set the status to Published.
        </div>
      ) : null}

      {/* Photos come first: this is what the owner opens the page to do. */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Photos and videos</h2>
        <p className="mt-1 text-sm text-slate-muted">
          Add as many as you like. The photo marked Cover is the one shown in listings.
        </p>
        <div className="mt-5">
          <MediaManager
            projectId={project.id}
            initialMedia={media}
            coverUrl={project.cover_image_url}
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Project details</h2>
        <div className="mt-5">
          <ProjectForm project={project} categories={categories} />
        </div>
      </section>

      <section className="mt-12 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 p-5">
        <h2 className="text-sm font-semibold text-danger">Delete this project</h2>
        <p className="mt-1 text-xs text-slate-muted">
          This removes the project and all of its photos and videos. It cannot be undone.
        </p>
        <form action={deleteProject} className="mt-4">
          <input type="hidden" name="id" value={project.id} />
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-card)] bg-danger px-4 text-sm font-semibold text-white hover:opacity-90"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete project
          </button>
        </form>
      </section>
    </div>
  )
}
