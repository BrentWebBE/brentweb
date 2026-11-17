'use client'

import { useLocaleContext } from '@/components/LocaleProvider'

/** The current locale, from LocaleProvider. Switching language is done by links. */
export function useLocale() {
  const { locale } = useLocaleContext()
  return { locale }
}

/** `t('namespace.key', params)` over the client message namespaces. */
export function useTranslations() {
  const { t } = useLocaleContext()
  return { t }
}

export { useLocaleContext }
