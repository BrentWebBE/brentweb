import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { getServerSideURL } from '@/utilities/getURL'

export const getPostsSitemap = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })
    const SITE_URL = getServerSideURL()

    const results = await payload.find({
      collection: 'posts',
      overrideAccess: false,
      draft: false,
      depth: 0,
      limit: 1000,
      pagination: false,
      where: {
        _status: {
          equals: 'published',
        },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    })

    const dateFallback = new Date().toISOString()

    return results.docs
      .filter((post) => Boolean(post?.slug))
      .map((post) => ({
        loc: `${SITE_URL}/posts/${post.slug}`,
        lastmod: post.updatedAt || dateFallback,
      }))
  },
  ['posts-sitemap'],
  {
    tags: ['posts-sitemap'],
  },
)
