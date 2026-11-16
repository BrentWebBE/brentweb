/**
 * Bilingual admin label: Dutch first, English fallback.
 * Payload picks the key matching the admin language.
 */
export const l = (nl: string, en: string): Record<'nl' | 'en', string> => ({ nl, en })
