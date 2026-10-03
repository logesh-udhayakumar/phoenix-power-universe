import Link from 'next/link'
import { MessageCircle, Phone } from 'lucide-react'
import { siteConfig, whatsappHref, telHref } from '@/config/site'
import { cn } from '@/lib/utils/cn'

/** One reusable WhatsApp entry point. The number always comes from settings,
 *  never from a literal in a page, and the link simply does not render when no
 *  number has been configured yet. */
export function WhatsAppLink({
  number,
  className,
  children,
  message = siteConfig.whatsappMessage,
}: {
  number: string
  className?: string
  children: React.ReactNode
  message?: string
}) {
  const href = whatsappHref(number, message)
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label="Chat with us on WhatsApp"
    >
      {children}
    </a>
  )
}

export function CallLink({
  number,
  className,
  children,
}: {
  number: string
  className?: string
  children: React.ReactNode
}) {
  const href = telHref(number)
  if (!href) return null
  return (
    <a href={href} className={className} aria-label={`Call ${siteConfig.name}`}>
      {children}
    </a>
  )
}

/** Sticky mobile action bar — the two things a visitor on a phone actually
 *  wants. Hidden on desktop, where the header CTA is already visible. */
export function MobileActionBar({
  phone,
  whatsapp,
}: {
  phone: string
  whatsapp: string
}) {
  const hasCall = Boolean(telHref(phone))
  const hasChat = Boolean(whatsappHref(whatsapp, siteConfig.whatsappMessage))
  if (!hasCall && !hasChat) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper-raised p-3 md:hidden">
        <Link
          href="/contact"
          className="flex h-11 items-center justify-center rounded-[var(--radius-card)] bg-ink-950 text-sm font-semibold text-paper"
        >
          Get a Quote
        </Link>
      </div>
    )
  }
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-line bg-paper-raised/95 p-3 backdrop-blur md:hidden">
      <CallLink
        number={phone}
        className={cn(
          'flex h-11 items-center justify-center gap-2 rounded-[var(--radius-card)]',
          'border border-line-strong text-sm font-semibold text-ink-900',
        )}
      >
        <Phone className="size-4" aria-hidden="true" />
        Call
      </CallLink>
      <WhatsAppLink
        number={whatsapp}
        className="flex h-11 items-center justify-center gap-2 rounded-[var(--radius-card)] bg-amber-accent text-sm font-semibold text-white"
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        WhatsApp
      </WhatsAppLink>
    </div>
  )
}
