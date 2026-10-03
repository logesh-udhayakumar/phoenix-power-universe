import type { MetadataRoute } from 'next'
import { getPublishedProjectSlugs, getServices } from '@/lib/queries'
import { siteConfig } from '@/config/site'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, '')

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/projects`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/services`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/about`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: 'yearly', priority: 0.6 },
  ]

  // A Supabase outage must not fail the sitemap route entirely.
  const [projects, services] = await Promise.all([
    getPublishedProjectSlugs().catch(() => []),
    getServices().catch(() => []),
  ])

  return [
    ...staticRoutes,
    ...projects.map((project) => ({
      url: `${base}/projects/${project.slug}`,
      lastModified: new Date(project.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...services.map((service) => ({
      url: `${base}/services/${service.slug}`,
      lastModified: new Date(service.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
