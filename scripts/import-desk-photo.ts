/**
 * Imports the edited desk photo (see scripts/photos/edit-desk-photo.mjs) as Media
 * `brent-at-work.webp` and puts it where the old warm portrait was: the photo in the
 * homepage "about" block and the about page's hero. Re-encoding strips all metadata.
 *
 *   PHOTO=/tmp/desk-edited.jpg pnpm payload run scripts/import-desk-photo.ts
 */
import fs from 'node:fs'

import { getPayload } from 'payload'
import sharp from 'sharp'

import config from '../src/payload.config'
import { locales } from '../src/lib/locales'

const CONTEXT = { disableRevalidate: true }
const NAME = 'brent-at-work.webp'
const ALT = {
  'nl-BE': 'Brent aan het werk: een schets op de iPad naast code op de laptop',
  en: 'Brent at work: a sketch on the iPad next to code on the laptop',
} as const

const source = process.env.PHOTO
if (!source || !fs.existsSync(source)) {
  console.error('Set PHOTO to the edited desk photo.')
  process.exit(1)
}

const data = await sharp(source)
  .resize({ width: 1600, withoutEnlargement: true })
  .webp({ quality: 86 })
  .toBuffer()
const payload = await getPayload({ config })

const file = { data, mimetype: 'image/webp', name: NAME, size: data.length }
const existing = await payload.find({
  collection: 'media',
  where: { filename: { equals: NAME } },
  limit: 1,
})
// Replace the file in place when it exists, so every reference (SEO images, blocks) keeps
// pointing at the same document.
const media = existing.docs[0]
  ? await payload.update({
      collection: 'media',
      id: existing.docs[0].id,
      locale: 'nl-BE',
      data: { alt: ALT['nl-BE'] },
      file,
      overwriteExistingFiles: true,
      context: CONTEXT,
    })
  : await payload.create({
      collection: 'media',
      locale: 'nl-BE',
      data: { alt: ALT['nl-BE'] },
      file,
      context: CONTEXT,
    })
await payload.update({
  collection: 'media',
  id: media.id,
  locale: 'en',
  data: { alt: ALT.en },
  context: CONTEXT,
})

// Home: the text-and-image block. About: the hero.
for (const locale of locales) {
  for (const [slug, blockType] of [
    [{ 'nl-BE': 'home', en: 'home' }[locale], 'textImage'],
    [{ 'nl-BE': 'over-mij', en: 'about' }[locale], 'hero'],
  ] as const) {
    const { docs } = await payload.find({
      collection: 'pages',
      locale,
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    const page = docs[0]
    if (!page) continue
    const layout = page.layout.map((block) =>
      block.blockType === blockType ? { ...block, image: media.id } : block,
    )
    await payload.update({
      collection: 'pages',
      id: page.id,
      locale,
      data: { layout },
      context: CONTEXT,
      draft: false,
    })
  }
}

console.log(
  `[desk-photo] imported ${NAME} (${Math.round(data.length / 1024)} KB, metadata stripped)`,
)
process.exit(0)
