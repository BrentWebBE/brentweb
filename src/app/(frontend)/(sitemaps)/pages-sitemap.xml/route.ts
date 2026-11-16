import { getServerSideSitemap, type ISitemapField } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

import { features } from '@/features'
import { locales, type Locale } from '@/lib/locales'
import { pageHref, projectHref } from '@/lib/routing'
import { getServerSideURL } from '@/utilities/getURL'

type Localized<T> = Partial<Record<Locale, T>>

/**
 * Every published page and project, once per language, each with hreflang links to its
 * translations. Pages marked noindex (thank-you pages) are left out.
 */
const getPagesSitemap = unstable_cache(
  async (): Promise<ISitemapField[]> => {
    const payload = await getPayload({ config })
    const SITE_URL = getServerSideURL()
    const published = { _status: { equals: 'published' } } as const

    const [pages, projects] = await Promise.all([
      payload.find({
        collection: 'pages',
        locale: 'all',
        overrideAccess: false,
        draft: false,
        depth: 0,
        limit: 1000,
        pagination: false,
        where: published,
        select: { slug: true, updatedAt: true, meta: true },
      }),
      payload.find({
        collection: 'projects',
        locale: 'all',
        overrideAccess: false,
        draft: false,
        depth: 0,
        limit: 1000,
        pagination: false,
        where: published,
        select: { slug: true, updatedAt: true },
      }),
    ])

    const entries = (hrefs: Localized<string>, lastmod: string): ISitemapField[] => {
      const alternateRefs = (Object.entries(hrefs) as [Locale, string][]).map(([l, href]) => ({
        href: `${SITE_URL}${href}`,
        hreflang: l,
        hrefIsAbsolute: true,
      }))
      return (Object.values(hrefs) as string[]).map((href) => ({
        loc: `${SITE_URL}${href}`,
        lastmod,
        alternateRefs,
      }))
    }

    const pageEntries = pages.docs.flatMap((page) => {
      const slugs = page.slug as unknown as Localized<string>
      const meta = (page.meta ?? {}) as unknown as Localized<{ noIndex?: boolean | null }>
      const hrefs: Localized<string> = {}
      for (const l of locales) {
        if (slugs?.[l] && !meta[l]?.noIndex) hrefs[l] = pageHref(l, slugs[l])
      }
      return entries(hrefs, page.updatedAt)
    })

    const projectEntries = projects.docs.flatMap((project) => {
      const hrefs: Localized<string> = {}
      for (const l of locales) hrefs[l] = projectHref(l, project.slug)
      return entries(hrefs, project.updatedAt)
    })

    const blog = features.blog
      ? [{ loc: `${SITE_URL}/posts`, lastmod: new Date().toISOString() }]
      : []
    return [...blog, ...pageEntries, ...projectEntries]
  },
  ['pages-sitemap'],
  { tags: ['pages-sitemap'] },
)

export async function GET() {
  return getServerSideSitemap(await getPagesSitemap())
}
