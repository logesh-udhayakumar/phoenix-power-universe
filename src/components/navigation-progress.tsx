'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Thin progress bar across the top of the screen while a page is loading.
 *
 * Most pages are rendered on the server from Supabase data, so a click on a
 * link can take a second or two before anything changes. This listens for
 * clicks on same-site links anywhere in the app and shows the bar
 * immediately, then hides it once the URL changes. (Form buttons show their
 * own spinner via <SubmitButton>.)
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentUrl = `${pathname}?${searchParams.toString()}`

  // The URL we were on when a link was clicked. The bar shows only while we
  // are still on that URL, so it disappears by itself once the new page
  // renders — no effect needed to "reset" it.
  const [startedOn, setStartedOn] = useState<string | null>(null)
  const active = startedOn !== null && startedOn === currentUrl

  const urlRef = useRef(currentUrl)
  useEffect(() => {
    urlRef.current = currentUrl
  }, [currentUrl])

  useEffect(() => {
    let safety: ReturnType<typeof setTimeout> | undefined

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return

      const anchor = (event.target as Element | null)?.closest?.('a')
      if (!anchor || !anchor.href) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return

      // Same page (or just a #hash jump) -> nothing to load.
      const here = window.location
      if (url.pathname === here.pathname && url.search === here.search) return

      setStartedOn(urlRef.current)
      clearTimeout(safety)
      // Never leave the bar stuck if a navigation is cancelled or errors.
      safety = setTimeout(() => setStartedOn(null), 15000)
    }

    const stop = () => setStartedOn(null)

    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', stop)
    return () => {
      clearTimeout(safety)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', stop)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden"
    >
      {active ? (
        <div className="nav-progress-bar h-full bg-amber-accent shadow-[0_0_8px_var(--color-amber-accent)]" />
      ) : null}
    </div>
  )
}
