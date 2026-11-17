import type { Metadata } from 'next'

import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import React from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { PageJsonLd } from '@/components/seo/PageJsonLd'
import { isLocale } from '@/lib/locale'
import type { Locale } from '@/lib/locales'
import { HOME_SLUG, pageHref } from '@/lib/routing'
import { pageMetadata } from '@/utilities/pageMeta'
import { getAlternates, getPage } from '@/utilities/queries'

export const resolveLocale = (value: string): Locale => {
  if (!isLocale(value)) notFound()
  return value
}

/** Shared by the home route and the [slug] route. */
export async function renderPage(locale: Locale, slug: string = HOME_SLUG) {
  const decoded = decodeURIComponent(slug)
  const path = pageHref(locale, decoded)
  const [page, { isEnabled: draft }] = await Promise.all([getPage(locale, decoded), draftMode()])

  if (!page) return <PayloadRedirects locale={locale} url={path} />

  return (
    <article className="pb-8">
      <PayloadRedirects disableNotFound locale={locale} url={path} />
      {draft && <LivePreviewListener />}
      <PageJsonLd locale={locale} page={page} path={path} />
      <RenderBlocks blocks={page.layout} locale={locale} />
    </article>
  )
}

export async function pageMetadataFor(locale: Locale, slug: string = HOME_SLUG): Promise<Metadata> {
  const decoded = decodeURIComponent(slug)
  const path = pageHref(locale, decoded)
  const [page, alternates] = await Promise.all([getPage(locale, decoded), getAlternates(path)])
  if (!page) return {}
  return pageMetadata({ alternates, doc: page, locale, path })
}
