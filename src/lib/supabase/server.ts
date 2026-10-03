import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { requiredPublicEnv } from './env'

/** Server client for Server Components, Server Actions and Route Handlers.
 *
 *  Next 16's `cookies()` is async, and cookies cannot be written during
 *  Server Component rendering — the write throws. That is expected, not an
 *  error to surface: the session is refreshed in proxy.ts on every request,
 *  so a dropped write here is always redundant. Hence the swallowed catch.
 */
export async function createClient() {
  const { url, anonKey } = requiredPublicEnv()
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component render. proxy.ts owns the refresh.
        }
      },
    },
  })
}
