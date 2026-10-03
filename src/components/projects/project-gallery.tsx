'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Link2, Play, X } from 'lucide-react'
import type { ProjectMedia } from '@/types/db'
import type { ExternalMedia } from '@/lib/media-links'
import { cn } from '@/lib/utils/cn'

/** Brand glyphs, drawn inline: lucide-react removed its brand icons, and a
 *  generic film or camera icon would not tell the visitor which platform the
 *  item opens. Simplified marks, sized to sit beside text. */
function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.6" cy="6.4" r="1.4" fill="currentColor" />
    </svg>
  )
}

function YoutubeGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="2" y="5" width="20" height="14" rx="4.5" stroke="currentColor" strokeWidth="2" />
      <path d="M10.4 9.1 L15.2 12 L10.4 14.9 Z" fill="currentColor" />
    </svg>
  )
}

function DriveGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M8.6 3 H15.4 L21.4 13.6 H14.6 Z" fill="currentColor" />
      <path d="M8.1 3.9 L14.5 15 L11.1 21 L4.7 9.9 Z" fill="currentColor" opacity="0.72" />
      <path d="M12.1 15.9 H22.4 L19 21.6 H8.7 Z" fill="currentColor" opacity="0.52" />
    </svg>
  )
}

/** One gallery item, whether it is an uploaded file or an external link. */
type GalleryItem =
  | { source: 'upload'; id: string; media: ProjectMedia }
  | { source: 'external'; id: string; media: ExternalMedia }

/** Gallery + lightbox.
 *
 *  Uploaded photos and linked media (YouTube, Instagram, direct URLs) share
 *  one grid on purpose: a visitor is looking at a project and should not have
 *  to care where each picture happens to be hosted. A small badge marks the
 *  ones that are not ours.
 *
 *  Thumbnails are small, optimized images; the full-size file or the
 *  provider's player is only requested when the lightbox opens, so the page
 *  does not download twenty photos and three video players up front. Videos
 *  never autoplay with sound.
 */
