import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'
import { getSiteName } from './getSiteSettings'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const generateMeta = async (args: {
  /** Any document with SEO meta: pages, posts, products. */
  doc: Partial<Pick<Page, 'meta' | 'slug' | 'title'>> | Partial<Post> | null
  /** Public path of the document, used for og:url (e.g. `/`, `/over-ons`, `/posts/x`). */
  path?: string
}): Promise<Metadata> => {
  const { doc, path } = args

  const ogImage = getImageURL(doc?.meta?.image)
  const siteName = await getSiteName()

  // meta.title is the full <title> (the SEO plugin's generator already appends the site name).
  const title = doc?.meta?.title || [doc?.title, siteName].filter(Boolean).join(' | ') || siteName

  return {
    description: doc?.meta?.description,
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      siteName: siteName || undefined,
      title,
      url: path ?? '/',
    }),
    title,
  }
}
