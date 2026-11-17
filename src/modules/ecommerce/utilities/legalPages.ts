import type { Payload } from 'payload'

import type { Page, SiteSetting } from '@/payload-types'

export const LEGAL_PAGES = [
  { key: 'termsPage', label: 'algemene voorwaarden' },
  { key: 'privacyPage', label: 'privacybeleid' },
  { key: 'withdrawalPage', label: 'herroepingsrecht' },
] as const

export type LegalPageKey = (typeof LEGAL_PAGES)[number]['key']
export type LegalLinks = Record<LegalPageKey, string>

type LegalPagesValue = Partial<Record<LegalPageKey, string | Page | null>>

const getLegalPagesValue = (settings: SiteSetting | null | undefined): LegalPagesValue =>
  ((settings as SiteSetting & { legalPages?: LegalPagesValue })?.legalPages ??
    {}) as LegalPagesValue

const isPublishedPage = (value: unknown): value is Page =>
  Boolean(
    value &&
    typeof value === 'object' &&
    (value as Page).slug &&
    (value as Page)._status === 'published',
  )

/** Public URLs of the legal pages, or null when one is missing / not published. */
export const resolveLegalLinks = (settings: SiteSetting | null | undefined): LegalLinks | null => {
  const value = getLegalPagesValue(settings)
  const links: Partial<LegalLinks> = {}
  for (const { key } of LEGAL_PAGES) {
    const page = value[key]
    if (!isPublishedPage(page)) return null
    links[key] = page.slug === 'home' ? '/' : `/${page.slug}`
  }
  return links as LegalLinks
}

/** Labels of the legal pages that are missing or unpublished (empty = checkout allowed). */
export const getMissingLegalPages = async (payload: Payload): Promise<string[]> => {
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    depth: 1,
    overrideAccess: true,
  })
  const value = getLegalPagesValue(settings)
  return LEGAL_PAGES.filter(({ key }) => !isPublishedPage(value[key])).map(({ label }) => label)
}
