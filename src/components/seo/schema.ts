import type { SiteSetting } from '@/payload-types'

import { schemaPriceRange } from '@/lib/prices'
import { DAYS } from '@/SiteSettings/options'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * The two entities every page points at: the business and the person behind it.
 * Every copy must be identical across pages and locales (same @id, same values), so
 * nothing here depends on the page being rendered.
 */
export const businessId = () => `${getServerSideURL()}/#business`
export const personId = () => `${getServerSideURL()}/#person`
/** The Dutch homepage: the market, and what the bare domain serves most visitors. */
export const entityUrl = () => `${getServerSideURL()}/nl-BE`
export const websiteId = () => `${getServerSideURL()}/#website`

/** Used until site-settings has its own list (Technisch > Gebied voor zoekmachines). */
const DEFAULT_AREA_SERVED = [
  { kind: 'AdministrativeArea', name: 'Kempen' },
  { kind: 'City', name: 'Geel' },
  { kind: 'City', name: 'Blankenberge' },
] as const

/** schema.org OpeningHoursSpecification rows; closed days and half-filled rows are skipped. */
export const openingHoursSpecification = (rows: SiteSetting['openingHours']) =>
  (rows ?? [])
    .filter((row) => !row.closed && row.open && row.close)
    .map((row) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAYS.find((d) => d.value === row.day)?.schema,
      opens: row.open,
      closes: row.close,
    }))

const absolute = (url: string | null | undefined) =>
  !url ? undefined : url.startsWith('http') ? url : `${getServerSideURL()}${url}`

export function buildSiteSchemas(settings: SiteSetting | null | undefined) {
  if (!settings?.businessName) return []
  const origin = getServerSideURL()
  const portrait =
    settings.portrait && typeof settings.portrait === 'object'
      ? absolute(settings.portrait.url)
      : undefined
  const sameAs = (settings.socialLinks ?? []).map((s) => s.url).filter(Boolean)
  const telephone = settings.phone
    ? settings.phone.replace(/[^\d+]/g, '').replace(/^0/, '+32')
    : undefined
  const address =
    settings.address?.city || settings.address?.street
      ? {
          '@type': 'PostalAddress',
          streetAddress: settings.address?.street || undefined,
          postalCode: settings.address?.postalCode || undefined,
          addressLocality: settings.address?.city || undefined,
          addressCountry: 'BE',
        }
      : undefined
  // geo must describe the postal address (Google checks they agree), so prefer the
  // location whose name matches the address city; the first one is only a fallback.
  const city = settings.address?.city?.trim().toLowerCase()
  const home =
    settings.locations?.find((l) => city && l.name.trim().toLowerCase() === city) ??
    settings.locations?.[0]
  const areas = settings.technical?.areaServed?.length
    ? settings.technical.areaServed
    : DEFAULT_AREA_SERVED
  const hours = openingHoursSpecification(settings.openingHours)

  const business = {
    '@context': 'https://schema.org',
    '@type': settings.technical?.schemaType || 'ProfessionalService',
    '@id': businessId(),
    name: settings.businessName,
    alternateName: 'brentweb.be',
    // The trading name is the brand; the registered (legal) name is the person's.
    legalName: settings.personName || undefined,
    url: entityUrl(),
    logo: `${origin}/logo-social.png`,
    image: portrait,
    email: settings.email || undefined,
    telephone,
    priceRange: settings.technical?.priceRange || schemaPriceRange(),
    currenciesAccepted: 'EUR',
    areaServed: [
      ...areas.map((a) => ({ '@type': a.kind, name: a.name })),
      { '@type': 'Country', name: 'België' },
    ],
    knowsLanguage: ['nl-BE', 'en'],
    identifier: settings.kboNumber
      ? { '@type': 'PropertyValue', propertyID: 'KBO', value: settings.kboNumber }
      : undefined,
    vatID: settings.vatNumber || undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    address,
    geo: home ? { '@type': 'GeoCoordinates', latitude: home.lat, longitude: home.lng } : undefined,
    openingHoursSpecification: hours.length ? hours : undefined,
    founder: settings.personName ? { '@id': personId() } : undefined,
  }

  const person = settings.personName
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': personId(),
        name: settings.personName,
        alternateName: 'BrentWeb',
        url: entityUrl(),
        image: portrait,
        email: settings.email || undefined,
        telephone,
        jobTitle: 'Freelance web developer',
        address,
        worksFor: { '@id': businessId() },
        sameAs: sameAs.length ? sameAs : undefined,
        knowsAbout: [
          'Web development',
          'TypeScript',
          'React',
          'Next.js',
          'Node.js',
          'Docker',
          'Linux',
          'Network security',
        ],
      }
    : null

  // WebSite: lets Google show the brand as the site name in results.
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId(),
    name: settings.businessName,
    alternateName: 'brentweb.be',
    url: entityUrl(),
    inLanguage: ['nl-BE', 'en'],
    publisher: { '@id': businessId() },
  }

  return [business, person, website].filter(Boolean) as Record<string, unknown>[]
}

/** schema.org AggregateOffer for a price range (VAT-included when the business is exempt). */
export function aggregateOffer(min: number, max: number, url: string, vatExempt: boolean) {
  return {
    '@type': 'AggregateOffer',
    priceCurrency: 'EUR',
    lowPrice: min,
    highPrice: max,
    url,
    priceSpecification: {
      '@type': 'PriceSpecification',
      priceCurrency: 'EUR',
      minPrice: min,
      maxPrice: max,
      valueAddedTaxIncluded: vatExempt,
    },
  }
}
