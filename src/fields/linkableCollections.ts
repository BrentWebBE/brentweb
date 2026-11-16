import type { CollectionSlug } from 'payload'

import { features } from '@/features'

/** Collections that internal links (link field, rich text links, redirects) can point to. */
export const linkableCollections: CollectionSlug[] = [
  'pages',
  ...(features.blog ? ['posts' as const] : []),
]
