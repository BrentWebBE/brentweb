import type { Metadata } from 'next/types'

import { notFound } from 'next/navigation'

import { features } from '@/features'
import { PostsArchive, postsArchiveMetadata } from '@/modules/blog/routes/PostsArchive'

type Args = {
  params: Promise<{
    pageNumber: string
  }>
}

export default async function Page({ params }: Args) {
  if (!features.blog) notFound()
  const { pageNumber } = await params
  return <PostsArchive pageNumber={Number(pageNumber)} />
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  if (!features.blog) return {}
  const { pageNumber } = await params
  return postsArchiveMetadata(Number(pageNumber))
}
