/**
 * Cache tags for the Next.js data cache.
 *
 * The frontend renders on request (see app/(frontend)/layout.tsx); published content is
 * cached with these tags and invalidated by the Payload afterChange/afterDelete hooks.
 */
export const PAGES_TAG = 'pages'
export const pageTag = (slug: string): string => `pages_${slug}`

export const POSTS_TAG = 'posts'
export const postTag = (slug: string): string => `posts_${slug}`

/** Expire immediately, so editors see a published change on their next page load. */
export const EXPIRE_NOW = { expire: 0 } as const
