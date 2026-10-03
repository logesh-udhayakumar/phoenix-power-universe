import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { siteConfig } from '@/config/site'
import { isSupabaseConfigured } from '@/lib/supabase/env'

/** Runtime company details: the `settings` table wins over env vars, so the
 *  owner can change a phone number from the admin panel without a deploy.
 *  Falls back to env, then to empty — never to an invented value. */
export interface CompanyDetails {
  phone: string
  whatsapp: string
  email: string
  address: string
  serviceAreas: string[]
  mapsUrl: string
  instagram: string
  facebook: string
  linkedin: string
}

export const getCompanyDetails = cache(async (): Promise<CompanyDetails> => {
  let stored: Record<string, string> = {}

  try {
    if (!isSupabaseConfigured()) throw new Error('not configured')
    const supabase = await createClient()
    const { data } = await supabase.from('settings').select('key, value')
    for (const row of data ?? []) {
      if (row.value) stored[row.key] = row.value
    }
  } catch {
    // Supabase unreachable or not configured yet — fall back to env values so
    // the site still renders instead of erroring on every page.
    stored = {}
  }

  const areas = stored.service_areas
    ? stored.service_areas.split(',').map((a) => a.trim()).filter(Boolean)
    : [...siteConfig.serviceAreas]

  return {
    phone: stored.phone ?? siteConfig.phone,
    whatsapp: stored.whatsapp ?? siteConfig.whatsapp ?? siteConfig.phone,
    email: stored.email ?? siteConfig.email,
    address: stored.address ?? siteConfig.address,
    serviceAreas: areas,
    mapsUrl: stored.maps_url ?? siteConfig.mapsUrl,
    instagram: stored.instagram ?? siteConfig.social.instagram,
    facebook: stored.facebook ?? siteConfig.social.facebook,
    linkedin: stored.linkedin ?? siteConfig.social.linkedin,
  }
})
