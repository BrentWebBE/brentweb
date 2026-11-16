import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { expireTag } from '@/utilities/expireTag'

import type { Project } from '@/payload-types'

import { PROJECTS_TAG, projectTag } from '@/utilities/cacheTags'

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
    expireTag(projectTag(doc.slug))
    if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
      expireTag(projectTag(previousDoc.slug))
    }
    expireTag(PROJECTS_TAG)
    expireTag('pages-sitemap', 'max')
  }
  return doc
}

export const revalidateProjectDelete: CollectionAfterDeleteHook<Project> = ({
  doc,
  req: { context },
}) => {
  if (context.disableRevalidate) return doc
  if (doc?.slug) expireTag(projectTag(doc.slug))
  expireTag(PROJECTS_TAG)
  expireTag('pages-sitemap', 'max')
  return doc
}
