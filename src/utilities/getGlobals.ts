import type { Config } from 'src/payload-types'

import configPromise from '@payload-config'
import { type DataFromGlobalSlug, getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import { contentLocale, type Locale } from '@/lib/locales'

type Global = keyof Config['globals']

async function getGlobal<T extends Global>(
  slug: T,
  depth: number,
  locale: Locale,
): Promise<DataFromGlobalSlug<T>> {
  const payload = await getPayload({ config: configPromise })
  return payload.findGlobal({ slug, depth, locale })
}

/**
 * A cached global in one locale. The cache key includes depth and locale; the tag is
 * per global, so one save expires every locale.
 */
export const getCachedGlobal = <T extends Global>(
  slug: T,
  depth = 0,
  locale: Locale = contentLocale,
) =>
  unstable_cache(async () => getGlobal<T>(slug, depth, locale), [slug, String(depth), locale], {
    tags: [`global_${slug}`],
  })
