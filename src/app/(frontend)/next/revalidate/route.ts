import { revalidateTag } from 'next/cache'

import { EXPIRE_NOW, PAGES_TAG, PROJECTS_TAG, TESTIMONIALS_TAG } from '@/utilities/cacheTags'

/**
 * Expires every cached content tag. For writes that bypass the Payload hooks: the
 * portfolio migration script, a restored backup, a manual database fix.
 *
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<site>/next/revalidate
 */
const TAGS = [
  PAGES_TAG,
  PROJECTS_TAG,
  TESTIMONIALS_TAG,
  'global_header',
  'global_footer',
  'global_site-settings',
  'redirects',
  'pages-sitemap',
]

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  for (const tag of TAGS) revalidateTag(tag, EXPIRE_NOW)
  return Response.json({ revalidated: TAGS })
}
