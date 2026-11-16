'use client'

import { createContext, useContext, useMemo } from 'react'
import type { Locale } from '@/lib/locales'
import type { ClientMessages } from '@/lib/client-messages'
import { createTranslator } from '@/lib/translate'

type Translate = ReturnType<typeof createTranslator>

type LocaleContextValue = {
  locale: Locale
  messages: ClientMessages
  t: Translate
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

/**
 * Carries the locale resolved on the server (from the URL segment) and the client
 * message namespaces (lib/client-messages.ts) into the client tree, so client
 * components render in the right language on first paint.
 *
 * Render it from a server component:
 *   <LocaleProvider locale={locale} messages={pickClientMessages(getMessages(locale))}>
 */
export function LocaleProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale
  messages: ClientMessages
  children: React.ReactNode
}) {
  const value = useMemo<LocaleContextValue>(
    () => ({ locale, messages, t: createTranslator(messages) }),
    [locale, messages],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocaleContext(): LocaleContextValue {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocaleContext must be used within a LocaleProvider')
  }
  return context
}
