import type { Metadata } from 'next/types'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { POSTS_TAG } from '@/utilities/cacheTags'
import { getSiteName } from '@/utilities/getSiteSettings'

import { CollectionArchive } from '../components/CollectionArchive'
import { PageRange } from '../components/PageRange'
import { Pagination } from '../components/Pagination'
import PageClient from './PageClient'

const POSTS_PER_PAGE = 12

const getPostsPage = (pageNumber: number) =>
  unstable_cache(
    async () => {
      const payload = await getPayload({ config: configPromise })
      return payload.find({
        collection: 'posts',
        depth: 1,
        limit: POSTS_PER_PAGE,
        page: pageNumber,
        overrideAccess: false,
        select: {
          title: true,
          slug: true,
          categories: true,
          meta: true,
        },
      })
    },
    ['posts-archive', String(pageNumber)],
    { tags: [POSTS_TAG] },
  )()

export async function PostsArchive({ pageNumber = 1 }: { pageNumber?: number }) {
  if (!Number.isInteger(pageNumber) || pageNumber < 1) notFound()

  const posts = await getPostsPage(pageNumber)

  if (pageNumber > 1 && posts.docs.length === 0) notFound()

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Blog</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={POSTS_PER_PAGE}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function postsArchiveMetadata(pageNumber?: number): Promise<Metadata> {
  const siteName = await getSiteName()
  const suffix = pageNumber && pageNumber > 1 ? ` – pagina ${pageNumber}` : ''
  return {
    title: [`Blog${suffix}`, siteName].filter(Boolean).join(' | '),
  }
}
