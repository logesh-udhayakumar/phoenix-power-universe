/** Supabase env handling.
 *
 *  A missing or still-placeholder configuration is treated as "not set up
 *  yet" rather than as an error: the site renders its empty states so a
 *  developer can see the design before touching Supabase. A genuine query
 *  failure against a REAL configuration still throws, because silently
 *  showing "no projects" when the database is down would hide an outage from
 *  the owner.
 */

const PLACEHOLDERS = ['YOUR-PROJECT', 'your-anon-key', 'your-service-role-key']

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true
  return PLACEHOLDERS.some((token) => value.includes(token))
}

export function isSupabaseConfigured(): boolean {
  return (
    !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !isPlaceholder(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}

export function requiredPublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example).',
    )
  }
  return { url, anonKey }
}
