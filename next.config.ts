import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    /**
     * Project photos are served from Supabase Storage.
     *
     * Matched by wildcard rather than by reading NEXT_PUBLIC_SUPABASE_URL:
     * next.config is evaluated once at server start, so an env var that is
     * missing or changed afterwards produced an EMPTY allowlist and every
     * image failed with "hostname is not configured" — a confusing error for
     * a configuration problem. A wildcard cannot fail that way, and still
     * restricts the optimizer to Supabase's public storage path so it can
     * never be used as an open image proxy.
     */
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // YouTube thumbnails for linked videos. A fixed, well-known host, so it
      // is safe to optimize through next/image — unlike the arbitrary hosts a
      // pasted image link could point at, which are served as plain <img>.
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/vi/**',
      },
    ],
    // 16 defaults to [75] only; 60 gives smaller gallery thumbnails and 90 is
    // for the lightbox, where the full-resolution image is the whole point.
    qualities: [60, 75, 90],
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
