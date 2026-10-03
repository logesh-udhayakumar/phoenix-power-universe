import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { siteConfig } from '@/config/site'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Electrical & Plumbing Contractors`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Electrical & Plumbing Contractors`,
    description: siteConfig.description,
    url: siteConfig.url,
  },
  twitter: { card: 'summary_large_image' },
  // No explicit `robots` here: indexable is already the default, and setting
  // it would emit a second robots tag alongside the `noindex` Next injects
  // into streamed 404s.
}

export const viewport: Viewport = {
  themeColor: '#0b0c0e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  )
}
