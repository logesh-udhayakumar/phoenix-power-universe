'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export interface HeroImage {
  url: string
  alt: string
}

const INTERVAL_MS = 6000

/** Hero backdrop that crossfades through a few real project photos.
 *
 *  Restraint is the point — these sit behind the headline, so the transition
 *  is a slow opacity fade with no movement, no zoom and no slide. Anything
 *  livelier competes with the text in front of it.
 *
 *  The running order is randomised per request by the page that renders
 *  this, not here: the homepage is dynamic, so the shuffle happens once on
 *  the server and the client hydrates the same order. Randomising on the
 *  client instead would mean the first paint and the hydrated markup
 *  disagree.
 *
 *  Honours `prefers-reduced-motion`: that setting means no automatic motion
 *  at all, so the rotation does not start and the first photo simply stays.
 *  Rotation also pauses while the tab is hidden, since animating an unseen
 *  page only burns battery.
 */
export function HeroSlideshow({ images }: { images: HeroImage[] }) {
  const [index, setIndex] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (images.length < 2) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduceMotion.matches) return

    const start = () => {
      stop()
      timer.current = setInterval(
        () => setIndex((i) => (i + 1) % images.length),
        INTERVAL_MS,
      )
    }
    const stop = () => {
      if (timer.current) clearInterval(timer.current)
      timer.current = null
    }
    const onVisibility = () => (document.hidden ? stop() : start())

    start()
    document.addEventListener('visibilitychange', onVisibility)
    reduceMotion.addEventListener('change', onVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      reduceMotion.removeEventListener('change', onVisibility)
    }
  }, [images.length])

  if (images.length === 0) return null

  return (
    <>
      {images.map((image, i) => (
        <Image
          key={image.url}
          src={image.url}
          alt=""
          fill
          sizes="100vw"
          quality={75}
          // Only the first is eager: the rest are decoration below it.
          {...(i === 0
            ? { loading: 'eager' as const, fetchPriority: 'high' as const }
            : { loading: 'lazy' as const })}
          className="object-cover transition-opacity duration-[1200ms] ease-[var(--ease-out-soft)] motion-reduce:transition-none"
          style={{ opacity: i === index ? 0.45 : 0 }}
        />
      ))}

      {images.length > 1 ? (
        <div
          className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2 md:bottom-8"
          role="group"
          aria-label="Choose a background photo"
        >
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1} of ${images.length}`}
              aria-current={i === index}
              className="group p-2"
            >
              <span
                className={
                  i === index
                    ? 'block h-0.5 w-8 bg-amber-accent transition-colors'
                    : 'block h-0.5 w-8 bg-white/35 transition-colors group-hover:bg-white/70'
                }
              />
            </button>
          ))}
        </div>
      ) : null}
    </>
  )
}
