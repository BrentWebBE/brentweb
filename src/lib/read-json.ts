/** Largest JSON body the API routes accept; a real estimator payload is a few KB. */
export const MAX_JSON_BYTES = 64 * 1024

/**
 * request.json() buffers whatever arrives, however large. This stops reading
 * past `maxBytes` (whether or not Content-Length was sent) and returns null
 * for oversized or malformed bodies, which callers treat as a 400.
 */
export async function readJson(request: Request, maxBytes = MAX_JSON_BYTES): Promise<unknown> {
  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) return null
  if (!request.body) return null

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return null
  }
}
