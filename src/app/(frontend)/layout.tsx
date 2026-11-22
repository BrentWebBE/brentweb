import type { Metadata } from 'next'

import { draftMode } from 'next/headers'
import React from 'react'

import { fontVariables } from '@/client/fonts'
import { AdminBar } from '@/components/AdminBar'
import { Analytics } from '@/components/analytics/Analytics'
import { LazyToaster } from '@/components/ui/LazyToaster'
import { LocaleProvider } from '@/components/LocaleProvider'
import { MobileActionBar } from '@/components/shell/MobileActionBar'
import { SiteJsonLd } from '@/components/seo/SiteJsonLd'
import { Preloader } from '@/components/shell/Preloader'
import { features } from '@/features'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { getMessages } from '@/i18n'
import { pickClientMessages } from '@/lib/client-messages'
import { htmlLang } from '@/lib/locale'
import { requestLocale } from '@/lib/requestLocale'
import { ui } from '@/lib/ui-strings'
import { ShopProvider } from '@/modules/ecommerce/components/ShopProvider'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { cn } from '@/utilities/ui'
import { getServerSideURL } from '@/utilities/getURL'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getAlternates } from '@/utilities/queries'
import { runtimeEnv } from '@/utilities/runtimeEnv'

import './globals.css'

/**
 * The frontend renders on request instead of being prerendered at build time:
 * - the Docker image is built in CI without a database,
 * - feature flags and the public URL come from the container env at runtime.
 * Published content is cached in the Next data cache (unstable_cache + tags) and
 * invalidated by the Payload hooks, so most requests don't hit MongoDB.
 *
 * The locale comes from src/proxy.ts (a request header): this layout sits above the
 * [locale] segment because it also wraps the feature-module routes.
 */
export const dynamic = 'force-dynamic'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ isEnabled }, { locale, pathname }] = await Promise.all([draftMode(), requestLocale()])
  const [settings, alternates] = await Promise.all([
    getSiteSettings(locale),
    getAlternates(pathname),
  ])
  const t = ui(locale)

  const content = (
    <>
      <AdminBar adminBarProps={{ preview: isEnabled }} />
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2"
        href="#main"
      >
        {t.skipToContent}
      </a>
      <Header alternates={alternates} locale={locale} />
      <main className="flex-1" id="main">
        {children}
      </main>
      <Footer locale={locale} />
      <MobileActionBar locale={locale} />
      <LazyToaster />
      <Analytics websiteId={runtimeEnv('UMAMI_WEBSITE_ID')} />
    </>
  )

  return (
    <html className={cn(fontVariables)} id="top" lang={htmlLang(locale)} suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link href="/apple-icon.png" rel="apple-touch-icon" />
      </head>
      <body>
        <Preloader />
        <SiteJsonLd locale={locale} settings={settings} />
        <Providers>
          <LocaleProvider locale={locale} messages={pickClientMessages(getMessages(locale))}>
            {features.ecommerce ? <ShopProvider>{content}</ShopProvider> : content}
          </LocaleProvider>
        </Providers>
      </body>
    </html>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await requestLocale()
  const settings = await getSiteSettings(locale)
  const siteName = settings?.businessName || settings?.personName || undefined
  const noIndex = Boolean(settings?.technical?.noIndex)

  const ogImage = settings?.technical?.defaultOgImage
  const ogImageUrl =
    ogImage && typeof ogImage === 'object' ? ogImage.sizes?.og?.url || ogImage.url : undefined
  // Optional: the domain property is DNS-verified; this is for an extra URL-prefix property.
  const googleVerification = runtimeEnv('GOOGLE_SITE_VERIFICATION')

  return {
    metadataBase: new URL(getServerSideURL()),
    // Pages set their own; this covers routes without metadata of their own.
    description: settings?.technical?.defaultMetaDescription || undefined,
    openGraph: mergeOpenGraph({
      siteName,
      locale: locale === 'nl-BE' ? 'nl_BE' : 'en_GB',
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
    }),
    robots: noIndex ? { index: false, follow: false } : undefined,
    twitter: { card: 'summary_large_image' },
    verification: googleVerification ? { google: googleVerification } : undefined,
  }
}
