'use client'

import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Film,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import type { ProjectMedia } from '@/types/db'
import { UPLOAD_LIMITS, validateFile, type UploadKind } from '@/lib/storage/provider'
import { uploadWithProgress } from '@/lib/storage/supabase-provider'
import {
  addProjectMedia,
  deleteProjectMedia,
  reorderProjectMedia,
  setProjectCover,
} from '@/app/admin/actions'
import { formatBytes } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface PendingUpload {
  id: string
  name: string
  size: number
  percent: number
  error?: string
}

/** Photo and video manager for one project.
 *
 *  Everything the owner needs in one place: add many files at once, watch
 *  each one upload, remove one, change the order, and pick the cover. All
 *  labels are plain language — "Photos", never "media assets".
 */
export function MediaManager({
  projectId,
  initialMedia,
  coverUrl,
}: {
  projectId: string
  initialMedia: ProjectMedia[]
  coverUrl: string | null
}) {
  const [media, setMedia] = useState(initialMedia)
  const [cover, setCover] = useState(coverUrl)
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isBusy, startTransition] = useTransition()

  const imageInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)

  async function handleFiles(fileList: FileList | null, kind: UploadKind) {
    if (!fileList?.length) return
    setError(null)

    const files = Array.from(fileList)
    const accepted: File[] = []
    const rejected: string[] = []

    for (const file of files) {
      const problem = validateFile(file, kind)
      if (problem) rejected.push(problem)
      else accepted.push(file)
    }

    if (rejected.length) setError(rejected.join(' '))
    if (!accepted.length) return

    const bucket = kind === 'video' ? 'project-videos' : 'project-images'
    const uploaded: { url: string; mediaType: 'image' | 'video' }[] = []

    // Sequential, not parallel: a phone uploading six photos at once on a
    // weak connection tends to stall them all. One at a time also makes the
    // progress readout honest.
    for (const file of accepted) {
      const tempId = `${file.name}-${Date.now()}-${Math.random()}`
      setPending((prev) => [
        ...prev,
        { id: tempId, name: file.name, size: file.size, percent: 0 },
      ])

      try {
        const result = await uploadWithProgress({
          bucket,
          prefix: projectId,
          file,
          onProgress: (percent) =>
            setPending((prev) =>
              prev.map((p) => (p.id === tempId ? { ...p, percent } : p)),
            ),
        })
        uploaded.push({ url: result.url, mediaType: kind === 'video' ? 'video' : 'image' })
        setPending((prev) => prev.filter((p) => p.id !== tempId))
      } catch (uploadError) {
        const message =
          uploadError instanceof Error ? uploadError.message : 'Upload failed.'
        setPending((prev) =>
          prev.map((p) => (p.id === tempId ? { ...p, error: message } : p)),
        )
      }
    }

    if (!uploaded.length) return

    const result = await addProjectMedia(projectId, uploaded)
    if (!result.ok) {
      setError(result.message ?? 'Files uploaded but could not be saved.')
      return
    }

    // Use the rows the database actually created. Their real ids are what
    // reordering and deleting are keyed on, so nothing here may be invented.
    setMedia((prev) => [...prev, ...(result.media ?? [])])

    // First image uploaded to a project with no cover becomes the cover.
    const firstImage = uploaded.find((item) => item.mediaType === 'image')
    if (!cover && firstImage) {
      await setProjectCover(projectId, firstImage.url)
      setCover(firstImage.url)
    }
  }

  function remove(item: ProjectMedia) {
    startTransition(async () => {
      const result = await deleteProjectMedia(item.id)
      if (!result.ok) {
        setError(result.message ?? 'Could not remove that file.')
        return
      }
      setMedia((prev) => prev.filter((m) => m.id !== item.id))
      if (cover === item.file_url) setCover(null)
    })
  }

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= media.length) return

    const next = [...media]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    setMedia(next)

    startTransition(async () => {
      const result = await reorderProjectMedia(next.map((m) => m.id))
      if (!result.ok) setError(result.message ?? 'Could not save the new order.')
    })
  }

  function makeCover(item: ProjectMedia) {
    if (item.media_type !== 'image') return
    startTransition(async () => {
      const result = await setProjectCover(projectId, item.file_url)
      if (!result.ok) {
        setError(result.message ?? 'Could not set the cover photo.')
        return
      }
      setCover(item.file_url)
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => imageInput.current?.click()}
          className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-card)] border border-line-strong bg-paper-raised px-4 text-sm font-semibold hover:bg-paper-sunken"
        >
          <ImagePlus className="size-4" aria-hidden="true" />
          Add photos
        </button>
        <button
          type="button"
          onClick={() => videoInput.current?.click()}
          className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-card)] border border-line-strong bg-paper-raised px-4 text-sm font-semibold hover:bg-paper-sunken"
        >
          <Film className="size-4" aria-hidden="true" />
          Add videos
        </button>

        <input
          ref={imageInput}
          type="file"
          accept={UPLOAD_LIMITS.image.mimeTypes.join(',')}
          multiple
          hidden
          onChange={(e) => {
            void handleFiles(e.target.files, 'image')
            e.target.value = ''
          }}
        />
        <input
          ref={videoInput}
          type="file"
          accept={UPLOAD_LIMITS.video.mimeTypes.join(',')}
          multiple
          hidden
          onChange={(e) => {
            void handleFiles(e.target.files, 'video')
            e.target.value = ''
          }}
        />
      </div>

      <p className="text-xs text-slate-muted">
        Photos: JPG, PNG or WEBP up to{' '}
        {formatBytes(UPLOAD_LIMITS.image.maxBytes)}. Videos: MP4, WEBM or MOV up to{' '}
        {formatBytes(UPLOAD_LIMITS.video.maxBytes)}.
      </p>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {pending.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {pending.map((item) => (
            <li
              key={item.id}
              className="rounded-[var(--radius-card)] border border-line bg-paper-raised p-3"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{item.name}</span>
                <span className="shrink-0 text-xs text-slate-muted">
                  {item.error ? 'Failed' : `${item.percent}%`}
                </span>
              </div>
              {item.error ? (
                <p className="mt-1.5 text-xs text-danger">{item.error}</p>
              ) : (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-sunken">
                  <div
                    className="h-full bg-amber-accent transition-[width] duration-200"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {media.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-paper-sunken/60 px-6 py-12 text-center">
          <Upload className="mx-auto size-6 text-slate-soft" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">No photos yet</p>
          <p className="mt-1 text-xs text-slate-muted">
            Add photos of the finished job — these are what clients look at.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {media.map((item, index) => {
            const isCover = cover === item.file_url
            return (
              <li
                key={item.id}
                className={cn(
                  'overflow-hidden rounded-[var(--radius-card)] border bg-paper-raised',
                  isCover ? 'border-amber-accent' : 'border-line',
                )}
              >
                <div className="relative aspect-[4/3] bg-paper-sunken">
                  {item.media_type === 'image' ? (
                    <Image
                      src={item.file_url}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 30vw, 46vw"
                      quality={60}
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full flex-col items-center justify-center gap-1 text-slate-muted">
                      <Film className="size-7" aria-hidden="true" />
                      <span className="text-xs">Video</span>
                    </span>
                  )}
                  {isCover ? (
                    <span className="absolute left-2 top-2 rounded-sm bg-amber-accent px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-white">
                      Cover
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-1 p-2">
                  <div className="flex gap-1">
                    <IconButton
                      label="Move earlier"
                      onClick={() => move(index, -1)}
                      disabled={index === 0 || isBusy}
                    >
                      <ArrowLeft className="size-4" />
                    </IconButton>
                    <IconButton
                      label="Move later"
                      onClick={() => move(index, 1)}
                      disabled={index === media.length - 1 || isBusy}
                    >
                      <ArrowRight className="size-4" />
                    </IconButton>
                  </div>

                  <div className="flex gap-1">
                    {item.media_type === 'image' ? (
                      <IconButton
                        label={isCover ? 'This is the cover photo' : 'Use as cover photo'}
                        onClick={() => makeCover(item)}
                        disabled={isCover || isBusy}
                      >
                        <Star className={cn('size-4', isCover && 'fill-amber-accent text-amber-accent')} />
                      </IconButton>
                    ) : null}
                    <IconButton
                      label="Remove"
                      onClick={() => remove(item)}
                      disabled={isBusy}
                      tone="danger"
                    >
                      {isBusy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </IconButton>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  tone = 'neutral',
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  tone?: 'neutral' | 'danger'
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-[var(--radius-card)] transition-colors disabled:opacity-35',
        tone === 'danger'
          ? 'text-danger hover:bg-danger/10'
          : 'text-ink-700 hover:bg-paper-sunken',
      )}
    >
      {children}
    </button>
  )
}
