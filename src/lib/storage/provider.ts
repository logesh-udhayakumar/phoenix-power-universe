/** Media storage contracts, kept separate from the Supabase implementation so
 *  the provider can be swapped (Cloudinary, S3) without touching the database
 *  or the UI. The DB only ever stores the public URL an upload returns, never
 *  a provider-specific id — see supabase-provider.ts for the current one. */

export type BucketName =
  | 'project-images'
  | 'project-videos'
  | 'service-images'
  | 'testimonial-images'

export interface UploadResult {
  /** Public URL to store in the database. */
  url: string
  /** Provider-scoped path, kept so the file can be deleted later. */
  path: string
}

export const UPLOAD_LIMITS = {
  image: {
    maxBytes: 10 * 1024 * 1024,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    extensions: ['jpg', 'jpeg', 'png', 'webp'],
  },
  video: {
    maxBytes: 100 * 1024 * 1024,
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    extensions: ['mp4', 'webm', 'mov'],
  },
} as const

export type UploadKind = keyof typeof UPLOAD_LIMITS

/** Client-side pre-check. The authoritative limits are on the Supabase
 *  bucket (see 0003_storage.sql) — this only gives a fast, friendly error. */
export function validateFile(file: File, kind: UploadKind): string | null {
  const limit = UPLOAD_LIMITS[kind]
  const mimes: readonly string[] = limit.mimeTypes
  if (!mimes.includes(file.type)) {
    return `${file.name} is not a supported ${kind} (allowed: ${limit.extensions.join(', ')}).`
  }
  if (file.size > limit.maxBytes) {
    const mb = Math.round(limit.maxBytes / (1024 * 1024))
    return `${file.name} is too large. The limit is ${mb} MB.`
  }
  return null
}
