import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { features } from '@/features'
import { PostDetail, postMetadata, type PostRouteArgs } from '@/modules/blog/routes/PostDetail'

export default async function Page(args: PostRouteArgs) {
  if (!features.blog) notFound()
  return <PostDetail {...args} />
}

export async function generateMetadata(args: PostRouteArgs): Promise<Metadata> {
  if (!features.blog) return {}
  return postMetadata(args)
}
