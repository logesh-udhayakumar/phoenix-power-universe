/** External media links on a project.
 *
 *  The owner pastes a list of URLs — YouTube, Instagram, Google Drive, or a
 *  direct link to an image or video file — and these helpers work out what
 *  each one is so the gallery can show it rather than just linking to it.
 *
 *  Stored as a JSON array in a single text column. Parsing is forgiving in
 *  both directions: a value written before this feature existed, or hand-edited
 *  into something unexpected, degrades to "no links" instead of breaking the
 *  project page.
 */

export type ExternalMediaKind =
  | 'youtube'
  | 'instagram'
  | 'drive'
  | 'image'
  | 'video'
  | 'link'

export interface ExternalMedia {
  /** Stable key for React lists. */
  id: string
  kind: ExternalMediaKind
  /** The original URL, used for the "open the source" link. */
  url: string
  /** Provider id, where the provider has one (YouTube video, Instagram post). */
  providerId?: string
  /** Preview image, where one can be derived without an API call. */
  thumbnailUrl?: string
  /** Embeddable player/post URL for the lightbox. */
  embedUrl?: string
  label: string
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i

/** Split what the owner typed. Commas, newlines and spaces all separate, so
 *  pasting from a notes app or a chat message works without reformatting. */
export function parseLinkInput(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => /^https?:\/\//i.test(part))
    .slice(0, 40)
}

/** Read the stored column. Accepts a JSON array (what we write) and also a
 *  plain comma-separated string, so a value typed straight into the database
 *  still works. */
export function parseStoredLinks(stored: string | null | undefined): string[] {
  if (!stored) return []
  const trimmed = stored.trim()
  if (!trimmed) return []

  if (trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === 'string')
      }
    } catch {
      // Not valid JSON after all — fall through to the loose parser.
    }
  }
  return parseLinkInput(trimmed)
}

export function serialiseLinks(urls: string[]): string | null {
  return urls.length > 0 ? JSON.stringify(urls) : null
}

/** youtube.com/watch?v=, youtu.be/, /shorts/ and /embed/ all appear in links
 *  people actually paste. */
function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '')

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0]
    return id || null
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const v = url.searchParams.get('v')
    if (v) return v

    const match = /^\/(shorts|embed|live|v)\/([^/?#]+)/.exec(url.pathname)
    if (match) return match[2]
  }

  return null
}

/** Post, reel and TV links all embed the same way. */
function instagramCode(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '')
  if (host !== 'instagram.com' && !host.endsWith('.instagram.com')) return null

  const match = /^\/(?:[^/]+\/)?(p|reel|reels|tv)\/([^/?#]+)/.exec(url.pathname)
  return match ? match[2] : null
}

/** A single Drive FILE, from any of the shapes the share sheet and the address
 *  bar produce: /file/d/<id>/view, ?id=<id> on /open and /uc, and the Docs-style
 *  /d/<id>/ path.
 *
 *  Folder links (/drive/folders/<id>) are deliberately NOT matched. A folder is
 *  not one picture, so there is nothing to put in a gallery tile; it falls
 *  through to a plain link instead of rendering an embed that would show a file
 *  browser inside the lightbox. */
function driveFileId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '')
  if (host !== 'drive.google.com' && host !== 'docs.google.com') return null

  const path = /^\/(?:file\/)?d\/([^/?#]+)/.exec(url.pathname)
  if (path) return path[1]

  if (url.pathname === '/open' || url.pathname === '/uc') {
    return url.searchParams.get('id')
  }

  return null
}

export function classifyLink(raw: string, index: number): ExternalMedia | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

  const id = `link-${index}`

  const yt = youtubeId(url)
  if (yt) {
    return {
      id,
      kind: 'youtube',
      url: raw,
      providerId: yt,
      // hqdefault exists for every video; maxresdefault does not.
      thumbnailUrl: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}?rel=0`,
      label: 'Watch on YouTube',
    }
  }

  const ig = instagramCode(url)
  if (ig) {
    return {
      id,
      kind: 'instagram',
      url: raw,
      providerId: ig,
      // Instagram blocks hotlinking its images, so there is no thumbnail to
      // derive — the post is shown through their own embed instead.
      embedUrl: `https://www.instagram.com/p/${ig}/embed`,
      label: 'View on Instagram',
    }
  }

  const drive = driveFileId(url)
  if (drive) {
    return {
      id,
      kind: 'drive',
      url: raw,
      providerId: drive,
      // Drive serves a preview image for photos AND a poster frame for videos
      // at this endpoint, so one thumbnail covers both without knowing which
      // the file is. It only resolves while the file is shared with "anyone
      // with the link" — the gallery falls back to a tile when it does not.
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${drive}&sz=w1000`,
      // /preview plays a video and renders an image, again without us having
      // to know the type up front.
      embedUrl: `https://drive.google.com/file/d/${drive}/preview`,
      label: 'Open in Google Drive',
    }
  }

  const path = url.pathname
  if (IMAGE_EXT.test(path)) {
    return { id, kind: 'image', url: raw, thumbnailUrl: raw, label: 'Open image' }
  }
  if (VIDEO_EXT.test(path)) {
    return { id, kind: 'video', url: raw, label: 'Play video' }
  }

  return { id, kind: 'link', url: raw, label: 'Open link' }
}

export function externalMediaFor(stored: string | null | undefined): ExternalMedia[] {
  return parseStoredLinks(stored)
    .map((url, i) => classifyLink(url, i))
    .filter((item): item is ExternalMedia => item !== null)
}
