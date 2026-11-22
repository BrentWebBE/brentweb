import type { NextConfig } from 'next'

type Redirect = { source: string; destination: string; statusCode: 301 }
const moved = (source: string, destination: string): Redirect => ({
  source,
  destination,
  statusCode: 301,
})

/**
 * Every URL the old portfolio (brentweb-portfolio) answered that has a new home, so
 * links and search results keep working. 301, the status every crawler treats as "moved
 * for good". More specific patterns come first. Editors can add more in the admin
 * (Redirects collection); these are the structural ones.
 */
const portfolioRedirects: Redirect[] = [
  // The Dutch site used English section names before they were translated.
  moved('/nl-BE/pricing', '/nl-BE/prijzen'),
  moved('/nl-BE/work', '/nl-BE/projecten'),
  moved('/nl-BE/work/:slug', '/nl-BE/projecten/:slug'),

  // The separate engineering section is folded into the about page and the projects.
  moved('/nl-BE/techniek/projecten/:slug', '/nl-BE/projecten/:slug'),
  moved('/nl-BE/techniek/projecten', '/nl-BE/projecten'),
  moved('/nl-BE/techniek/:rest*', '/nl-BE/over-mij'),
  moved('/nl-BE/tech/work/:slug', '/nl-BE/projecten/:slug'),
  moved('/nl-BE/tech/work', '/nl-BE/projecten'),
  moved('/nl-BE/tech/:rest*', '/nl-BE/over-mij'),
  moved('/en/tech/work/:slug', '/en/work/:slug'),
  moved('/en/tech/work', '/en/work'),
  moved('/en/tech/:rest*', '/en/about'),

  // Even older: the business path once lived under /business.
  moved('/en/business/calculator', '/en/pricing'),
  moved('/nl-BE/business/calculator', '/nl-BE/prijzen'),
  moved('/en/business/work/:slug*', '/en/work/:slug*'),
  moved('/nl-BE/business/work/:slug*', '/nl-BE/projecten/:slug*'),
  moved('/:locale(en|nl-BE)/business', '/:locale'),

  // The old internal 404 pages.
  moved('/nl-BE/pagina-niet-gevonden', '/nl-BE'),
  moved('/en/page-not-found', '/en'),
]

export const redirects: NextConfig['redirects'] = async () => {
  // The website-check thank-you used to be /bedankt?bron=websitecheck.
  const websiteCheckThankYou = [
    { locale: 'nl-BE', from: 'bedankt', to: 'bedankt-websitecheck' },
    { locale: 'en', from: 'thank-you', to: 'thank-you-website-check' },
  ].map(({ from, locale, to }) => ({
    source: `/${locale}/${from}`,
    has: [{ type: 'query' as const, key: 'bron', value: 'websitecheck' }],
    destination: `/${locale}/${to}`,
    permanent: true,
  }))

  return [...websiteCheckThankYou, ...portfolioRedirects]
}
