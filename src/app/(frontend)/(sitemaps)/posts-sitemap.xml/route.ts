import { getServerSideSitemap } from 'next-sitemap'

import { features } from '@/features'
import { getPostsSitemap } from '@/modules/blog/routes/postsSitemap'

export async function GET() {
  if (!features.blog) {
    return new Response('Not found', { status: 404 })
  }

  const sitemap = await getPostsSitemap()

  return getServerSideSitemap(sitemap)
}
