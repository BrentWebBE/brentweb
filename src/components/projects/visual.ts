import type { Media, Project, Screenshot } from '@/payload-types'

import type { LiveSiteImage } from './LiveSite'

/**
 * A recapture overwrites the same file name, so the URL carries the capture time: the
 * browser and Next's image cache fetch the new picture instead of serving the old one.
 */
const versioned = (doc: Screenshot) =>
  doc.updatedAt ? `${doc.url}?v=${new Date(doc.updatedAt).getTime()}` : doc.url!

const asLive = (doc: Screenshot | string | null | undefined, alt: string): LiveSiteImage | null =>
  doc && typeof doc === 'object' && doc.url && doc.width && doc.height
    ? { url: versioned(doc), width: doc.width, height: doc.height, alt: doc.alt || alt }
    : null

/** What a project shows: the live captures when there are any, else its uploaded cover. */
export function projectVisual(project: Project) {
  const alt = project.title
  return {
    desktop: asLive(project.screenshot, alt),
    phone: asLive(project.screenshotMobile, alt),
    cover: project.cover && typeof project.cover === 'object' ? (project.cover as Media) : null,
  }
}

export const domainOf = (url: string | null | undefined): string | null => {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}
