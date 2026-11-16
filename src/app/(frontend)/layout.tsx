import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import React from 'react'

import { fontVariables } from '@/client/fonts'
import { AdminBar } from '@/components/AdminBar'
import { LocalBusinessJsonLd } from '@/components/LocalBusinessJsonLd'
import { features } from '@/features'
import { ShopProvider } from '@/modules/ecommerce/components/ShopProvider'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * The frontend renders on request instead of being prerendered at build time:
 * - the Docker image is built in CI without a database,
 * - feature flags and the public URL come from the container env at runtime.
 * Published content is cached in the Next data cache (unstable_cache + tags) and
 * invalidated by the Payload hooks, so most requests don't hit MongoDB.
 */
export const dynamic = 'force-dynamic'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ isEnabled }, settings] = await Promise.all([draftMode(), getSiteSettings()])

  const content = (
    <>
      <AdminBar
        adminBarProps={{
          preview: isEnabled,
        }}
      />

      <Header />
      {children}
      <Footer />
    </>
  )

  return (
    <html className={cn(fontVariables)} lang="nl-BE" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <LocalBusinessJsonLd settings={settings} />
        <Providers>
          {/* The cart provider only exists when the webshop is enabled. */}
          {features.ecommerce ? <ShopProvider>{content}</ShopProvider> : content}
        </Providers>
      </body>
    </html>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const siteName = settings?.businessName || undefined
  const noIndex = Boolean(settings?.technical?.noIndex)

  return {
    metadataBase: new URL(getServerSideURL()),
    openGraph: mergeOpenGraph({ siteName }),
    robots: noIndex ? { index: false, follow: false } : undefined,
    twitter: {
      card: 'summary_large_image',
    },
  }
}
