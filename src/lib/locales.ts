/**
 * The supported locales, without the message bundles.
 *
 * Client code imports from here (or `import type` from '@/i18n'): a value import of
 * '@/i18n' pulls both complete message bundles into the browser bundle.
 *
 * The codes double as URL prefixes (/nl-BE, /en) and as Payload locale codes.
 */
export const locales = ['nl-BE', 'en'] as const
export type Locale = (typeof locales)[number]

/**
 * Fallback for visitors whose browser asks for neither language (see negotiateLocale):
 * English is the better guess for someone who doesn't read Dutch.
 */
export const defaultLocale: Locale = 'en'

/** The language content is written in first; Payload falls back to it. */
export const contentLocale: Locale = 'nl-BE'

export const localeLabels: Record<Locale, string> = {
  'nl-BE': 'Nederlands',
  en: 'English',
}
