/** Streaming skeleton for the public pages. Next returns 200 for streamed
 *  responses, and injects `noindex` into streamed 404s so they are still
 *  kept out of search results. */
export default function Loading() {
  return (
    <div className="container-page py-24">
      <div className="h-8 w-48 animate-pulse rounded bg-paper-sunken" />
      <div className="mt-4 h-4 w-72 animate-pulse rounded bg-paper-sunken" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] animate-pulse rounded-[var(--radius-card)] bg-paper-sunken"
          />
        ))}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  )
}
