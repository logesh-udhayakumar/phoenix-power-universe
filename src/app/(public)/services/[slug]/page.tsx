import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { ProjectCard } from '@/components/projects/project-card'
import { Section, SectionHeading } from '@/components/public/section'
import { getPublishedProjects, getServiceBySlug } from '@/lib/queries'
import { siteConfig } from '@/config/site'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const service = await getServiceBySlug(slug)
  if (!service) return { title: 'Service not found' }

  const description =
    service.description?.slice(0, 155) ??
    `${service.name} by ${siteConfig.name}.`

  return {
    title: service.name,
    description,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: `${siteConfig.name} | ${service.name}`,
      description,
      url: `${siteConfig.url}/services/${service.slug}`,
      images: service.image_url ? [{ url: service.image_url }] : undefined,
    },
  }
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const service = await getServiceBySlug(slug)
  if (!service) notFound()

  // Projects in the category that shares this service's slug, when one exists.
  const related = (await getPublishedProjects({ category: slug, limit: 3 })).slice(0, 3)

  return (
    <>
      <div className="container-page pt-8">
        <Link
          href="/services"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-muted hover:text-ink-950"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All services
        </Link>
      </div>

      {/* Single column when there is no picture yet, so the copy is not left
          hugging one half of an empty row. */}
      <div
        className={
          service.image_url
            ? 'container-page grid gap-10 py-10 lg:grid-cols-2 lg:items-start lg:gap-16 lg:py-14'
            : 'container-page max-w-3xl py-10 lg:py-14'
        }
      >
        <div>
          <p className="eyebrow">Service</p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">{service.name}</h1>
          {service.description ? (
            <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-800">
              {service.description.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ) : null}

          {service.details.length > 0 ? (
            <>
              <h2 className="mt-10 text-lg font-semibold">What this includes</h2>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {service.details.map((detail) => (
                  <li key={detail} className="flex gap-2.5 text-sm text-ink-800">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-amber-accent"
                      aria-hidden="true"
                    />
                    {detail}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <Link
            href="/contact"
            className="mt-10 inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-card)] bg-amber-accent px-7 text-sm font-semibold text-white transition-colors hover:bg-amber-accent-hover"
          >
            Enquire about {service.name}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {service.image_url ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-paper-sunken">
            <Image
              src={service.image_url}
              alt={service.name}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 92vw"
              quality={75}
              className="object-cover"
            />
          </div>
        ) : null}
      </div>

      {related.length > 0 ? (
        <Section className="bg-paper-sunken">
          <SectionHeading eyebrow="Proof" title={`${service.name} projects`} />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  )
}
