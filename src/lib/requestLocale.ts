import { headers } from 'next/headers'

import { contentLocale, type Locale } from '@/lib/locales'
import { isLocale } from '@/lib/locale'
import { LOCALE_HEADER, PATH_HEADER } from '@/lib/localeHeaders'

/**
 * The locale and path of the current request, for server components above the
 * [locale] segment (the root layout, not-found). Falls back to Dutch for the
 * feature-module routes that live outside the locale prefix.
 */
export async function requestLocale(): Promise<{ locale: Locale; pathname: string }> {
  const h = await headers()
  const value = h.get(LOCALE_HEADER)
  return {
    locale: isLocale(value) ? value : contentLocale,
    pathname: h.get(PATH_HEADER) ?? '/',
  }
}
