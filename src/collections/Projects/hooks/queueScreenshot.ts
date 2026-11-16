import type { CollectionAfterChangeHook } from 'payload'

import type { Project } from '@/payload-types'

import { SCREENSHOT_QUEUE } from '@/jobs/captureScreenshots'

/** A new or changed live URL (or a missing screenshot) queues a fresh capture. */
export const queueScreenshot: CollectionAfterChangeHook<Project> = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (req.context.skipScreenshotQueue || req.context.disableRevalidate) return doc
  if (!doc.liveUrl || doc.autoScreenshot === false) return doc
  const changed = doc.liveUrl !== previousDoc?.liveUrl
  const missing = !doc.screenshot
  if (changed || missing || previousDoc?.autoScreenshot === false) {
    await req.payload.jobs.queue({
      task: 'captureScreenshots',
      input: { projectId: String(doc.id) },
      queue: SCREENSHOT_QUEUE,
      req,
    })
  }
  return doc
}