export function ProjectGallery({
  media,
  links = [],
  projectTitle,
}: {
  media: ProjectMedia[]
  links?: ExternalMedia[]
  projectTitle: string
}) {
  const items: GalleryItem[] = [
    ...media.map((m): GalleryItem => ({ source: 'upload', id: m.id, media: m })),
    ...links.map((l): GalleryItem => ({ source: 'external', id: l.id, media: l })),
  ]

  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current === null) return current
        return (current + delta + items.length) % items.length
      })
    },
    [items.length],
  )

  // Keyboard control, scroll lock, and focus handling for the lightbox.
  useEffect(() => {
    if (openIndex === null) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }

    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      previouslyFocused.current?.focus()
    }
  }, [openIndex, close, step])

  if (items.length === 0) return null

  const active = openIndex === null ? null : items[openIndex]

  return (
    <>
      {/* The first item leads at double size: a gallery of identical tiles
          gives the eye nowhere to start, and the opening shot is usually the
          one worth showing largest. */}
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {items.map((item, index) => {
          const lead = index === 0 && items.length > 2
          return (
            <li key={item.id} className={lead ? 'col-span-2 row-span-2' : undefined}>
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                className={cn(
                  'group relative block w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper-sunken',
                  lead ? 'aspect-[4/3] md:aspect-[3/2]' : 'aspect-[4/3]',
                )}
                aria-label={tileLabel(item, index, items.length)}
              >
                <Thumbnail
                  item={item}
                  lead={lead}
                  projectTitle={projectTitle}
                  index={index}
                />
                <SourceBadge item={item} />
              </button>
            </li>
          )
        })}
      </ul>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${projectTitle} gallery`}
          className="fixed inset-0 z-[100] flex flex-col bg-ink-950/97"
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3 text-paper">
            <span className="text-sm tabular-nums text-paper/70">
              {(openIndex ?? 0) + 1} / {items.length}
            </span>

            <div className="flex items-center gap-2">
              {active.source === 'external' ? (
                <a
                  href={active.media.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-card)] border border-white/25 px-3 text-xs font-semibold hover:bg-white/10"
                >
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  {active.media.label}
                </a>
              ) : null}
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close gallery"
                className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10"
              >
                <X className="size-6" />
              </button>
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-2 pb-4 md:px-16">
            {items.length > 1 ? (
              <LightboxNav side="left" onClick={() => step(-1)} />
            ) : null}

            <div className="relative flex h-full w-full items-center justify-center">
              <LightboxContent
                item={active}
                projectTitle={projectTitle}
                index={openIndex ?? 0}
              />
            </div>

            {items.length > 1 ? (
              <LightboxNav side="right" onClick={() => step(1)} />
            ) : null}
          </div>

          {active.source === 'upload' && active.media.caption ? (
            <p className="px-6 pb-6 text-center text-sm text-paper/75">
              {active.media.caption}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  )
}

/* ------------------------------------------------------------- thumbnails */

function Thumbnail({
  item,
  lead,
  projectTitle,
  index,
}: {
  item: GalleryItem
  lead: boolean
  projectTitle: string
  index: number
}) {
  const sizes = lead ? '(min-width: 768px) 62vw, 94vw' : '(min-width: 768px) 30vw, 46vw'

  if (item.source === 'upload') {
    const m = item.media
    const thumb = m.thumbnail_url ?? (m.media_type === 'image' ? m.file_url : null)

    return (
      <>
        {thumb ? (
          <Image
            src={thumb}
            alt={m.caption ?? `${projectTitle} — photo ${index + 1}`}
            fill
            loading="lazy"
            sizes={sizes}
            quality={60}
            className="object-cover transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
          />
        ) : (
          <PlaceholderTile glyph={<Play className="size-7" aria-hidden="true" />} label="Video" />
        )}
        {m.media_type === 'video' ? <PlayOverlay /> : null}
        {m.caption ? <Caption text={m.caption} /> : null}
      </>
    )
  }

  const link = item.media

  if (link.kind === 'youtube' && link.thumbnailUrl) {
    return (
      <>
        <Image
          src={link.thumbnailUrl}
          alt={`${projectTitle} — video`}
          fill
          loading="lazy"
          sizes={sizes}
          quality={60}
          className="object-cover transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
        />
        <PlayOverlay />
      </>
    )
  }

  if (link.kind === 'image' && link.thumbnailUrl) {
    return <ExternalImage src={link.thumbnailUrl} alt={`${projectTitle} — linked photo`} />
  }

  if (link.kind === 'drive' && link.thumbnailUrl) {
    // No play overlay: Drive hands back the same preview endpoint for a photo
    // and a video, so a play button here would be a lie half the time.
    return (
      <ExternalImage
        src={link.thumbnailUrl}
        alt={`${projectTitle} — Google Drive media`}
        fallback={<PlaceholderTile glyph={<DriveGlyph className="size-7" />} label="Drive" />}
      />
    )
  }

  if (link.kind === 'instagram') {
    return <PlaceholderTile glyph={<InstagramGlyph className="size-7" />} label="Instagram" />
  }
  if (link.kind === 'video') {
    return <PlaceholderTile glyph={<Play className="size-7" aria-hidden="true" />} label="Video" />
  }
  return <PlaceholderTile glyph={<Link2 className="size-7" aria-hidden="true" />} label="Link" />
}

/** An image on an arbitrary third-party host.
 *
 *  Served as-is rather than through next/image, which would mean adding every
 *  possible host the owner might paste a link from to `remotePatterns` — in
 *  effect allow-listing the whole internet through our own image optimizer.
 */
function ExternalImage({
  src,
  alt,
  contain,
  fallback,
}: {
  src: string
  alt: string
  contain?: boolean
  /** Shown instead of a broken image when the host refuses the request — a
   *  Drive file that is not shared publicly is the common case. */
  fallback?: React.ReactNode
}) {
  const [failed, setFailed] = useState(false)

  if (failed && fallback) return <>{fallback}</>

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={
        contain
          ? 'max-h-full max-w-full object-contain'
          : 'absolute inset-0 size-full object-cover transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-[1.04]'
      }
    />
  )
}

function PlaceholderTile({ glyph, label }: { glyph: React.ReactNode; label: string }) {
  return (
    <span className="flex size-full flex-col items-center justify-center gap-2 bg-ink-900 text-paper">
      {glyph}
      <span className="text-xs font-medium">{label}</span>
    </span>
  )
}

function PlayOverlay() {
  return (
    <span
      className="absolute inset-0 flex items-center justify-center bg-ink-950/25 transition-colors group-hover:bg-ink-950/40"
      aria-hidden="true"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-paper/95 text-ink-950 shadow-[var(--shadow-raised)]">
        <Play className="ml-0.5 size-5 fill-current" />
      </span>
    </span>
  )
}

function Caption({ text }: { text: string }) {
  return (
    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/85 to-transparent p-3 pt-8 text-left text-xs font-medium text-paper">
      {text}
    </span>
  )
}

function SourceBadge({ item }: { item: GalleryItem }) {
  if (item.source !== 'external') return null

  if (item.media.kind === 'youtube') {
    return (
      <Badge>
        <YoutubeGlyph className="size-3.5" />
        YouTube
      </Badge>
    )
  }
  if (item.media.kind === 'instagram') {
    return (
      <Badge>
        <InstagramGlyph className="size-3.5" />
        Instagram
      </Badge>
    )
  }
  if (item.media.kind === 'drive') {
    return (
      <Badge>
        <DriveGlyph className="size-3.5" />
        Drive
      </Badge>
    )
  }
  return null
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-sm bg-ink-950/85 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-paper">
      {children}
    </span>
  )
}

/* --------------------------------------------------------------- lightbox */

function LightboxContent({
  item,
  projectTitle,
  index,
}: {
  item: GalleryItem
  projectTitle: string
  index: number
}) {
  if (item.source === 'upload') {
    const m = item.media
    return m.media_type === 'image' ? (
      <Image
        src={m.file_url}
        alt={m.caption ?? `${projectTitle} — photo ${index + 1}`}
        fill
        sizes="100vw"
        quality={90}
        className="object-contain"
      />
    ) : (
      <video
        key={m.id}
        src={m.file_url}
        poster={m.thumbnail_url ?? undefined}
        controls
        playsInline
        preload="metadata"
        className="max-h-full max-w-full"
      />
    )
  }

  const link = item.media

  if (
    (link.kind === 'youtube' || link.kind === 'instagram' || link.kind === 'drive') &&
    link.embedUrl
  ) {
    // Instagram is why this is an iframe rather than an image: Instagram does
    // not allow its media to be loaded by another site, so their own embed is
    // the only way to actually show the post. Drive rides the same path for a
    // different reason — its /preview player handles a photo and a video
    // identically, so the lightbox does not need to know which it opened.
    return (
      <iframe
        key={link.id}
        src={link.embedUrl}
        title={link.label}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className={cn(
          'border-0 bg-ink-900',
          link.kind === 'instagram' &&
            'h-[min(88vh,760px)] w-[min(100%,420px)] rounded-[var(--radius-card)]',
          // Taller than 16:9 on purpose: a Drive link is as often a portrait
          // phone photo as a video, and the player letterboxes whichever it is.
          link.kind === 'drive' &&
            'h-[min(86vh,820px)] w-full max-w-5xl rounded-[var(--radius-card)]',
          link.kind === 'youtube' && 'aspect-video w-full max-w-5xl',
        )}
      />
    )
  }

  if (link.kind === 'video') {
    return (
      <video
        key={link.id}
        src={link.url}
        controls
        playsInline
        preload="metadata"
        className="max-h-full max-w-full"
      />
    )
  }

  if (link.kind === 'image') {
    return <ExternalImage src={link.url} alt={`${projectTitle} — linked photo`} contain />
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-[var(--radius-card)] bg-paper px-5 py-3 text-sm font-semibold text-ink-950"
    >
      <ExternalLink className="size-4" aria-hidden="true" />
      {link.label}
    </a>
  )
}

function LightboxNav({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous item' : 'Next item'}
      className={cn(
        'absolute top-1/2 z-10 inline-flex size-12 -translate-y-1/2 items-center justify-center',
        'rounded-full bg-ink-950/60 text-paper hover:bg-ink-950/85',
        side === 'left' ? 'left-1 md:left-4' : 'right-1 md:right-4',
      )}
    >
      <Icon className="size-6" />
    </button>
  )
}

function tileLabel(item: GalleryItem, index: number, total: number) {
  const position = `${index + 1} of ${total}`
  if (item.source === 'external') return `${item.media.label} — item ${position}`
  return item.media.media_type === 'video'
    ? `Play video ${position}`
    : `Open photo ${position}`
}
