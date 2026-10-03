import { SiteHeader } from '@/components/public/site-header'
import { SiteFooter } from '@/components/public/site-footer'
import { MobileActionBar } from '@/components/public/whatsapp-cta'
import { getCompanyDetails } from '@/lib/settings'
import { getCategories } from '@/lib/queries'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [company, categories] = await Promise.all([
    getCompanyDetails(),
    getCategories(),
  ])

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-ink-950 focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
      >
        Skip to content
      </a>
      <SiteHeader />
      {/* Bottom padding clears the sticky mobile action bar. */}
      <main id="main" className="pb-24 md:pb-0">
        {children}
      </main>
      <SiteFooter company={company} categories={categories} />
      <MobileActionBar phone={company.phone} whatsapp={company.whatsapp} />
    </>
  )
}
