import Link from 'next/link'
import { ArrowRight, ShieldCheck, Clock, Users, Wrench } from 'lucide-react'
import { Section, SectionHeading, EmptyState } from '@/components/public/section'
import { ProjectGrid } from '@/components/projects/project-card'
import { HeroSlideshow } from '@/components/public/hero-slideshow'
import { Testimonials } from '@/components/public/testimonials'
import {
  getCategories,
  getFeaturedProjects,
  getServices,
  getTestimonials,
} from '@/lib/queries'
import { HERO_IMAGES, shuffledHeroImages } from '@/config/hero'
import { siteConfig } from '@/config/site'

/** Read straight from the database on every request: when the owner publishes
 *  a project before a client meeting, it must be on the homepage immediately,
 *  not after a revalidation window. */
export const dynamic = 'force-dynamic'

const WHY_US = [
  {
    icon: Users,
    title: 'One team, both trades',
    body: 'Electrical and plumbing handled together, so nothing falls between two contractors.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety first',
    body: 'Work is tested and commissioned before handover, and documented for your records.',
  },
  {
    icon: Clock,
    title: 'Maintenance that follows through',
    body: 'Planned and reactive maintenance, not just installation and goodbye.',
  },
  {
    icon: Wrench,
    title: 'Proof, not promises',
    body: 'Every claim on this site is backed by a project you can look at in detail.',
  },
] as const

export default async function HomePage() {
  const [featured, services, testimonials, categories] = await Promise.all([
    getFeaturedProjects(siteConfig.featuredProjectLimit),
    getServices(),
    getTestimonials(),
    getCategories(),
  ])

  // The eyebrow lists the trades the company actually has categories for,
  // rather than a hard-coded line that drifts out of date the moment the
  // owner adds or renames one.
  const eyebrow =
    categories.length > 0
      ? categories.map((c) => c.name).join(' · ')
      : 'Electrical · Plumbing · Maintenance'

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="relative isolate overflow-hidden bg-ink-950 text-paper">
        <HeroSlideshow images={shuffledHeroImages()} />
        {HERO_IMAGES.length > 0 ? (
          <div
            className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/75 to-ink-950/40"
            aria-hidden="true"
          />
        ) : null}

        <div className="container-page relative py-24 md:py-36">
          <div className="max-w-2xl animate-rise">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] md:text-6xl">
              Powering spaces.
              <br />
              Building trust.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-paper/80 md:text-lg">
              {siteConfig.description}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/projects"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-[var(--radius-card)] bg-amber-accent px-7 text-base font-semibold text-white transition-colors hover:bg-amber-accent-hover"
              >
                View Our Work
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-13 items-center justify-center rounded-[var(--radius-card)] border border-white/25 px-7 text-base font-semibold text-paper transition-colors hover:bg-white/10"
              >
                Get a Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ featured projects */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Our work"
            title="Featured projects"
            description="Finished jobs, photographed on site. Every project here was delivered by our own team."
          />
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900 hover:text-amber-accent-hover"
          >
            View all projects
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10">
          {featured.length === 0 ? (
            <EmptyState
              title="Projects coming soon."
              description="Completed projects will be published here."
            />
          ) : (
            <ProjectGrid projects={featured} />
          )}
        </div>
      </Section>

      {/* -------------------------------------------------------- services */}
      <Section className="bg-paper-sunken">
        <SectionHeading
          eyebrow="What we do"
          title="Lighting, Electrical and Plumbing under one contract"
          description="Interior and profile lighting, electrical installation, plumbing and water motor work — for homes, shops and commercial sites."
        />

        {services.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="Services are being added."
              description="Services are managed from the admin panel and will appear here once added."
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {services.slice(0, 6).map((service) => (
              <Link
                key={service.id}
                href={`/services/${service.slug}`}
                className="group flex flex-col rounded-[var(--radius-card)] border border-line bg-paper-raised p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)]"
              >
                <Wrench className="size-6 text-amber-accent" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold">{service.name}</h3>
                {service.description ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-muted">
                    {service.description}
                  </p>
                ) : null}
                {service.details.length > 0 ? (
                  <ul className="mt-4 space-y-1.5 text-sm text-slate-muted">
                    {service.details.slice(0, 4).map((detail) => (
                      <li key={detail} className="flex gap-2">
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-amber-accent" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                  Learn more
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* ----------------------------------------------------- why choose us */}
      <Section>
        <SectionHeading
          eyebrow="Why work with us"
          title="A contractor you can hand the whole job to"
        />
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_US.map((item) => (
            <div key={item.title}>
              <item.icon className="size-6 text-amber-accent" aria-hidden="true" />
              <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------ testimonials */}
      {testimonials.length > 0 ? (
        <Section>
          <SectionHeading
            eyebrow="In their words"
            title="What clients say"
            description="Feedback from the people whose sites we have worked on."
          />
          <div className="mt-10">
            <Testimonials testimonials={testimonials.slice(0, 6)} />
          </div>
        </Section>
      ) : null}

      {/* -------------------------------------------------------------- cta */}
      <Section className="pb-24">
        <div className="rounded-[var(--radius-card)] bg-ink-950 px-7 py-14 text-center text-paper md:px-16 md:py-20">
          <h2 className="text-3xl font-bold text-paper md:text-4xl">
            Have a project in mind?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-paper/75">
            Tell us what you need and we will come back to you with a clear scope and
            a quote.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex h-13 items-center justify-center gap-2 rounded-[var(--radius-card)] bg-amber-accent px-8 text-base font-semibold text-white transition-colors hover:bg-amber-accent-hover"
          >
            Get a Quote
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </Section>
    </>
  )
}
