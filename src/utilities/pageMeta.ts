import type { Metadata } from 'next'

import type { Media, Page, Project } from '@/payload-types'

import { plainText } from '@/components/handmade/Marked'
import type { Locale } from '@/lib/locales'
import { fillPrices } from '@/lib/prices'
import type { Alternates } from '@/utilities/queries'

import { getServerSideURL } from './getURL'
import { getSiteSettings } from './getSiteSettings'
import { mergeOpenGraph } from './mergeOpenGraph'

const imageUrl = (image: Media | string | null | undefined): string | undefined => {
  if (!image || typeof image !== 'object') return undefined
  const url = image.sizes?.og?.url || image.url
  return url ? `${getServerSideURL()}${url}` : undefined
}

/**
 * Metadata for a page or project: SEO tab first, then the document's own title,
 * prices filled in, canonical and hreflang alternates (x-default = Dutch).
 */
export async function pageMetadata({
  alternates,
  description,
  doc,
  locale,
  path,
}: {
  alternates: Alternates
  description?: string | null
  doc: Pick<Page, 'meta' | 'title'> | Pick<Project, 'meta' | 'title'>
  locale: Locale
  path: string
}): Promise<Metadata> {
  const settings = await getSiteSettings(locale)
  const siteName = settings?.personName || settings?.businessName || ''
  const rawTitle = doc.meta?.title || [plainText(doc.title), siteName].filter(Boolean).join(' | ')
  const title = fillPrices(rawTitle, locale)
  const desc = fillPrices(doc.meta?.description || description || '', locale) || undefined
  const image = imageUrl(doc.meta?.image as Media | undefined)
  const noIndex = Boolean((doc.meta as { noIndex?: boolean | null } | undefined)?.noIndex)

  const languages: Record<string, string> = { ...alternates } as Record<string, string>
  if (alternates['nl-BE']) languages['x-default'] = alternates['nl-BE']

  return {
    title: { absolute: title },
    description: desc,
    alternates: noIndex ? undefined : { canonical: path, languages },
    robots: noIndex ? { index: false, follow: true } : undefined,
    openGraph: mergeOpenGraph({
      title,
      description: desc,
      url: path,
      siteName,
      locale: locale === 'nl-BE' ? 'nl_BE' : 'en_GB',
      images: image ? [{ url: image }] : undefined,
    }),
  }
}
