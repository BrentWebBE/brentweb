import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

import { EXPIRE_NOW } from '@/utilities/cacheTags'

export const revalidateHeader: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating header`)

    revalidateTag('global_header', EXPIRE_NOW)
  }

  return doc
}
