import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { ArrowRight, Check, Wrench } from 'lucide-react'
import { EmptyState } from '@/components/public/section'
import { ServiceSearch } from '@/components/public/service-search'
import { getServices } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Electrical works, plumbing works, interior and profile lighting, and maintenance for residential, commercial and industrial sites.',
  alternates: { canonical: '/services' },
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q
  const query = (rawQuery ?? '').trim().toLowerCase()

  const all = await getServices()

  // Matched against the name, the description and the "what this includes"
  // list, so searching for a task finds the service that performs it even
  // when the name does not contain that word.
  const services = query
    ? all.filter((service) =>
        [service.name, service.description ?? '', ...service.details]
          .join(' ')
          .toLowerCase()
          .includes(query),
      )
    : all

  return (
    <>
      <section className="border-b border-line bg-paper-sunken">
        <div className="container-page py-14 md:py-20">
          <p className="eyebrow">What we do</p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">Our services</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-muted">
            Electrical and plumbing work delivered by one team, from installation
            through to testing, commissioning and ongoing maintenance.
          </p>
        </div>
      </section>

      <div className="container-page py-10 md:py-14">
        <Suspense fallback={<div className="h-11" />}>
          <ServiceSearch resultCount={services.length} />
        </Suspense>

        <div className="mt-8">
          {all.length === 0 ? (
            <EmptyState
              title="Services are being added."
              description="Services are managed from the admin panel and will appear here once added."
            />
          ) : services.length === 0 ? (
            <EmptyState
              title="No services match that search."
              description="Try a different word, or clear the search to see everything we do."
            />
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={`/services/${service.slug}`}
                  className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper-raised shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-raised)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-paper-sunken">
                    {service.image_url ? (
                      <Image
                        src={service.image_url}
                        alt={service.name}
                        fill
                        loading="lazy"
                        sizes="(min-width: 768px) 45vw, 92vw"
                        quality={75}
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-slate-soft">
                        <Wrench className="size-8" aria-hidden="true" />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-7">
                    <h2 className="text-xl font-semibold">{service.name}</h2>
                    {service.description ? (
                      <p className="mt-3 text-sm leading-relaxed text-slate-muted">
                        {service.description}
                      </p>
                    ) : null}

                    {service.details.length > 0 ? (
                      <ul className="mt-5 grid gap-2 text-sm text-ink-800 sm:grid-cols-2">
                        {service.details.slice(0, 6).map((detail) => (
                          <li key={detail} className="flex gap-2">
                            <Check
                              className="mt-0.5 size-4 shrink-0 text-amber-accent"
                              aria-hidden="true"
                            />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                      View service
                      <ArrowRight
                        className="size-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
