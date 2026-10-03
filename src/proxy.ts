import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Next 16 renamed `middleware.ts` to `proxy.ts`. This runs on every admin
 *  request and does two jobs:
 *
 *  1. Refreshes the Supabase auth cookie. Server Components cannot write
 *     cookies, so this is the only place the rotated token gets persisted.
 *  2. An OPTIMISTIC redirect for signed-out visitors — it only reads the
 *     session cookie, never the database, because this runs on prefetches too.
 *
 *  This is NOT the security boundary. A cookie proves only that someone
 *  signed in, not that they are an admin. Every admin page and action calls
 *  requireAdmin() (lib/auth.ts), and RLS independently blocks non-admin
 *  writes even if both checks were somehow bypassed.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return response

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
      },
    },
  })

  // getUser() revalidates the token with Supabase; getSession() would trust
  // whatever the cookie claims. If Supabase is unreachable we fall through
  // with no user, which sends the visitor to the login page rather than
  // failing the request open.
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    user = null
  }

  const { pathname } = request.nextUrl

  if (!user && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const redirectUrl = new URL('/admin/login', request.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
