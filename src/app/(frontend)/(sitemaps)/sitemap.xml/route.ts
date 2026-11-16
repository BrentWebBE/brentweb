import { getServerSideSitemapIndex } from 'next-sitemap'

import { features } from '@/features'
import { getServerSideURL } from '@/utilities/getURL'

/** Sitemap index, built per request from the runtime URL and feature flags. */
export const dynamic = 'force-dynamic'

export async function GET() {
  const siteURL = getServerSideURL()

  return getServerSideSitemapIndex([
    `${siteURL}/pages-sitemap.xml`,
    ...(features.blog ? [`${siteURL}/posts-sitemap.xml`] : []),
  ])
}
