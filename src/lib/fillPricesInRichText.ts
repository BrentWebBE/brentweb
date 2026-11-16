import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

import type { Locale } from '@/lib/locales'
import { fillPrices } from '@/lib/prices'

/** fillPrices() over every text node of a Lexical document, without mutating it. */
export function fillPricesInRichText<T extends DefaultTypedEditorState>(
  state: T,
  locale: Locale,
): T {
  const walk = (node: unknown): unknown => {
    if (!node || typeof node !== 'object') return node
    const n = node as Record<string, unknown>
    const next: Record<string, unknown> = { ...n }
    if (n.type === 'text' && typeof n.text === 'string') next.text = fillPrices(n.text, locale)
    if (Array.isArray(n.children)) next.children = n.children.map(walk)
    return next
  }
  return { ...state, root: walk(state.root) } as T
}
