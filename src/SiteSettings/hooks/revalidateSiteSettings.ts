import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

import { EXPIRE_NOW } from '@/utilities/cacheTags'

export const revalidateSiteSettings: GlobalAfterChangeHook = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating site settings`)

    revalidateTag('global_site-settings', EXPIRE_NOW)
  }

  return doc
}
