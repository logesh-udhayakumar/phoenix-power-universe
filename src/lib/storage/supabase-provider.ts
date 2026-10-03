'use client'

import { createClient } from '@/lib/supabase/client'
import type { BucketName, UploadResult } from './provider'

/** Supabase Storage implementation of the upload step.
 *
 *  supabase-js has no progress callback on `.upload()`, and "show upload
 *  progress" is a real requirement here — the owner uploads twenty site
 *  photos over a phone connection and needs to see that something is
 *  happening. So this posts to the Storage REST endpoint with XMLHttpRequest,
 *  which does report progress, using the signed-in admin's own access token.
 *  The storage RLS policy still applies: no service-role key is involved.
 */
export function uploadWithProgress({
  bucket,
  prefix,
  file,
  onProgress,
  signal,
}: {
  bucket: BucketName
  prefix: string
  file: File
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}): Promise<UploadResult> {
  return new Promise(async (resolve, reject) => {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      reject(new Error('Your session has expired. Please sign in again.'))
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!baseUrl) {
      reject(new Error('Supabase is not configured.'))
      return
    }

    const path = `${prefix}/${safeFileName(file.name)}`
    const endpoint = `${baseUrl}/storage/v1/object/${bucket}/${encodeURI(path)}`

    const xhr = new XMLHttpRequest()
    xhr.open('POST', endpoint, true)
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
    xhr.setRequestHeader('x-upsert', 'false')
    if (file.type) xhr.setRequestHeader('Content-Type', file.type)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path)
        onProgress?.(100)
        resolve({ url: data.publicUrl, path })
      } else {
        reject(new Error(storageError(xhr.status, xhr.responseText, file.name)))
      }
    }

    xhr.onerror = () =>
      reject(new Error(`Network error while uploading ${file.name}. Please retry.`))
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'))

    signal?.addEventListener('abort', () => xhr.abort(), { once: true })

    xhr.send(file)
  })
}

/** Turn the server's response into something the owner can act on. */
function storageError(status: number, body: string, fileName: string): string {
  if (status === 413) return `${fileName} is too large for the server limit.`
  if (status === 415) return `${fileName} is not an allowed file type.`
  if (status === 409) return `${fileName} already exists. Rename it and try again.`
  if (status === 401 || status === 403) {
    return 'Your session has expired, or this account cannot upload. Sign in again.'
  }
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string }
    if (parsed.message) return `${fileName}: ${parsed.message}`
    if (parsed.error) return `${fileName}: ${parsed.error}`
  } catch {
    // Non-JSON body — fall through to the generic message.
  }
  return `Could not upload ${fileName} (error ${status}).`
}

/** Keep the original name recognisable but safe for a URL path, and prefix a
 *  short random segment so two photos called IMG_0001.jpg do not collide. */
function safeFileName(name: string): string {
  const dot = name.lastIndexOf('.')
  const stem = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  const ext = (dot > 0 ? name.slice(dot + 1) : '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const unique = Math.random().toString(36).slice(2, 8)
  return `${stem || 'file'}-${unique}${ext ? `.${ext}` : ''}`
}
