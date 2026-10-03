import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, HardHat, ShieldCheck, Wrench } from 'lucide-react'
import { Section, SectionHeading } from '@/components/public/section'
import { getCompanyDetails } from '@/lib/settings'
import { siteConfig } from '@/config/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'About',
  description: `About ${siteConfig.name} — electrical, plumbing and maintenance contractors.`,
  alternates: { canonical: '/about' },
}

/** Deliberately contains no years of experience, project counts, certification
 *  names or client names. Those are claims only the owner can make, and an
 *  invented one would be a lie on a trust-building page. The copy here
 *  describes approach, which is true by construction. */
const APPROACH = [
  {
    icon: HardHat,
    title: 'Survey before quote',
    body: 'We look at the site before we price the work, so the quote reflects the job in front of us rather than a template.',
  },
  {
    icon: Wrench,
    title: 'One team, start to finish',
    body: 'The same team handles installation and the snagging that follows, so nothing gets handed off and lost.',
  },
  {
    icon: ShieldCheck,
    title: 'Tested and handed over',
    body: 'Electrical work is tested and commissioned, and we walk you through what was installed before we leave.',
  },
]

export default async function AboutPage() {
  const company = await getCompanyDetails()

  return (
    <>
      <section className="border-b border-line bg-paper-sunken">
        <div className="container-page py-14 md:py-20">
          <p className="eyebrow">About us</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Interior light design, electrical and plumbing, judged on finished work
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-muted">
            {siteConfig.name} delivers electrical, plumbing, maintenance and related
            technical works for residential, commercial and industrial clients. The
            projects section of this site is the honest version of our CV: real sites,
            photographed as they were handed over.
          </p>
          <Link
            href="/projects"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ink-900 hover:text-amber-accent-hover"
          >
            See our completed work
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <Section>
        <SectionHeading eyebrow="How we work" title="Our approach" />
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {APPROACH.map((item) => (
            <div key={item.title}>
              <item.icon className="size-6 text-amber-accent" aria-hidden="true" />
              <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="border-t border-line bg-paper-sunken">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">What we take on</h2>
            <ul className="mt-5 space-y-2.5 text-sm text-ink-800">
              {[
                'Electrical wiring, rewiring and lighting installation',
                'Distribution panels and power distribution',
                'Industrial electrical works, testing and commissioning',
                'Water pipeline installation and sanitary plumbing',
                'Drainage systems and pump installation',
                'Preventive maintenance, fault finding and repair works',
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-accent"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Where we work</h2>
            {company.serviceAreas.length > 0 ? (
              <p className="mt-5 text-sm leading-relaxed text-ink-800">
                {company.serviceAreas.join(' · ')}
              </p>
            ) : (
              <p className="mt-5 text-sm leading-relaxed text-slate-muted">
                We work across local and metropolitan areas. Get in touch to check
                whether we cover your site.
              </p>
            )}

            <h2 className="mt-10 text-2xl font-bold">Safety and quality</h2>
            <p className="mt-5 text-sm leading-relaxed text-ink-800">
              Work is carried out to the standards that apply to the installation, and
              tested before handover. If your project needs documented certification or
              a specific compliance sign-off, tell us at enquiry stage and we will
              confirm what we can provide before the work starts.
            </p>
          </div>
        </div>
      </Section>

      <Section className="pb-24">
        <div className="rounded-[var(--radius-card)] border border-line bg-paper-raised px-7 py-12 text-center shadow-[var(--shadow-card)] md:px-16">
          <h2 className="text-2xl font-bold md:text-3xl">Want to talk through a job?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-muted">
            Send us the details and we will come back to you with a scope and a quote.
          </p>
          <Link
            href="/contact"
            className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-card)] bg-ink-950 px-7 text-sm font-semibold text-paper transition-colors hover:bg-ink-800"
          >
            Contact us
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </Section>
    </>
  )
}
