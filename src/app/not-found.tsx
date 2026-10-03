import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-3xl font-bold">We could not find that page</h1>
      <p className="mt-3 max-w-md text-sm text-slate-muted">
        The page may have been moved, or the project you are looking for is no longer
        published.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/projects"
          className="inline-flex h-11 items-center rounded-[var(--radius-card)] bg-ink-950 px-5 text-sm font-semibold text-paper"
        >
          Browse our work
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-[var(--radius-card)] border border-line-strong px-5 text-sm font-semibold"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
