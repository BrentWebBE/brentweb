/** Walks a dotted key path through a message tree. */
function lookup(tree: unknown, keys: string[]): unknown {
  let value = tree
  for (const k of keys) {
    value =
      typeof value === 'object' && value !== null
        ? (value as Record<string, unknown>)[k]
        : undefined
  }
  return value
}

/**
 * String lookup over one message tree, with an optional fallback tree for
 * keys missing in it. Arrays and objects (timeline entries, scope bullets) are
 * read from the typed messages object instead, never through t(), so the
 * result is always a string. Imports no message bundle, so it is safe to use
 * in client components.
 */
export function createTranslator(messages: unknown, fallback?: unknown) {
  return (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    const value =
      lookup(messages, keys) ?? (fallback === undefined ? undefined : lookup(fallback, keys))
    if (typeof value !== 'string' || value === '') return key

    if (!params) return value
    return value.replace(/\{(\w+)\}/g, (_, paramKey) => String(params[paramKey] ?? `{${paramKey}}`))
  }
}
