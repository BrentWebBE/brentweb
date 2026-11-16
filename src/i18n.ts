// Simple i18n implementation without next-intl dependency
import enMessages from '@/messages/en.json'
import nlBEMessages from '@/messages/nl-BE.json'
import { defaultLocale, locales, type Locale } from '@/lib/locales'
import { createTranslator } from '@/lib/translate'

// Server-side entry point: importing a value from this module bundles both
// message files. Client components use `import type` from here and get their
// strings from LocaleProvider; locales live in lib/locales.ts.
export { locales, defaultLocale, type Locale }

const messages = {
  en: enMessages,
  'nl-BE': nlBEMessages,
} as const

export type Messages = typeof enMessages

/** String lookup with an English fallback for keys missing in the locale. */
export function getTranslations(locale: Locale = defaultLocale) {
  return { t: createTranslator(messages[locale], messages[defaultLocale]) }
}

export function getMessages(locale: Locale = defaultLocale): Messages {
  return messages[locale] || messages[defaultLocale]
}
