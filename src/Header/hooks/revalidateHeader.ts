import type { GlobalAfterChangeHook } from 'payload'

import { expireTag } from '@/utilities/expireTag'

export const revalidateHeader: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating header`)

    expireTag('global_header')
  }

  return doc
}
