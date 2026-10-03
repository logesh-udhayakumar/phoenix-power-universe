'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Quote,
  Settings,
  Tags,
  Users2,
  Wrench,
  X,
  ExternalLink,
} from 'lucide-react'
import type { Route } from 'next'
import { cn } from '@/lib/utils/cn'
import { signOut } from '@/app/admin/login/actions'

/** Plain-language labels only. The owner should never meet the word "slug",
 *  "entity" or "media asset" anywhere in this interface. */
const NAV = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/admin/projects', icon: FolderKanban },
  { label: 'Categories', href: '/admin/categories', icon: Tags },
  { label: 'Services', href: '/admin/services', icon: Wrench },
  { label: 'Testimonials', href: '/admin/testimonials', icon: Quote },
  { label: 'Enquiries', href: '/admin/enquiries', icon: Inbox },
  { label: 'Users', href: '/admin/users', icon: Users2 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
] as const

export function AdminShell({
  email,
  children,
}: {
  email: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Admin">
      {NAV.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href as Route}
            onClick={() => setOpen(false)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-[var(--radius-card)] px-3 py-2.5 text-sm transition-colors',
              active
                ? 'bg-ink-950 font-semibold text-paper'
                : 'text-ink-700 hover:bg-paper-sunken',
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-dvh">
      {/* ---------------------------------------------- desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-line bg-paper-raised lg:flex lg:flex-col">
        <div className="border-b border-line px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-950">
            Phoenix Power
          </p>
          <p className="mt-0.5 text-xs text-slate-muted">Admin</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{nav}</div>
        <SidebarFooter email={email} />
      </aside>

      {/* ------------------------------------------------ mobile header */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-line bg-paper-raised px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open admin menu"
            className="inline-flex size-10 items-center justify-center"
          >
            <Menu className="size-5" />
          </button>
          <p className="text-xs font-bold uppercase tracking-[0.12em]">
            Phoenix Power Admin
          </p>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Log out"
              className="inline-flex size-10 items-center justify-center text-slate-muted"
            >
              <LogOut className="size-5" />
            </button>
          </form>
        </header>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink-950/40"
            />
            <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-paper-raised">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em]">
                  Phoenix Power Admin
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex size-9 items-center justify-center"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">{nav}</div>
              <SidebarFooter email={email} />
            </div>
          </div>
        ) : null}

        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  )
}

function SidebarFooter({ email }: { email: string }) {
  return (
    <div className="border-t border-line p-3">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-[var(--radius-card)] px-3 py-2.5 text-sm text-ink-700 hover:bg-paper-sunken"
      >
        <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
        View website
      </a>
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-[var(--radius-card)] px-3 py-2.5 text-sm text-ink-700 hover:bg-paper-sunken"
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          Log out
        </button>
      </form>
      <p className="truncate px-3 pt-2 text-xs text-slate-soft" title={email}>
        {email}
      </p>
    </div>
  )
}
