/**
 * Imports a new portrait and makes it the site's portrait and the homepage photo.
 *
 *   PORTRAIT=~/Downloads/IMG_1070.HEIC pnpm payload run scripts/import-portrait.ts
 *
 * The photo is cropped to 4:5, centred on the face (found automatically), and re-encoded as WebP, which drops
 * every bit of metadata (phone photos carry the GPS position of where they were taken).
 * HEIC is converted with macOS `sips` first, since sharp's prebuilt binaries can't read it.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { getPayload } from 'payload'
import sharp from 'sharp'

import config from '../src/payload.config'
import { locales } from '../src/lib/locales'

const CONTEXT = { disableRevalidate: true }
const source = process.env.PORTRAIT?.replace(/^~/, os.homedir())
if (!source || !fs.existsSync(source)) {
  console.error('Set PORTRAIT to the photo to import.')
  process.exit(1)
}

let input = source
if (/\.hei[cf]$/i.test(source)) {
  input = path.join(os.tmpdir(), `portrait-${Date.now()}.jpg`)
  execFileSync('sips', ['-s', 'format', 'jpeg', source, '--out', input], { stdio: 'ignore' })
}

const image = sharp(input).rotate()
const { width = 0, height = 0 } = await image.metadata()

/**
 * Centre on the person, not the frame: on a downscaled greyscale copy, everything
 * clearly darker than the wall is "subject". The head band (the upper third of the
 * subject) sets the horizontal centre, so the face sits exactly in the middle.
 */
const SAMPLE = 240
const small = await sharp(input)
  .rotate()
  .resize({ width: SAMPLE })
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true })
const { data: px, info } = small
const rows: { y: number; cx: number }[] = []
for (let y = 0; y < info.height; y++) {
  let sum = 0
  let n = 0
  for (let x = 0; x < info.width; x++) {
    if (px[y * info.width + x]! < 150) {
      sum += x
      n++
    }
  }
  if (n > info.width * 0.03) rows.push({ y, cx: sum / n })
}
const firstRow = rows[0]?.y ?? 0
const head = rows.filter((r) => r.y < firstRow + info.height * 0.12)
const centreX = head.length
  ? (head.reduce((a, r) => a + r.cx, 0) / head.length) * (width / info.width)
  : width / 2

// The widest 4:5 frame centred on the face that still fits the photo.
const cropWidth = Math.floor(Math.min(2 * Math.min(centreX, width - centreX), (height * 4) / 5))
const cropHeight = Math.round((cropWidth * 5) / 4)
const left = Math.round(centreX - cropWidth / 2)
// Leave a little wall above the hair.
const top = Math.max(
  0,
  Math.min(height - cropHeight, Math.round(firstRow * (height / info.height) - cropHeight * 0.1)),
)
const data = await image
  .extract({ left, top, width: cropWidth, height: cropHeight })
  .resize({ width: 1600, withoutEnlargement: true })
  .webp({ quality: 86 })
  .toBuffer()
console.log(
  `[portrait] subject centre at x=${Math.round(centreX)} of ${width}; crop ${cropWidth}x${cropHeight} at ${left},${top}`,
)

const payload = await getPayload({ config })
const name = 'brent-portrait.webp'
const existing = await payload.find({
  collection: 'media',
  where: { filename: { equals: name } },
  limit: 1,
})
for (const doc of existing.docs)
  await payload.delete({ collection: 'media', id: doc.id, context: CONTEXT })

const alt = {
  'nl-BE': 'Brent Schoenmakers in een blauwe blazer en wit hemd, tegen een lichte muur',
  en: 'Brent Schoenmakers in a navy blazer and white shirt, against a light wall',
} as const
const media = await payload.create({
  collection: 'media',
  locale: 'nl-BE',
  data: { alt: alt['nl-BE'] },
  file: { data, mimetype: 'image/webp', name, size: data.length },
  context: CONTEXT,
})
await payload.update({
  collection: 'media',
  id: media.id,
  locale: 'en',
  data: { alt: alt.en },
  context: CONTEXT,
})

for (const locale of locales) {
  await payload.updateGlobal({
    slug: 'site-settings',
    locale,
    data: { portrait: media.id },
    context: CONTEXT,
  })
  const { docs } = await payload.find({
    collection: 'pages',
    locale,
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
  })
  const home = docs[0]
  if (!home) continue
  const layout = home.layout.map((block) =>
    block.blockType === 'hero' ? { ...block, image: media.id } : block,
  )
  await payload.update({
    collection: 'pages',
    id: home.id,
    locale,
    data: { layout },
    context: CONTEXT,
    draft: false,
  })
}

console.log(`[portrait] imported ${name} (${Math.round(data.length / 1024)} KB, metadata stripped)`)
process.exit(0)
