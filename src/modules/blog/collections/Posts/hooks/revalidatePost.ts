import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '@/payload-types'
import { EXPIRE_NOW, POSTS_TAG, postTag } from '@/utilities/cacheTags'

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/posts/${doc.slug}`

      payload.logger.info(`Revalidating post at path: ${path}`)

      revalidatePath(path)
      revalidateTag(postTag(doc.slug), EXPIRE_NOW)
      revalidateTag(POSTS_TAG, EXPIRE_NOW)
      revalidateTag('posts-sitemap', 'max')
    }

    // Previously published at this or another slug (unpublished or renamed): purge the old path.
    if (
      previousDoc?._status === 'published' &&
      (doc._status !== 'published' || previousDoc.slug !== doc.slug)
    ) {
      const oldPath = `/posts/${previousDoc.slug}`

      payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      revalidatePath(oldPath)
      revalidateTag(postTag(previousDoc.slug), EXPIRE_NOW)
      revalidateTag(POSTS_TAG, EXPIRE_NOW)
      revalidateTag('posts-sitemap', 'max')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/posts/${doc?.slug}`

    revalidatePath(path)
    if (doc?.slug) revalidateTag(postTag(doc.slug), EXPIRE_NOW)
    revalidateTag(POSTS_TAG, EXPIRE_NOW)
    revalidateTag('posts-sitemap', 'max')
  }

  return doc
}
