import { PreviewSearchParams } from '@/app/(frontend)/next/preview/route'
import { PayloadRequest, CollectionSlug } from 'payload'

import { contentLocale } from '@/lib/locales'
import { isLocale } from '@/lib/locale'
import { docHref } from '@/lib/routing'

type Props = {
  collection: CollectionSlug
  slug: string
  req: PayloadRequest
}

/**
 * Preview URL for the document being edited, in the locale the editor has selected,
 * so live preview shows the language being edited.
 */
export const generatePreviewPath = ({ collection, slug, req }: Props) => {
  if (slug === undefined || slug === null) return null

  const locale = isLocale(req?.locale) ? req.locale : contentLocale
  const prefix: Partial<Record<CollectionSlug, string>> = {
    posts: '/posts',
    products: '/shop/product',
  }
  const path =
    collection in prefix
      ? `${prefix[collection]}/${encodeURIComponent(slug)}`
      : (docHref(locale, collection, { slug }) ?? `/${locale}`)

  const encodedParams = new URLSearchParams({
    path,
    previewSecret: process.env.PREVIEW_SECRET || '',
  } satisfies PreviewSearchParams)

  return `/next/preview?${encodedParams.toString()}`
}
