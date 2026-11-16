import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

import { EXPIRE_NOW } from '@/utilities/cacheTags'

export const revalidateFooter: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating footer`)

    revalidateTag('global_footer', EXPIRE_NOW)
  }

  return doc
}
