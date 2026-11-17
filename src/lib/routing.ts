import type { Locale } from '@/lib/locales'

/**
 * Every internal URL is built here, so the URL scheme lives in one file.
 *
 *   /{locale}                       home (the page with slug `home`)
 *   /{locale}/{slug}                any other page (slug is localized in Payload)
 *   /{locale}/{projects}/{slug}     a project (projecten / work)
 *
 * The projects index is an ordinary page whose slug equals the projects segment, so
 * its intro stays editable.
 */
export const HOME_SLUG = 'home'

export const PROJECTS_SEGMENT: Record<Locale, string> = {
  'nl-BE': 'projecten',
  en: 'work',
}

export const isProjectsSegment = (locale: Locale, segment: string): boolean =>
  PROJECTS_SEGMENT[locale] === segment

export const homeHref = (locale: Locale): string => `/${locale}`

export const pageHref = (locale: Locale, slug: string | null | undefined): string =>
  !slug || slug === HOME_SLUG ? homeHref(locale) : `/${locale}/${slug}`

export const projectsHref = (locale: Locale): string => `/${locale}/${PROJECTS_SEGMENT[locale]}`

export const projectHref = (locale: Locale, slug: string): string =>
  `${projectsHref(locale)}/${slug}`

type LinkableDoc = { slug?: string | null } | string | number | null | undefined

/** Href for a relationship value (link fields, rich-text links). Null when unpopulated. */
export function docHref(locale: Locale, relationTo: string, doc: LinkableDoc): string | null {
  if (!doc || typeof doc !== 'object' || !doc.slug) return null
  if (relationTo === 'projects') return projectHref(locale, doc.slug)
  if (relationTo === 'pages') return pageHref(locale, doc.slug)
  return `/${relationTo}/${doc.slug}`
}

/**
 * Pages the code links to by role rather than through a Payload relationship. The pages
 * themselves are ordinary Payload pages with these slugs (created by the migration).
 */
export const SYSTEM_SLUGS = {
  thankYou: { 'nl-BE': 'bedankt', en: 'thank-you' },
  thankYouWebsiteCheck: { 'nl-BE': 'bedankt-websitecheck', en: 'thank-you-website-check' },
  websiteCheck: { 'nl-BE': 'gratis-websitecheck', en: 'free-website-check' },
  pricing: { 'nl-BE': 'prijzen', en: 'pricing' },
  privacy: { 'nl-BE': 'privacy', en: 'privacy' },
  about: { 'nl-BE': 'over-mij', en: 'about' },
} as const satisfies Record<string, Record<Locale, string>>

export type SystemPage = keyof typeof SYSTEM_SLUGS

export const systemHref = (locale: Locale, page: SystemPage): string =>
  pageHref(locale, SYSTEM_SLUGS[page][locale])

/** Query parameter the website-check banner uses to hand the typed URL to the form. */
export const WEBSITE_CHECK_URL_PARAM = 'url'

/** Query parameter that prefills the contact form's message with a pain point. */
export const CONTACT_PREFILL_PARAM = 'probleem'
