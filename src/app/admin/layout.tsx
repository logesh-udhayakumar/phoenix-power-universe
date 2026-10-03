import type { Metadata } from 'next'

/** The admin area must never be indexed, and this applies to every page
 *  beneath it including the login screen. */
export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | Phoenix Power Admin' },
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-dvh bg-paper-sunken">{children}</div>
}
