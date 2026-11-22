import type { CollectionAfterChangeHook } from 'payload'

import { isLocale } from '@/lib/locale'
import { locales, type Locale } from '@/lib/locales'
import { HOME_SLUG, pageHref, projectHref } from '@/lib/routing'

type RoutedCollection = 'pages' | 'projects'

const hrefFor = (collection: RoutedCollection, locale: Locale, slug: string) =>
  collection === 'projects' ? projectHref(locale, slug) : pageHref(locale, slug)

/**
 * When a published page or project gets a new slug, the old URL keeps working: a
 * redirect (308, see PayloadRedirects) from the old path to the new one is created.
 *
 * - Pages have a slug per language, so only the language being saved is affected.
 *   Projects share one slug, so both language URLs get a redirect.
 * - The target is stored as an exact path (type `custom`), not a document reference,
 *   so each language lands on its own URL.
 * - Older redirects that pointed at the old path are moved to the new one (no chains),
 *   and a redirect *from* the new path is removed: renderPage also checks redirects for
 *   pages that exist, so it would bounce visitors away from the live page.
 * - Drafts never create redirects; only a published → published slug change does.
 *   Set `context.skipSlugRedirect` to opt out (imports, migrations).
 */
export const redirectOnSlugChange =
  (collection: RoutedCollection): CollectionAfterChangeHook =>
  async ({ doc, operation, previousDoc, req }) => {
    if (operation !== 'update' || req.context.skipSlugRedirect) return doc
    if (doc?._status !== 'published' || previousDoc?._status !== 'published') return doc

    const oldSlug: unknown = previousDoc.slug
    const newSlug: unknown = doc.slug
    if (typeof oldSlug !== 'string' || typeof newSlug !== 'string') return doc
    if (!oldSlug || !newSlug || oldSlug === newSlug) return doc
    if (oldSlug === HOME_SLUG || newSlug === HOME_SLUG) return doc

    const affected: Locale[] =
      collection === 'pages' ? (isLocale(req.locale) ? [req.locale] : []) : [...locales]

    for (const locale of affected) {
      const from = hrefFor(collection, locale, oldSlug)
      const to = hrefFor(collection, locale, newSlug)
      if (from === to) continue

      const { payload } = req
      const common = { req, overrideAccess: true, depth: 0 } as const

      // 1. Nothing may redirect away from the new, live address.
      await payload.delete({ collection: 'redirects', where: { from: { equals: to } }, ...common })

      // 2. Redirects that ended at the old address now end at the new one.
      await payload.update({
        collection: 'redirects',
        where: { 'to.url': { equals: from } },
        data: { to: { type: 'custom', url: to } },
        ...common,
      })

      // 3. The old address itself.
      const existing = await payload.find({
        collection: 'redirects',
        where: { from: { equals: from } },
        limit: 1,
        ...common,
      })
      const data = { from, to: { type: 'custom' as const, url: to } }
      if (existing.docs[0]) {
        await payload.update({ collection: 'redirects', id: existing.docs[0].id, data, ...common })
      } else {
        await payload.create({ collection: 'redirects', data, ...common })
      }
      payload.logger.info(`Slug changed: redirect ${from} -> ${to}`)
    }

    return doc
  }
