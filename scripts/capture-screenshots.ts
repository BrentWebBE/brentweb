/**
 * Refresh the live project screenshots now instead of waiting for the weekly job.
 *
 *   pnpm payload run scripts/capture-screenshots.ts            # every project
 *   CAPTURE_SLUG=carrosserie-kris pnpm payload run scripts/capture-screenshots.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { SCREENSHOT_QUEUE } from '../src/jobs/captureScreenshots'

const payload = await getPayload({ config })
let projectId: string | undefined
if (process.env.CAPTURE_SLUG) {
  const { docs } = await payload.find({
    collection: 'projects',
    where: { slug: { equals: process.env.CAPTURE_SLUG } },
    limit: 1,
    depth: 0,
  })
  projectId = docs[0]?.id
  if (!projectId) throw new Error(`No project with slug ${process.env.CAPTURE_SLUG}`)
}
await payload.jobs.queue({
  task: 'captureScreenshots',
  input: { projectId },
  queue: SCREENSHOT_QUEUE,
})
await payload.jobs.run({ queue: SCREENSHOT_QUEUE })

// Remove screenshots no project points at any more (left behind by failed runs).
const { docs: projects } = await payload.find({
  collection: 'projects',
  depth: 0,
  limit: 200,
  pagination: false,
})
const inUse = new Set(
  projects
    .flatMap((p) => [p.screenshot, p.screenshotMobile])
    .filter(Boolean)
    .map(String),
)
const { docs: shots } = await payload.find({
  collection: 'screenshots',
  depth: 0,
  limit: 500,
  pagination: false,
})
for (const shot of shots) {
  if (!inUse.has(String(shot.id))) await payload.delete({ collection: 'screenshots', id: shot.id })
}
// Earlier attempts stored screenshots in Media; those copies go too.
const { docs: old } = await payload.find({
  collection: 'media',
  where: { filename: { like: 'live-' } },
  depth: 0,
  limit: 500,
  pagination: false,
})
for (const doc of old) {
  if (doc.filename?.startsWith('live-')) await payload.delete({ collection: 'media', id: doc.id })
}
console.log('[screenshots] done')
process.exit(0)
