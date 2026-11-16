import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

import type { Project } from '@/payload-types'

import { EXPIRE_NOW, PROJECTS_TAG, projectTag } from '@/utilities/cacheTags'

/**
 * Any change to a published project can show up on every page that lists projects,
 * so the collection tag expires too (pages read projects through it).
 */
export const revalidateProject: CollectionAfterChangeHook<Project> = ({
  doc,
  previousDoc,
  req: { context },
}) => {
  if (context.disableRevalidate) return doc
  const wasPublished = previousDoc?._status === 'published'
  if (doc._status === 'published' || wasPublished) {
    revalidateTag(projectTag(doc.slug), EXPIRE_NOW)
    if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
      revalidateTag(projectTag(previousDoc.slug), EXPIRE_NOW)
    }
    revalidateTag(PROJECTS_TAG, EXPIRE_NOW)
    revalidateTag('pages-sitemap', 'max')
  }
  return doc
}

export const revalidateProjectDelete: CollectionAfterDeleteHook<Project> = ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return doc
  if (doc?.slug) revalidateTag(projectTag(doc.slug), EXPIRE_NOW)
  revalidateTag(PROJECTS_TAG, EXPIRE_NOW)
  revalidateTag('pages-sitemap', 'max')
  return doc
}
