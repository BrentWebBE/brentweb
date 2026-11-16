import type { Metadata } from 'next/types'

import { notFound } from 'next/navigation'

import { features } from '@/features'
import { SearchPage, searchMetadata, type SearchRouteArgs } from '@/modules/blog/routes/SearchPage'

export default async function Page(args: SearchRouteArgs) {
  if (!features.blog) notFound()
  return <SearchPage {...args} />
}

export async function generateMetadata(): Promise<Metadata> {
  if (!features.blog) return {}
  return searchMetadata()
}
