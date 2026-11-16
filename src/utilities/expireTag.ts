import { revalidateTag } from 'next/cache'

import { EXPIRE_NOW } from './cacheTags'

/**
 * revalidateTag, but safe outside a Next request: Payload jobs and scripts run hooks
 * where Next's cache store doesn't exist, and that must not fail the write. There the
 * cache simply expires on its own (or via POST /next/revalidate).
 */
export function expireTag(tag: string, profile: 'max' | typeof EXPIRE_NOW = EXPIRE_NOW): void {
  try {
    revalidateTag(tag, profile)
  } catch {
    // Not inside a Next request context.
  }
}
