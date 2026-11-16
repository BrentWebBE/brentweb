import type { SiteSetting } from '@/payload-types'

import { getCachedGlobal } from './getGlobals'

/**
 * Cached SiteSettings (depth 1, so the logo is populated).
 * Always go through this helper: `getCachedGlobal` keys its cache on the slug only.
 */
export const getSiteSettings = (): Promise<SiteSetting> => getCachedGlobal('site-settings', 1)()

export const getSiteName = async (): Promise<string> => {
  const settings = await getSiteSettings()
  return settings?.businessName || ''
}
