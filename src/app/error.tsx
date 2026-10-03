'use client'

import { useEffect } from 'react'

/** Root error boundary. Shows something a visitor can act on instead of a
 *  blank screen, and keeps the real error in the console for debugging. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-slate-muted">
        Sorry — that did not load. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex h-11 items-center rounded-[var(--radius-card)] bg-ink-950 px-5 text-sm font-semibold text-paper"
      >
        Try again
      </button>
    </div>
  )
}
