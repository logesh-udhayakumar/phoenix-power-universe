'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { Route } from 'next'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { PROJECT_TYPES } from '@/config/navigation'
import type { Category } from '@/types/db'
import { cn } from '@/lib/utils/cn'

/** Filters for the project portfolio.
 *
 *  Written to the URL rather than to local state, so a filtered view is a
 *  shareable link (/projects?category=electrical) and the back button works.
 *
 *  The layout follows the convention people already know from shopping and
 *  property sites: one search box, then labelled filter groups, then a
 *  summary line with removable chips for whatever is active. On a phone the
 *  groups collapse behind a single "Filters" button with a count, so the
 *  photographs stay the first thing on screen.
 */
export function ProjectFilters({
  categories,
  resultCount,
}: {
  categories: Category[]
  resultCount: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [panelOpen, setPanelOpen] = useState(false)

  const activeCategory = searchParams.get('category') ?? ''
  const activeType = searchParams.get('type') ?? ''
  const activeSearch = searchParams.get('q') ?? ''

  const [searchInput, setSearchInput] = useState(activeSearch)

  // The box owns its own text after mount; it is never re-synced FROM the URL.
  // Mirroring the URL back into it meant the debounced push echoed in and
  // overwrote whatever had been typed in the meantime — typing "motor"
  // quickly would snap back to "moto". The clear controls below reset the
  // text directly instead.

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      const query = params.toString()
      startTransition(() => {
        // typedRoutes cannot verify a URL assembled at runtime; the parts are
        // our own pathname plus encoded query values, so the cast is safe.
        router.replace((query ? `${pathname}?${query}` : pathname) as Route, {
          scroll: false,
        })
      })
    },
    [pathname, router, searchParams],
  )

  // Debounce typing so every keystroke is not a server round trip.
  useEffect(() => {
    const term = searchInput.trim()
    if (term === activeSearch) return
    const id = setTimeout(() => setParam('q', term), 350)
    return () => clearTimeout(id)
  }, [searchInput, activeSearch, setParam])

  const activeCount = [activeCategory, activeType, activeSearch].filter(Boolean).length
  const categoryName = categories.find((c) => c.slug === activeCategory)?.name

  const clearAll = () => {
    setSearchInput('')
    startTransition(() => router.replace(pathname as Route, { scroll: false }))
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-paper-raised">
      {/* --------------------------------------------------- search row */}
      <div className="flex items-center gap-3 border-b border-line p-4">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-soft"
            aria-hidden="true"
          />
          <input
            type="text"
            inputMode="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by project name, city or area"
            aria-label="Search projects"
            className="h-11 w-full rounded-[var(--radius-card)] border border-line-strong bg-paper pl-10 pr-3 text-sm placeholder:text-slate-soft focus:border-amber-accent"
          />
        </div>

        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
          aria-controls="project-filter-panel"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[var(--radius-card)] border border-line-strong px-4 text-sm font-medium md:hidden"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
          {activeCount > 0 ? (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-ink-950 text-[0.6875rem] font-bold text-paper">
              {activeCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* -------------------------------------------------- filter groups */}
      <div
        id="project-filter-panel"
        className={cn(
          'flex-col gap-5 p-4 md:flex md:flex-row md:flex-wrap md:gap-8',
          panelOpen ? 'flex' : 'hidden',
        )}
      >
        <FilterGroup label="Service">
          <FilterChip
            label="All"
            active={!activeCategory}
            onClick={() => setParam('category', '')}
          />
          {categories.map((category) => (
            <FilterChip
              key={category.id}
              label={category.name}
              active={activeCategory === category.slug}
              onClick={() => setParam('category', category.slug)}
            />
          ))}
        </FilterGroup>

        <FilterGroup label="Project type">
          <FilterChip label="All" active={!activeType} onClick={() => setParam('type', '')} />
          {PROJECT_TYPES.map((type) => (
            <FilterChip
              key={type}
              label={type}
              active={activeType === type}
              onClick={() => setParam('type', type)}
            />
          ))}
        </FilterGroup>
      </div>

      {/* ------------------------------------------------- result summary */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line px-4 py-3">
        <p className={cn('text-sm text-slate-muted', isPending && 'opacity-50')}>
          <span className="font-semibold text-ink-900">{resultCount}</span>{' '}
          {resultCount === 1 ? 'project' : 'projects'}
        </p>

        {categoryName ? (
          <ActiveChip label={categoryName} onRemove={() => setParam('category', '')} />
        ) : null}
        {activeType ? (
          <ActiveChip label={activeType} onRemove={() => setParam('type', '')} />
        ) : null}
        {activeSearch ? (
          <ActiveChip
            label={`“${activeSearch}”`}
            onRemove={() => {
              setSearchInput('')
              setParam('q', '')
            }}
          />
        ) : null}

        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto text-sm font-medium text-ink-900 underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        ) : null}
      </div>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-soft">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-9 rounded-full border px-4 text-sm transition-colors',
        active
          ? 'border-ink-950 bg-ink-950 font-semibold text-paper'
          : 'border-line-strong bg-paper text-ink-700 hover:border-ink-600',
      )}
    >
      {label}
    </button>
  )
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-sunken px-3 py-1 text-xs font-medium text-ink-800">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        className="text-slate-muted hover:text-ink-950"
      >
        <X className="size-3.5" />
      </button>
    </span>
  )
}
