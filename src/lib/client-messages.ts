import type { Messages } from '@/i18n'

/**
 * The message namespaces client components read (through useTranslations or
 * useLocaleContext). Only these are serialized into each page for
 * LocaleProvider; everything else is rendered on the server and would only add
 * unused JSON to every HTML document.
 *
 * Reading a namespace that isn't listed fails the type check, since the context
 * is typed as ClientMessages. Add it here when that happens.
 */
export const CLIENT_NAMESPACES = [
  'calculator',
  'contact',
  'errors',
  'pain',
  'pricing',
  'projects',
  'websiteCheck',
] as const satisfies readonly (keyof Messages)[]

export type ClientMessages = Pick<Messages, (typeof CLIENT_NAMESPACES)[number]>

export function pickClientMessages(messages: Messages): ClientMessages {
  return Object.fromEntries(CLIENT_NAMESPACES.map((ns) => [ns, messages[ns]])) as ClientMessages
}
