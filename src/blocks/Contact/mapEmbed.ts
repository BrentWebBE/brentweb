export const ALLOWED_MAP_EMBED_PREFIXES = [
  'https://www.google.com/maps/embed?',
  'https://maps.google.com/maps?',
  'https://www.openstreetmap.org/export/embed.html?',
]

/**
 * Accepts either a bare embed URL or the full `<iframe src="…">` snippet that
 * Google Maps / OpenStreetMap hand out, and returns just the URL.
 */
export const normalizeMapEmbedUrl = (value: string): string => {
  const trimmed = value.trim()
  const match = trimmed.match(/src\s*=\s*["']([^"']+)["']/i)
  const url = (match?.[1] ?? trimmed).replace(/&amp;/g, '&')
  return url
}

export const isAllowedMapEmbedUrl = (value: string | null | undefined): value is string =>
  Boolean(value && ALLOWED_MAP_EMBED_PREFIXES.some((prefix) => value.startsWith(prefix)))
