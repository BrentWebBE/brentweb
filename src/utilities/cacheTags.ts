/**
 * Cache tags for the Next.js data cache.
 *
 * The frontend renders on request (see app/(frontend)/layout.tsx); published content is
 * cached with these tags and invalidated by the Payload afterChange/afterDelete hooks.
 * Pages and projects are cached per locale but invalidated per document (a save can
 * change either language), so the tags carry the slug without the locale.
 */
export const PAGES_TAG = 'pages'
export const pageTag = (slug: string): string => `pages_${slug}`

export const PROJECTS_TAG = 'projects'
export const projectTag = (slug: string): string => `projects_${slug}`

export const TESTIMONIALS_TAG = 'testimonials'

export const POSTS_TAG = 'posts'
export const postTag = (slug: string): string => `posts_${slug}`

/** Expire immediately, so editors see a published change on their next page load. */
export const EXPIRE_NOW = { expire: 0 } as const
