import React from 'react'

import type { Page } from '@/payload-types'

import { JsonLd } from '@/components/JsonLd'
import { plainText } from '@/components/handmade/Marked'
import type { Locale } from '@/lib/locales'
import { fillPrices, priceBounds } from '@/lib/prices'
import { HOME_SLUG, homeHref } from '@/lib/routing'
import type { ScopeKey } from '@/lib/schemas/lead'
import { ui } from '@/lib/ui-strings'
import { getServerSideURL } from '@/utilities/getURL'
import { getSiteSettings } from '@/utilities/getSiteSettings'

import { aggregateOffer, businessId } from './schema'

/** Breadcrumb for every page but home, plus Service or local-area data when set. */
export async function PageJsonLd({
  locale,
  page,
  path,
}: {
  locale: Locale
  page: Page
  path: string
}) {
  if (page.slug === HOME_SLUG) return null
  const origin = getServerSideURL()
  const url = `${origin}${path}`
  const name = plainText(page.title)
  const sd = page.structuredData

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: ui(locale).breadcrumbHome,
        item: `${origin}${homeHref(locale)}`,
      },
      { '@type': 'ListItem', position: 2, name, item: url },
    ],
  }

  let extra: Record<string, unknown> | null = null
  if (sd?.type === 'service') {
    const settings = await getSiteSettings(locale)
    const scopes = (sd.scopes ?? []) as ScopeKey[]
    const bounds = scopes.length ? priceBounds(scopes) : null
    extra = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${url}#service`,
      name: sd.serviceName || name,
      description: fillPrices(page.meta?.description || '', locale) || undefined,
      url,
      provider: { '@id': businessId() },
      areaServed: { '@type': 'Country', name: 'België' },
      offers: bounds
        ? aggregateOffer(bounds.min, bounds.max, url, Boolean(settings?.vatExempt))
        : undefined,
    }
  } else if (sd?.type === 'local' && sd.areaServed?.length) {
    extra = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${url}#service`,
      name,
      url,
      provider: { '@id': businessId() },
      areaServed: sd.areaServed.map((a) => ({ '@type': a.kind, name: a.name })),
    }
  }

  return (
    <>
      <JsonLd data={breadcrumb} />
      {extra && <JsonLd data={extra} />}
    </>
  )
}
