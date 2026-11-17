import type { Metadata } from 'next'

import { pageMetadataFor, renderPage, resolveLocale } from './renderPage'

type Args = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Args) {
  const { locale } = await params
  return renderPage(resolveLocale(locale))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { locale } = await params
  return pageMetadataFor(resolveLocale(locale))
}
