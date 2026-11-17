import type { Metadata } from 'next'

import { pageMetadataFor, renderPage, resolveLocale } from '../renderPage'

type Args = { params: Promise<{ locale: string; slug: string }> }

export default async function SlugPage({ params }: Args) {
  const { locale, slug } = await params
  return renderPage(resolveLocale(locale), slug)
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale, slug } = await params
  return pageMetadataFor(resolveLocale(locale), slug)
}
