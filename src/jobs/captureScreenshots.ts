import type { TaskConfig } from 'payload'

import type { Project } from '@/payload-types'

import { captureSite, type Device } from '@/lib/screenshots/capture'
import { getServerSideURL } from '@/utilities/getURL'

/** Asks the running site to expire its content cache (see /next/revalidate). */
async function expireSiteCache() {
  const secret = process.env.CRON_SECRET
  if (!secret) return
  try {
    await fetch(`${getServerSideURL()}/next/revalidate`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}` },
    })
  } catch {
    // No site running (a one-off script): its cache starts cold anyway.
  }
}

export const SCREENSHOT_QUEUE = 'screenshots'

/**
 * Refreshes the live screenshots of one project (input.projectId) or of every project
 * with a live URL and auto screenshots on. Scheduled weekly; also queued by the
 * Projects hook when a live URL is added or changed.
 */
export const captureScreenshotsTask: TaskConfig<'captureScreenshots'> = {
  slug: 'captureScreenshots',
  label: 'Capture project screenshots',
  inputSchema: [{ name: 'projectId', type: 'text' }],
  outputSchema: [{ name: 'captured', type: 'number' }],
  retries: 1,
  schedule: [{ cron: '0 0 4 * * 1', queue: SCREENSHOT_QUEUE }],
  handler: async ({ input, req }) => {
    const { payload } = req
    const { docs } = await payload.find({
      collection: 'projects',
      depth: 0,
      limit: 100,
      pagination: false,
      where: {
        and: [
          { liveUrl: { exists: true } },
          { autoScreenshot: { not_equals: false } },
          ...(input?.projectId ? [{ id: { equals: input.projectId } }] : []),
        ],
      },
    })

    let captured = 0
    for (const project of docs as Project[]) {
      if (!project.liveUrl) continue
      try {
        const shots = await captureSite(project.liveUrl)
        const ids: Partial<Record<Device, string>> = {}
        for (const device of Object.keys(shots) as Device[]) {
          const { data } = shots[device]
          const name = `live-${project.slug}-${device}.webp`
          const file = { data, mimetype: 'image/webp', name, size: data.length }
          const alt = `${project.title}: ${device === 'desktop' ? 'de website' : 'de website op een gsm'}`
          const existing = project[device === 'desktop' ? 'screenshot' : 'screenshotMobile']
          const referenced = typeof existing === 'object' ? existing?.id : existing
          // Only reuse the document if it still exists in this collection.
          const existingId = referenced
            ? (
                await payload.findByID({
                  collection: 'screenshots',
                  id: referenced,
                  disableErrors: true,
                  depth: 0,
                  req,
                })
              )?.id
            : undefined
          const media = existingId
            ? await payload.update({
                collection: 'screenshots',
                id: existingId,
                data: { alt },
                file,
                req,
                overwriteExistingFiles: true,
              })
            : await payload.create({ collection: 'screenshots', data: { alt }, file, req })
          ids[device] = media.id
        }
        await payload.update({
          collection: 'projects',
          id: project.id,
          data: {
            screenshot: ids.desktop,
            screenshotMobile: ids.mobile,
            screenshotAt: new Date().toISOString(),
          },
          // Revalidation goes through the HTTP endpoint below: a job runs outside a
          // Next request, where revalidateTag throws.
          context: { skipScreenshotQueue: true, disableRevalidate: true },
          req,
        })
        captured++
        payload.logger.info(`Captured live screenshots of ${project.liveUrl}`)
      } catch (err) {
        payload.logger.error({ err }, `Screenshot of ${project.liveUrl} failed`)
      }
    }
    if (captured > 0) await expireSiteCache()
    return { output: { captured } }
  },
}
