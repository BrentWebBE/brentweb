import { defaultLocale, locales, type Locale } from '@/lib/locales'

/**
 * Locale helpers shared by the proxy, the routes and the language switcher.
 * Payload uses the same codes (`nl-BE`, `en`) as the URL prefix, so a locale
 * from the path can be passed to the Local API as-is.
 */

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

/**
 * Picks the best locale from an Accept-Language header (q-values below 0.1 are
 * ignored). No header at all, which is most crawlers, gets Dutch: Flemish
 * businesses are the market. A header naming neither language gets English.
 */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return 'nl-BE'

  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      const quality = q ? Number.parseFloat(q.slice(2)) : 1
      return { tag: (tag ?? '').trim().toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality }
    })
    .filter((entry) => entry.tag !== '' && entry.quality >= 0.1)
    .sort((a, b) => b.quality - a.quality)

  for (const { tag } of ranked) {
    if (tag === 'nl' || tag.startsWith('nl-')) return 'nl-BE'
    if (tag === 'en' || tag.startsWith('en-')) return 'en'
  }

  return defaultLocale
}

/** Strips a leading locale segment, returning the locale and the remainder. */
export function splitLocalePath(pathname: string): { locale: Locale | null; rest: string } {
  const [first, ...others] = pathname.split('/').filter(Boolean)
  if (isLocale(first)) {
    return { locale: first, rest: others.length ? `/${others.join('/')}` : '' }
  }
  return { locale: null, rest: pathname === '/' ? '' : pathname }
}

/** The other locale, for the language switcher (there are exactly two). */
export const otherLocale = (locale: Locale): Locale => (locale === 'nl-BE' ? 'en' : 'nl-BE')

/** BCP 47 language tag for `<html lang>` and Intl. */
export const htmlLang = (locale: Locale): string => (locale === 'nl-BE' ? 'nl-BE' : 'en')
