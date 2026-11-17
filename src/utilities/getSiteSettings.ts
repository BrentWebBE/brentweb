import type { SiteSetting } from '@/payload-types'

import { contentLocale, type Locale } from '@/lib/locales'

import { getCachedGlobal } from './getGlobals'

/** Cached SiteSettings (depth 1, so logo and portrait are populated). */
export const getSiteSettings = (locale: Locale = contentLocale): Promise<SiteSetting> =>
  getCachedGlobal('site-settings', 1, locale)()

export const getSiteName = async (): Promise<string> => {
  const settings = await getSiteSettings()
  return settings?.businessName || ''
}
