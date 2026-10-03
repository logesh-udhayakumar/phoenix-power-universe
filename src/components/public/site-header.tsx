'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { mainNav } from '@/config/navigation'
import { PhoenixLogo } from './phoenix-logo'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils/cn'

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close the menu on navigation, otherwise it stays open over the new page.
  // Adjusted during render rather than in an effect: React re-renders before
  // painting, so the menu never flashes on the new page.
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  // Lock background scrolling while the overlay menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-20">
        <Link href="/" aria-label={`${siteConfig.name} — home`}>
          <PhoenixLogo
            markClassName="size-7 text-ink-950 md:size-8"
            textClassName="text-ink-950 md:text-[0.9375rem]"
          />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'text-sm transition-colors hover:text-ink-950',
                isActive(item.href)
                  ? 'font-semibold text-ink-950'
                  : 'text-slate-muted',
                'emphasis' in item && item.emphasis && 'font-semibold uppercase tracking-wide',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/contact"
            className="inline-flex h-11 items-center rounded-[var(--radius-card)] bg-amber-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-amber-accent-hover"
          >
            Get a Quote
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="-mr-2 inline-flex size-11 items-center justify-center text-ink-900 md:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-16 bottom-0 z-50 animate-rise overflow-y-auto border-t border-line bg-paper px-5 pb-28 pt-2 md:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={cn(
                  'border-b border-line py-4 text-lg',
                  isActive(item.href)
                    ? 'font-semibold text-ink-950'
                    : 'text-ink-700',
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-[var(--radius-card)] bg-amber-accent text-base font-semibold text-white"
            >
              Get a Quote
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
