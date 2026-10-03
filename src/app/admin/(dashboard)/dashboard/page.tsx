import Link from 'next/link'
import { ArrowRight, FolderPlus, Inbox } from 'lucide-react'
import { adminGetStats, adminGetProjects } from '@/lib/admin-queries'
import { formatDate } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const [stats, projects] = await Promise.all([adminGetStats(), adminGetProjects()])
  const recent = projects.slice(0, 5)

  const tiles = [
    { label: 'Projects', value: stats.projects, href: '/admin/projects' },
    { label: 'Published', value: stats.published, href: '/admin/projects' },
    { label: 'Drafts', value: stats.drafts, href: '/admin/projects' },
    { label: 'Enquiries', value: stats.enquiries, href: '/admin/enquiries' },
  ] as const

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-muted">
            Your projects, photos and enquiries in one place.
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

      <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="rounded-[var(--radius-card)] border border-line bg-paper-raised p-5 transition-shadow hover:shadow-[var(--shadow-card)]"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-soft">
              {tile.label}
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{tile.value}</p>
          </Link>
        ))}
      </div>

      {stats.newEnquiries > 0 ? (
        <Link
          href="/admin/enquiries"
          className="mt-5 flex items-center gap-3 rounded-[var(--radius-card)] border border-amber-accent/40 bg-amber-soft p-4 text-sm"
        >
          <Inbox className="size-4 shrink-0 text-amber-accent-hover" aria-hidden="true" />
          <span className="font-medium text-ink-900">
            {stats.newEnquiries} new{' '}
            {stats.newEnquiries === 1 ? 'enquiry' : 'enquiries'} waiting
          </span>
          <ArrowRight className="ml-auto size-4 text-amber-accent-hover" aria-hidden="true" />
        </Link>
      ) : null}

      <div className="mt-9">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent projects</h2>
          <Link
            href="/admin/projects"
            className="text-sm font-medium text-slate-muted hover:text-ink-900"
          >
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="mt-4 rounded-[var(--radius-card)] border border-dashed border-line-strong bg-paper-raised px-6 py-12 text-center">
            <p className="text-sm font-medium">No projects yet</p>
            <p className="mt-1 text-xs text-slate-muted">
              Add your first project and upload photos of the finished job.
            </p>
            <Link
              href="/admin/projects/new"
              className="mt-5 inline-flex h-10 items-center rounded-[var(--radius-card)] bg-ink-950 px-5 text-sm font-semibold text-paper"
            >
              Add project
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper-raised">
            {recent.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/admin/projects/${project.id}/edit`}
                  className="flex items-center gap-4 p-4 hover:bg-paper-sunken"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{project.title}</p>
                    <p className="mt-0.5 text-xs text-slate-muted">
                      {[project.category?.name, project.city, formatDate(project.created_at)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <Badge tone={project.status === 'published' ? 'success' : 'muted'}>
                    {project.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
