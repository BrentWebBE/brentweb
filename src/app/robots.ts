import type { MetadataRoute } from 'next'

import { features } from '@/features'
import { getServerSideURL } from '@/utilities/getURL'
import { getSiteSettings } from '@/utilities/getSiteSettings'

// Generated per request: the domain and the noindex switch are runtime values.
export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteURL = getServerSideURL()
  const settings = await getSiteSettings()

  if (settings?.technical?.noIndex) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api/',
        '/next/',
        ...(features.blog ? ['/search'] : []),
        ...(features.ecommerce ? ['/shop/winkelmand', '/shop/afrekenen', '/shop/bevestiging'] : []),
      ],
    },
    sitemap: `${siteURL}/sitemap.xml`,
  }
}
