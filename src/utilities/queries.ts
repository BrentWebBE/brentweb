import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import { draftMode } from 'next/headers'
import { cache } from 'react'

import type { Page, Project, Testimonial } from '@/payload-types'

import { locales, type Locale } from '@/lib/locales'
import { isLocale, splitLocalePath } from '@/lib/locale'
import { HOME_SLUG, isProjectsSegment, pageHref, projectHref } from '@/lib/routing'
import {
  PAGES_TAG,
  PROJECTS_TAG,
  TESTIMONIALS_TAG,
  pageTag,
  projectTag,
} from '@/utilities/cacheTags'

/**
 * Every frontend read goes through here. Published content is cached per locale in the
 * Next data cache and expired by the collection hooks; drafts (preview) are always
 * read fresh.
 */
const payload = () => getPayload({ config: configPromise })

async function findPage(locale: Locale, slug: string, draft: boolean): Promise<Page | null> {
  const result = await (
    await payload()
  ).find({
    collection: 'pages',
    draft,
    locale,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: { slug: { equals: slug } },
  })
  return result.docs[0] ?? null
}

export const getPage = cache(async (locale: Locale, slug: string = HOME_SLUG) => {
  const { isEnabled: draft } = await draftMode()
  if (draft) return findPage(locale, slug, true)
  const cached = await unstable_cache(() => findPage(locale, slug, false), ['page', locale, slug], {
    tags: [PAGES_TAG, pageTag(slug)],
  })()
  // A miss is cached too; look again so a page created outside the admin (a migration,
  // a restored backup) shows up without waiting for the next save to expire the tag.
  return cached ?? findPage(locale, slug, false)
})

async function findProject(locale: Locale, slug: string, draft: boolean): Promise<Project | null> {
  const result = await (
    await payload()
  ).find({
    collection: 'projects',
    draft,
    locale,
    depth: 2,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: { slug: { equals: slug } },
  })
  return result.docs[0] ?? null
}

export const getProject = cache(async (locale: Locale, slug: string) => {
  const { isEnabled: draft } = await draftMode()
  if (draft) return findProject(locale, slug, true)
  const cached = await unstable_cache(
    () => findProject(locale, slug, false),
    ['project', locale, slug],
    { tags: [PROJECTS_TAG, projectTag(slug)] },
  )()
  return cached ?? findProject(locale, slug, false)
})

/** All published projects, in their editorial order. */
export const getProjects = cache((locale: Locale) =>
  unstable_cache(
    async (): Promise<Project[]> => {
      const result = await (
        await payload()
      ).find({
        collection: 'projects',
        locale,
        depth: 1,
        limit: 100,
        pagination: false,
        sort: 'order',
        where: { _status: { equals: 'published' } },
      })
      return result.docs
    },
    ['projects', locale],
    { tags: [PROJECTS_TAG] },
  )(),
)

export const getTestimonials = cache((locale: Locale) =>
  unstable_cache(
    async (): Promise<Testimonial[]> => {
      const result = await (
        await payload()
      ).find({
        collection: 'testimonials',
        locale,
        depth: 1,
        limit: 50,
        pagination: false,
        where: { visible: { equals: true } },
      })
      return result.docs
    },
    ['testimonials', locale],
    { tags: [TESTIMONIALS_TAG, PROJECTS_TAG] },
  )(),
)

export type Alternates = Partial<Record<Locale, string>>

/** The slug of a document in every locale (localized slug fields come back as a map). */
async function slugsById(collection: 'pages' | 'projects', id: string) {
  const doc = await (
    await payload()
  ).findByID({
    collection,
    id,
    locale: 'all',
    depth: 0,
    select: { slug: true },
  })
  const slug = doc?.slug as unknown
  if (typeof slug === 'string') return Object.fromEntries(locales.map((l) => [l, slug]))
  return (slug ?? {}) as Partial<Record<Locale, string>>
}

/**
 * The same page in every locale, for hreflang and the language switcher. Built from
 * the requested path so the root layout can call it without knowing the route.
 */
export const getAlternates = cache(async (pathname: string): Promise<Alternates> => {
  const { locale, rest } = splitLocalePath(pathname)
  if (!locale) return {}
  const [first, second] = rest.split('/').filter(Boolean)

  return unstable_cache(
    async (): Promise<Alternates> => {
      if (!first) return Object.fromEntries(locales.map((l) => [l, pageHref(l, HOME_SLUG)]))

      if (second && isProjectsSegment(locale, first)) {
        const project = await findProject(locale, second, false)
        if (!project) return {}
        return Object.fromEntries(locales.map((l) => [l, projectHref(l, project.slug)]))
      }

      if (second) return {}
      const page = await findPage(locale, first, false)
      if (!page) return {}
      const slugs = await slugsById('pages', page.id)
      return Object.fromEntries(
        locales.filter((l) => slugs[l]).map((l) => [l, pageHref(l, slugs[l])]),
      )
    },
    ['alternates', pathname],
    { tags: [PAGES_TAG, PROJECTS_TAG] },
  )()
})

/** Locale for server components outside a [locale] route (layout, not-found). */
export const localeFromPath = (pathname: string | null): Locale | null => {
  const first = pathname?.split('/').filter(Boolean)[0]
  return isLocale(first) ? first : null
}
