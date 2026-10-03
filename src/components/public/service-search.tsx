'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import { useEffect, useState, useTransition } from 'react'
import { Search, X } from 'lucide-react'

/** Search box for the Services page.
 *
 *  Matches the project filters' behaviour: the term lives in the URL, so a
 *  search is shareable and the back button works. Filtering itself happens on
 *  the server, against the name and the "what this includes" list, so typing
 *  "motor" finds a service whose name does not contain the word.
 */
export function ServiceSearch({ resultCount }: { resultCount: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const activeSearch = searchParams.get('q') ?? ''
  const [value, setValue] = useState(activeSearch)

  // The box owns its own text after mount; it is never re-synced FROM the URL.
  // Mirroring the URL back into it meant the debounced push echoed in and
  // overwrote whatever had been typed in the meantime — typing "motor"
  // quickly would snap back to "moto". The in-page clear button resets the
  // text directly instead.
  useEffect(() => {
    const term = value.trim()
    if (term === activeSearch) return
    const id = setTimeout(() => {
      startTransition(() => {
        router.replace((term ? `${pathname}?q=${encodeURIComponent(term)}` : pathname) as Route, {
          scroll: false,
        })
      })
    }, 350)
    return () => clearTimeout(id)
  }, [value, activeSearch, pathname, router])

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative w-full sm:max-w-sm">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-soft"
          aria-hidden="true"
        />
        <input
          type="text"
          inputMode="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search services..."
          aria-label="Search services by name"
          className="h-11 w-full rounded-[var(--radius-card)] border border-line-strong bg-paper-raised pl-10 pr-10 text-sm placeholder:text-slate-soft focus:border-amber-accent"
        />
        {value ? (
          <button
            type="button"
            onClick={() => setValue('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-muted hover:bg-paper-sunken hover:text-ink-950"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <p
        aria-live="polite"
        className={isPending ? 'text-sm text-slate-muted opacity-50' : 'text-sm text-slate-muted'}
      >
        <span className="font-semibold text-ink-900">{resultCount}</span>{' '}
        {resultCount === 1 ? 'service' : 'services'}
      </p>
    </div>
  )
}
