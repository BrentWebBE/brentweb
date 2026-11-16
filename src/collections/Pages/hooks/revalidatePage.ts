import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

import type { Page } from '../../../payload-types'
import { EXPIRE_NOW, PAGES_TAG, pageTag } from '../../../utilities/cacheTags'

/**
 * Pages are cached per slug (and locale, via the cache key). The slug is localized, so
 * a save in one locale only knows that locale's slug: expire every cached page on any
 * published change. A personal site has a few dozen pages; this is cheap and never stale.
 */
export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc
  if (doc._status === 'published' || previousDoc?._status === 'published') {
    payload.logger.info(`Revalidating pages after a change to "${doc.slug}"`)
    if (doc.slug) revalidateTag(pageTag(doc.slug), EXPIRE_NOW)
    revalidateTag(PAGES_TAG, EXPIRE_NOW)
    revalidateTag('pages-sitemap', 'max')
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({ doc, req: { context } }) => {
  if (context.disableRevalidate) return doc
  revalidateTag(PAGES_TAG, EXPIRE_NOW)
  revalidateTag('pages-sitemap', 'max')
  return doc
}
