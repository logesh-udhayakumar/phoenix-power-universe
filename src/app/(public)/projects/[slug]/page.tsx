import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarCheck,
  Check,
  Images,
  MapPin,
  Tag,
} from 'lucide-react'
import { ProjectCard } from '@/components/projects/project-card'
import { ProjectGallery } from '@/components/projects/project-gallery'
import { Section, SectionHeading } from '@/components/public/section'
import { getProjectBySlug, getPublishedProjects } from '@/lib/queries'
import { completionYear, placeLine } from '@/lib/utils/format'
import { externalMediaFor } from '@/lib/media-links'
import { siteConfig } from '@/config/site'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) return { title: 'Project not found' }

  const place = placeLine(project.city, project.state)
  const title = `${project.title}${place ? ` | ${place}` : ''}`
  const description =
    project.description?.slice(0, 155) ??
    `${project.category?.name ?? 'Project'} by ${siteConfig.name}${place ? ` in ${place}` : ''}.`

  return {
    title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: `${siteConfig.name} | ${title}`,
      description,
      type: 'article',
      url: `${siteConfig.url}/projects/${project.slug}`,
      images: project.cover_image_url ? [{ url: project.cover_image_url }] : undefined,
    },
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) notFound()

  const place = placeLine(project.location, project.city, project.state)
  const year = completionYear(project.completion_date)
  const links = externalMediaFor(project.media_links)
  const photoCount =
    project.media.filter((m) => m.media_type === 'image').length +
    links.filter((l) => l.kind === 'image').length
  const videoCount =
    project.media.filter((m) => m.media_type === 'video').length +
    links.filter((l) => l.kind === 'youtube' || l.kind === 'video').length

  const related = (await getPublishedProjects({ limit: 4 }))
    .filter((p) => p.id !== project.id)
    .slice(0, 3)

  const facts = [
    { icon: Tag, label: 'Category', value: project.category?.name },
    { icon: Building2, label: 'Project type', value: project.project_type },
    { icon: MapPin, label: 'Location', value: place || undefined },
    { icon: CalendarCheck, label: 'Completed', value: year ?? undefined },
  ].filter((f) => Boolean(f.value))

  return (
    <article>
      {/* ------------------------------------------------------------ hero */}
      <header className="relative isolate overflow-hidden bg-ink-950 text-paper">
        {project.cover_image_url ? (
          <>
            <Image
              src={project.cover_image_url}
              alt=""
              fill
              priority
              sizes="100vw"
              quality={75}
              className="object-cover opacity-35"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/80 to-ink-950/50"
              aria-hidden="true"
            />
          </>
        ) : null}

        <div className="container-page relative py-12 md:py-20">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-medium text-paper/70 transition-colors hover:text-paper"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Our Work
          </Link>

          <div className="mt-8 max-w-3xl">
            {project.category ? (
              <p className="eyebrow">{project.category.name}</p>
            ) : null}
            <h1 className="mt-2 text-3xl font-bold leading-[1.1] md:text-5xl">
              {project.title}
            </h1>

            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-paper/80">
              {place ? (
                <li className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-amber-accent" aria-hidden="true" />
                  {place}
                </li>
              ) : null}
              <li className="inline-flex items-center gap-1.5">
                <Building2 className="size-4 text-amber-accent" aria-hidden="true" />
                {project.project_type}
              </li>
              {year ? (
                <li className="inline-flex items-center gap-1.5">
                  <CalendarCheck className="size-4 text-amber-accent" aria-hidden="true" />
                  Completed {year}
                </li>
              ) : null}
              {photoCount > 0 ? (
                <li className="inline-flex items-center gap-1.5">
                  <Images className="size-4 text-amber-accent" aria-hidden="true" />
                  {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
                  {videoCount > 0
                    ? ` · ${videoCount} ${videoCount === 1 ? 'video' : 'videos'}`
                    : ''}
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------- facts strip */}
      {facts.length > 0 ? (
        <div className="border-b border-line bg-paper-sunken">
          <div className="container-page grid grid-cols-2 gap-px py-0 md:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="py-5 pr-4">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-soft">
                  <fact.icon className="size-3.5" aria-hidden="true" />
                  {fact.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink-950">{fact.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="container-page grid gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
        <div className="min-w-0">
          {project.description ? (
            <section>
              <h2 className="text-xl font-semibold">Project overview</h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-ink-800">
                {project.description.split(/\n{2,}/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          ) : null}

          {project.scope_of_work.length > 0 ? (
            <section className="mt-12">
              <h2 className="text-xl font-semibold">Scope of work</h2>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {project.scope_of_work.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 rounded-[var(--radius-card)] bg-paper-sunken px-4 py-3 text-sm text-ink-800"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-amber-accent"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {project.media.length + links.length > 0 ? (
            <section className="mt-12">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl font-semibold">Project gallery</h2>
                <p className="text-sm text-slate-muted">
                  Tap any photo to view it full screen
                </p>
              </div>
              <div className="mt-5">
                <ProjectGallery
                  media={project.media}
                  links={links}
                  projectTitle={project.title}
                />
              </div>
            </section>
          ) : null}
        </div>

        {/* ------------------------------------------------------- sidebar */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[var(--radius-card)] border border-line bg-paper-raised p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-base font-semibold">Need something similar?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-muted">
              Tell us about your site and we will come back with a scope and a quote.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-card)] bg-amber-accent text-sm font-semibold text-white transition-colors hover:bg-amber-accent-hover"
            >
              Get a quote
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/projects"
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-card)] border border-line-strong text-sm font-semibold text-ink-900 hover:bg-paper-sunken"
            >
              See more of our work
            </Link>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <Section className="border-t border-line bg-paper-sunken">
          <SectionHeading eyebrow="Keep looking" title="More projects" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProjectCard key={item.id} project={item} />
            ))}
          </div>
        </Section>
      ) : null}
    </article>
  )
}
