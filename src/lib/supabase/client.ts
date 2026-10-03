'use client'

import { createBrowserClient } from '@supabase/ssr'
import { requiredPublicEnv } from './env'

/** Browser client — anon key only. Every request it makes is subject to RLS,
 *  so the worst a tampered browser session can do is read published rows. */
export function createClient() {
  const { url, anonKey } = requiredPublicEnv()
  return createBrowserClient(url, anonKey)
}
