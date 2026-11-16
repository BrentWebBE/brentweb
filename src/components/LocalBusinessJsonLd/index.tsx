import React from 'react'

import type { SiteSetting } from '@/payload-types'

import { JsonLd } from '@/components/JsonLd'
import { DAYS } from '@/SiteSettings/options'
import { getServerSideURL } from '@/utilities/getURL'

const absoluteUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined
  return url.startsWith('http') ? url : `${getServerSideURL()}${url}`
}

export const buildLocalBusinessJsonLd = (settings: SiteSetting): Record<string, unknown> | null => {
  if (!settings?.businessName) return null

  const {
    address,
    businessName,
    email,
    logo,
    openingHours,
    phone,
    socialLinks,
    technical,
    vatNumber,
  } = settings
  const logoUrl = logo && typeof logo === 'object' ? absoluteUrl(logo.url) : undefined

  const openingHoursSpecification = (openingHours ?? [])
    .filter((row) => !row.closed && row.open && row.close)
    .map((row) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAYS.find((d) => d.value === row.day)?.schema,
      opens: row.open,
      closes: row.close,
    }))

  const hasAddress = Boolean(address?.street || address?.city)
  const sameAs = (socialLinks ?? []).map((link) => link.url).filter(Boolean)

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': technical?.schemaType || 'LocalBusiness',
    '@id': `${getServerSideURL()}/#organization`,
    name: businessName,
    url: getServerSideURL(),
    logo: logoUrl,
    image: logoUrl,
    telephone: phone || undefined,
    email: email || undefined,
    vatID: vatNumber || undefined,
    priceRange: technical?.priceRange || undefined,
    address: hasAddress
      ? {
          '@type': 'PostalAddress',
          streetAddress: address?.street || undefined,
          postalCode: address?.postalCode || undefined,
          addressLocality: address?.city || undefined,
          addressCountry: 'BE',
        }
      : undefined,
    openingHoursSpecification: openingHoursSpecification.length
      ? openingHoursSpecification
      : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  }

  return data
}

export const LocalBusinessJsonLd: React.FC<{ settings: SiteSetting }> = ({ settings }) => {
  const data = buildLocalBusinessJsonLd(settings)
  return data ? <JsonLd data={data} /> : null
}
