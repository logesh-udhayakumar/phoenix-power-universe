import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ImageOff, Play } from 'lucide-react'
import type { ProjectListItem } from '@/types/db'
import { completionYear, placeLine } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

/** Listing card. The image is the product here, so it gets the space and the
 *  text stays out of its way. `sizes` is set for every breakpoint so phones
 *  never download a desktop-width file. */
export function ProjectCard({
  project,
  priority = false,
  className,
}: {
  project: ProjectListItem
  priority?: boolean
  className?: string
}) {
  const year = completionYear(project.completion_date)
  const place = placeLine(project.city, project.state)

  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper-raised',
        'shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-raised)]',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-sunken">
        {project.cover_image_url ? (
          <Image
            src={project.cover_image_url}
            alt={`${project.title} — ${project.category?.name ?? 'project'} by Phoenix Power Universe`}
            fill
            sizes="(min-width: 1280px) 384px, (min-width: 768px) 45vw, 92vw"
            quality={75}
            {...(priority ? { loading: 'eager' as const, fetchPriority: 'high' as const } : {})}
            className="object-cover transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-soft">
            <ImageOff className="size-8" aria-hidden="true" />
            <span className="sr-only">No photo yet</span>
          </div>
        )}

        {project.has_video ? (
          <span
            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-sm bg-ink-950/85 px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-paper"
            title="This project includes video"
          >
            <Play className="size-3 fill-current" aria-hidden="true" />
            Video
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="text-base font-semibold leading-snug text-ink-950">
          {project.title}
        </h3>
        {project.category ? (
          <p className="text-sm text-amber-accent-hover">{project.category.name}</p>
        ) : null}
        <p className="text-sm text-slate-muted">
          {[project.project_type, place, year].filter(Boolean).join(' · ')}
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
          View Project
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  )
}

export function ProjectGrid({ projects }: { projects: ProjectListItem[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, i) => (
        <ProjectCard key={project.id} project={project} priority={i < 3} />
      ))}
    </div>
  )
}
