import type { Metadata } from 'next/types'

import { notFound } from 'next/navigation'

import { features } from '@/features'
import { PostsArchive, postsArchiveMetadata } from '@/modules/blog/routes/PostsArchive'

export default async function Page() {
  if (!features.blog) notFound()
  return <PostsArchive />
}

export async function generateMetadata(): Promise<Metadata> {
  if (!features.blog) return {}
  return postsArchiveMetadata()
}
