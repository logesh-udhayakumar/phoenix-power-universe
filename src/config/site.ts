/** Single source of truth for company details.
 *
 *  Nothing here is invented: every value falls back to an obvious placeholder
 *  so an unset field is visible as "not configured yet" rather than shipping a
 *  plausible-looking fake phone number. Values marked `owner-editable` are
 *  overridden at runtime from the `settings` table (see lib/settings.ts), so
 *  the owner can change them from the admin panel without a deploy.
 */

export const siteConfig = {
  name: 'Phoenix Power Universe',
  shortName: 'Phoenix Power',
  tagline: 'Powering spaces. Building trust.',
  description:
    'Professional lighting, electrical, plumbing and technical services for residential, commercial and industrial projects.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',

  // owner-editable — placeholders until the real values are provided
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE ?? '',
  whatsapp: process.env.NEXT_PUBLIC_COMPANY_WHATSAPP ?? '',
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL ?? '',
  address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS ?? '',
  serviceAreas: (process.env.NEXT_PUBLIC_SERVICE_AREAS ?? '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean),
  mapsUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL ?? '',
  social: {
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? '',
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? '',
    linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? '',
  },

  whatsappMessage:
    'Hi Phoenix Power Universe, I would like to enquire about a project.',
  featuredProjectLimit: 6,
} as const

export type SiteConfig = typeof siteConfig

/** Keys the owner can edit from Admin → Settings. */
export const EDITABLE_SETTING_KEYS = [
  'phone',
  'whatsapp',
  'email',
  'address',
  'service_areas',
  'maps_url',
  'instagram',
  'facebook',
  'linkedin',
] as const

export type EditableSettingKey = (typeof EDITABLE_SETTING_KEYS)[number]

/** Digits only — wa.me rejects spaces, +, and dashes. */
export function whatsappHref(number: string, message: string): string | null {
  const digits = number.replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function telHref(number: string): string | null {
  const trimmed = number.trim()
  return trimmed ? `tel:${trimmed.replace(/[^\d+]/g, '')}` : null
}
