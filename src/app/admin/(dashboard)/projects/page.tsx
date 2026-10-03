import Image from 'next/image'
import Link from 'next/link'
import { FolderPlus, ImageOff } from 'lucide-react'
import { adminGetProjects } from '@/lib/admin-queries'
import { setProjectStatus } from '@/app/admin/actions'
import { OrderArrows } from '@/components/admin/order-arrows'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/format'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Projects' }

export default async function AdminProjectsPage() {
  const projects = await adminGetProjects()

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="mt-1 text-sm text-slate-muted">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} in total.
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-card)] bg-amber-accent px-5 text-sm font-semibold text-white hover:bg-amber-accent-hover"
        >
          <FolderPlus className="size-4" aria-hidden="true" />
          Add project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="mt-7 rounded-[var(--radius-card)] border border-dashed border-line-strong bg-paper-raised px-6 py-16 text-center">
          <p className="text-sm font-medium">No projects yet</p>
          <p className="mt-1 text-xs text-slate-muted">
            Add your first project, then upload photos of the finished job.
          </p>
        </div>
      ) : (
        <ul className="mt-7 flex flex-col gap-3">
          {projects.map((project, index) => (
            <li
              key={project.id}
              className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-paper-raised p-4 sm:flex-row sm:items-center"
            >
              <OrderArrows
                table="projects"
                id={project.id}
                isFirst={index === 0}
                isLast={index === projects.length - 1}
                className="order-last sm:order-first"
              />

              <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-paper-sunken sm:w-28">
                {project.cover_image_url ? (
                  <Image
                    src={project.cover_image_url}
                    alt=""
                    fill
                    sizes="112px"
                    quality={60}
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-slate-soft">
                    <ImageOff className="size-5" aria-hidden="true" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/projects/${project.id}/edit`}
                    className="truncate text-sm font-semibold hover:underline"
                  >
                    {project.title}
                  </Link>
                  <Badge tone={project.status === 'published' ? 'success' : 'muted'}>
                    {project.status}
                  </Badge>
                  {project.featured ? <Badge tone="accent">Homepage</Badge> : null}
                  {project.is_demo ? <Badge tone="neutral">Demo</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-slate-muted">
                  {[
                    project.category?.name,
                    project.project_type,
                    project.city,
                    `${project.media_count} ${project.media_count === 1 ? 'photo' : 'photos'}`,
                    formatDate(project.created_at),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <form action={setProjectStatus}>
                  <input type="hidden" name="id" value={project.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={project.status === 'published' ? 'draft' : 'published'}
                  />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-[var(--radius-card)] border border-line-strong px-3 text-xs font-semibold hover:bg-paper-sunken"
                  >
                    {project.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                </form>
                <Link
                  href={`/admin/projects/${project.id}/edit`}
                  className="inline-flex h-9 items-center rounded-[var(--radius-card)] bg-ink-950 px-3.5 text-xs font-semibold text-paper hover:bg-ink-800"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
