import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/** Service-role client. Bypasses RLS entirely, so it must never be imported
 *  from a client component — the `server-only` import above turns that into a
 *  build error rather than a leaked key.
 *
 *  Used only where RLS genuinely cannot express the rule: creating the first
 *  admin user, and the seed script. Ordinary admin CRUD goes through the
 *  normal server client so RLS still applies.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Service-role client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    )
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
