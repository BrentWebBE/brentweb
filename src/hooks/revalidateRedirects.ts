import type { CollectionAfterChangeHook } from 'payload'

import { expireTag } from '@/utilities/expireTag'

/**
 * Redirects are cached together under one tag. expireTag (not revalidateTag) because
 * redirects are also written outside a Next request (the slug-change hook in scripts
 * and jobs), where revalidateTag throws and would roll back the whole write.
 */
export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req }) => {
  if (req.context.disableRevalidate) return doc
  req.payload.logger.info(`Revalidating redirects`)
  expireTag('redirects')
  return doc
}
