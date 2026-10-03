import { cn } from '@/lib/utils/cn'

/** The phoenix mark.
 *
 *  A rising bird seen head-on: wings spread and upswept, head turned in
 *  profile with a hooked beak, flame-like crest plumes swept back, and a long
 *  trailing tail. The crest is swept rather than upright on purpose — three
 *  symmetric spikes above a head read as a CROWN, not as plumage, which is
 *  what the first version of this mark got wrong.
 *
 *  Inline SVG, not an image file: no second asset and no network request, and
 *  the gold is a token rather than a baked-in hex, so the mark restyles from
 *  one place. The bird is brand gold in both the light header and the dark
 *  footer — it is the logo's own colour, not the surrounding text's, so it
 *  deliberately does NOT follow `currentColor` the way the wordmark does.
 */
export function PhoenixMark({
  className,
  accent = true,
}: {
  className?: string
  /** Catch the crest in the lighter gold. Off for a flat single-tone mark. */
  accent?: boolean
}) {
  const gold = 'var(--color-gold)'
  const crest = accent ? 'var(--color-gold-light)' : gold

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('size-7', className)}
    >
      <g fill={gold}>
        {/* Crest plumes, swept back like flame rather than a crown. */}
        <path
          d="M30.2 10.2 C27.6 6.4 24.4 3.8 20.4 2.4 C23.4 5.8 25.8 9.2 27.4 12.6 Z"
          fill={crest}
        />
        <path
          d="M31.6 9.2 C30.2 5.6 28.6 2.8 26.4 0.6 C27.6 4.4 28.4 7.6 28.8 10.8 Z"
          fill={crest}
        />
        {/* Head in profile, facing right, with a hooked beak. */}
        <path d="M32.2 8.4 C35.4 8.4 37.6 10.6 37.6 13.4 L42.8 15.2 L37.4 16.8 C36.6 17.8 35 18.4 33 18.4 L30 18.4 C28.6 17 27.8 15.2 27.8 13.4 C27.8 10.6 29 8.4 32.2 8.4 Z" />
        {/* Body. */}
        <path d="M29.4 18 L34.6 18 L35.8 31.5 L32 40.5 L28.2 31.5 Z" />
        {/* Right wing: upswept, with stepped flight feathers. */}
        <path d="M34.8 20.6 C43 19.4 53 14 61.5 5.5 C59.5 15 55.5 21.4 50 25.6 L54.6 26.2 C51.4 29.4 47.6 31.6 43.4 32.8 L47 34.2 C43.8 35.8 40 36.6 36.2 36.6 L35.6 29 Z" />
        {/* Left wing. */}
        <path d="M29.2 20.6 C21 19.4 11 14 2.5 5.5 C4.5 15 8.5 21.4 14 25.6 L9.4 26.2 C12.6 29.4 16.4 31.6 20.6 32.8 L17 34.2 C20.2 35.8 24 36.6 27.8 36.6 L28.4 29 Z" />
        {/* Long trailing tail. */}
        <path d="M30.6 38.5 L33.4 38.5 L34.2 60 L32 54.5 L29.8 60 Z" />
        <path d="M35 36.8 L37.4 38.2 L43.5 56 L39.6 51.6 L39 56.8 Z" />
        <path d="M29 36.8 L26.6 38.2 L20.5 56 L24.4 51.6 L25 56.8 Z" />
      </g>
    </svg>
  )
}

/** Mark + wordmark lockup, used in the header and footer. */
export function PhoenixLogo({
  className,
  markClassName,
  textClassName,
  accent = true,
}: {
  className?: string
  markClassName?: string
  textClassName?: string
  accent?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <PhoenixMark className={markClassName} accent={accent} />
      <span
        className={cn(
          'text-sm font-bold uppercase tracking-[0.14em] leading-none',
          textClassName,
        )}
      >
        Phoenix Power Universe
      </span>
    </span>
  )
}
