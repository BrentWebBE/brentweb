import type { GlobalAfterChangeHook } from 'payload'

import { expireTag } from '@/utilities/expireTag'

export const revalidateSiteSettings: GlobalAfterChangeHook = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating site settings`)

    expireTag('global_site-settings')
  }

  return doc
}
