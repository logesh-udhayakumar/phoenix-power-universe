import type { Metadata } from 'next'
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { EnquiryForm } from '@/components/forms/enquiry-form'
import { CallLink, WhatsAppLink } from '@/components/public/whatsapp-cta'
import { getCompanyDetails } from '@/lib/settings'
import { siteConfig } from '@/config/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Contact',
  description: `Contact ${siteConfig.name} about an electrical, plumbing, lighting or maintenance project.`,
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const company = await getCompanyDetails()

  return (
    <>
      <section className="border-b border-line bg-paper-sunken">
        <div className="container-page py-14 md:py-20">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
            Let&rsquo;s discuss your project.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-muted">
            Send the details through and we will come back to you with a scope and a
            quote. For anything urgent, call or message us directly.
          </p>
        </div>
      </section>

      {/* ------------------------------------------- direct contact cards */}
      <div className="container-page -mt-px">
        <div className="grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
          {company.phone ? (
            <CallLink number={company.phone} className="group">
              <ContactCard
                icon={Phone}
                label="Call us"
                value={company.phone}
                hint="Quickest for anything urgent"
              />
            </CallLink>
          ) : null}

          {company.whatsapp ? (
            <WhatsAppLink number={company.whatsapp} className="group">
              <ContactCard
                icon={MessageCircle}
                label="WhatsApp"
                value="Send us a message"
                hint="Share photos of the site"
                accent
              />
            </WhatsAppLink>
          ) : null}

          {company.email ? (
            <a href={`mailto:${company.email}`} className="group">
              <ContactCard
                icon={Mail}
                label="Email"
                value={company.email}
                hint="For drawings and documents"
              />
            </a>
          ) : null}
        </div>
      </div>

      {/* --------------------------------------------------- form + aside */}
      <div className="container-page grid gap-10 pb-16 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14 md:pb-24">
        <div className="rounded-[var(--radius-card)] border border-line bg-paper-raised p-6 shadow-[var(--shadow-card)] md:p-8">
          <h2 className="text-xl font-semibold">Send an enquiry</h2>
          <p className="mt-1.5 text-sm text-slate-muted">
            Tell us what the job involves. Fields marked{' '}
            <span className="text-danger">*</span> are required.
          </p>
          <div className="mt-7">
            <EnquiryForm />
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          {company.serviceAreas.length > 0 ? (
            <InfoPanel icon={MapPin} title="Where we work">
              <p className="text-sm leading-relaxed text-ink-800">
                {company.serviceAreas.join(' · ')}
              </p>
              {company.mapsUrl ? (
                <a
                  href={company.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-ink-900 underline-offset-4 hover:underline"
                >
                  Open in Google Maps
                </a>
              ) : null}
            </InfoPanel>
          ) : null}

          {company.address ? (
            <InfoPanel icon={MapPin} title="Address">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-800">
                {company.address}
              </p>
            </InfoPanel>
          ) : null}

          <InfoPanel icon={Clock} title="What happens next">
            <ol className="space-y-3 text-sm text-ink-800">
              {[
                'We read your enquiry and come back to you to confirm the details.',
                'We survey the site before pricing, so the quote matches the actual job.',
                'You get a written scope and a quote to approve before any work starts.',
              ].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ink-950 text-[0.6875rem] font-bold text-paper">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </InfoPanel>
        </aside>
      </div>
    </>
  )
}

function ContactCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof Phone
  label: string
  value: string
  hint: string
  accent?: boolean
}) {
  return (
    <div
      className={
        accent
          ? 'flex h-full items-start gap-4 rounded-[var(--radius-card)] border border-amber-accent/40 bg-amber-soft p-5 transition-shadow group-hover:shadow-[var(--shadow-raised)]'
          : 'flex h-full items-start gap-4 rounded-[var(--radius-card)] border border-line bg-paper-raised p-5 shadow-[var(--shadow-card)] transition-shadow group-hover:shadow-[var(--shadow-raised)]'
      }
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink-950 text-paper">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-widest text-slate-soft">
          {label}
        </span>
        <span className="mt-1 block truncate text-sm font-semibold text-ink-950">
          {value}
        </span>
        <span className="mt-0.5 block text-xs text-slate-muted">{hint}</span>
      </span>
    </div>
  )
}

function InfoPanel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof MapPin
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-paper-raised p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-slate-soft">
        <Icon className="size-4 text-amber-accent" aria-hidden="true" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}
