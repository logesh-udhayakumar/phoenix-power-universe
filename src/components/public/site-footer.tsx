import Link from 'next/link'
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { siteConfig } from '@/config/site'
import type { CompanyDetails } from '@/lib/settings'
import type { Category } from '@/types/db'
import { CallLink, WhatsAppLink } from './whatsapp-cta'
import { PhoenixLogo } from './phoenix-logo'

/** Contact rows render only when a value exists — an unconfigured phone
 *  number shows nothing rather than a placeholder that looks real. */
export function SiteFooter({
  company,
  categories,
}: {
  company: CompanyDetails
  categories: Category[]
}) {
  // Evaluated on every render, and these pages render per request, so the
  // copyright year follows the real clock rather than needing a yearly edit.
  const year = new Date().getFullYear()

  return (
    <footer className="mt-24 border-t border-line bg-ink-950 text-paper">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <PhoenixLogo markClassName="size-8" textClassName="text-paper" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-soft">
            {siteConfig.description}
          </p>
        </div>

        <nav aria-label="Services">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-soft">
            What we do
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={{ pathname: '/projects', query: { category: category.slug } }}
                  className="text-paper/85 hover:text-paper"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-soft">
            Company
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/projects" className="text-paper/85 hover:text-paper">
                Our Work
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-paper/85 hover:text-paper">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-paper/85 hover:text-paper">
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-soft">
            Get in touch
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {company.phone ? (
              <li>
                <CallLink
                  number={company.phone}
                  className="inline-flex items-center gap-2 text-paper/85 hover:text-paper"
                >
                  <Phone className="size-4" aria-hidden="true" />
                  {company.phone}
                </CallLink>
              </li>
            ) : null}
            {company.whatsapp ? (
              <li>
                <WhatsAppLink
                  number={company.whatsapp}
                  className="inline-flex items-center gap-2 text-paper/85 hover:text-paper"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp
                </WhatsAppLink>
              </li>
            ) : null}
            {company.email ? (
              <li>
                <a
                  href={`mailto:${company.email}`}
                  className="inline-flex items-center gap-2 text-paper/85 hover:text-paper"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  {company.email}
                </a>
              </li>
            ) : null}
            {company.address ? (
              <li className="flex items-start gap-2 text-paper/85">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{company.address}</span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      {company.serviceAreas.length > 0 ? (
        <div className="border-t border-white/10">
          <div className="container-page py-5 text-sm text-slate-soft">
            <span className="font-medium text-paper/85">Service areas: </span>
            {company.serviceAreas.join(' · ')}
          </div>
        </div>
      ) : null}

      <div className="border-t border-white/10">
        <div className="container-page py-5 text-xs text-slate-soft">
          <p>
            © {year} {siteConfig.name}
          </p>
        </div>
      </div>
    </footer>
  )
}
