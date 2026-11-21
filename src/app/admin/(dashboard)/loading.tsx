import { Spinner } from '@/components/ui/spinner'

/** Shown inside the admin shell while a dashboard page loads its data, so a
 *  sidebar click swaps to this instantly instead of appearing to do nothing. */
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 text-sm text-slate-muted">
        <Spinner className="text-amber-accent" />
        Loading…
      </div>
      <div className="h-8 w-56 animate-pulse rounded bg-paper-sunken" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-[var(--radius-card)] bg-paper-sunken"
          />
        ))}
      </div>
    </div>
  )
}
