'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { AlertCircle, ImagePlus, Trash2 } from 'lucide-react'
import { UPLOAD_LIMITS, validateFile, type BucketName } from '@/lib/storage/provider'
import { uploadWithProgress } from '@/lib/storage/supabase-provider'
import { formatBytes } from '@/lib/utils/format'

/** A single-image picker for the simple editors (services, categories).
 *
 *  The file uploads as soon as it is chosen and the resulting public URL is
 *  kept in a hidden input, so the surrounding form just posts a URL and needs
 *  to know nothing about storage. Removing the picture only clears that
 *  field — the old file is left in storage rather than deleted, because the
 *  owner may still be deciding and a save may never follow.
 */
export function ImageField({
  name,
  label,
  bucket,
  prefix,
  defaultValue,
  hint,
}: {
  name: string
  label: string
  bucket: BucketName
  /** Folder inside the bucket. */
  prefix: string
  defaultValue?: string | null
  hint?: string
}) {
  const [url, setUrl] = useState(defaultValue ?? '')
  const [percent, setPercent] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)

    const problem = validateFile(file, 'image')
    if (problem) {
      setError(problem)
      return
    }

    setPercent(0)
    try {
      const result = await uploadWithProgress({
        bucket,
        prefix,
        file,
        onProgress: setPercent,
      })
      setUrl(result.url)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.')
    } finally {
      setPercent(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink-800">{label}</span>
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="flex items-start gap-4">
          <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper-sunken">
            <Image src={url} alt="" fill sizes="128px" quality={60} className="object-cover" />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-card)] border border-line-strong px-3 text-xs font-semibold hover:bg-paper-sunken"
            >
              <ImagePlus className="size-3.5" aria-hidden="true" />
              Replace
            </button>
            <button
              type="button"
              onClick={() => setUrl('')}
              className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-card)] px-3 text-xs font-semibold text-danger hover:bg-danger/10"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={percent !== null}
          className="flex h-24 w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border border-dashed border-line-strong bg-paper-sunken/50 text-sm font-medium text-slate-muted hover:border-ink-600 hover:text-ink-900 disabled:opacity-60"
        >
          <ImagePlus className="size-4" aria-hidden="true" />
          {percent !== null ? `Uploading... ${percent}%` : 'Choose a picture'}
        </button>
      )}

      {percent !== null ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-paper-sunken">
          <div
            className="h-full bg-amber-accent transition-[width] duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : null}

      <p className="text-xs text-slate-muted">
        {hint ? `${hint} ` : ''}JPG, PNG or WEBP up to {formatBytes(UPLOAD_LIMITS.image.maxBytes)}.
      </p>

      {error ? (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-danger">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <input
        ref={input}
        type="file"
        accept={UPLOAD_LIMITS.image.mimeTypes.join(',')}
        hidden
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
