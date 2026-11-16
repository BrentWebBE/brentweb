import type { CollectionAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

import { EXPIRE_NOW } from '@/utilities/cacheTags'

export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  payload.logger.info(`Revalidating redirects`)

  revalidateTag('redirects', EXPIRE_NOW)

  return doc
}
