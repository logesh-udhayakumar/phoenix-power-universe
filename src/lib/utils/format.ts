/** Display helpers. Dates come out of Postgres as ISO strings. */

export function completionYear(date: string | null): string | null {
  if (!date) return null
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? null : String(parsed.getUTCFullYear())
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** "Chennai, Tamil Nadu" from parts, skipping the ones that are missing. */
export function placeLine(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(', ')
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
