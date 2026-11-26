/**
 * Replaces the privacy page text (hero "last updated" line + content rich text) per
 * locale, keeping every block and column id. Run through Payload's Local API:
 *
 *   PRIVACY_DIR=backups/privacy-2026-11-26 [PRIVACY_APPLY=1] payload run scripts/privacy-update.ts
 *
 * The text applied on 2026-11-26 is kept in deploy/privacy/2026-11-26.json (copy it to
 * <dir>/new-content.json). Run it like scripts/seo-backfill.sh does: in the deps-stage
 * tools image on the database network, after a mongodump; then POST /next/revalidate.
 *
 * Reads <dir>/new-content.json ({ [locale]: { intro, richText } }), writes the current
 * layout of each locale to <dir>/before-<locale>.json, and only writes when
 * PRIVACY_APPLY=1 (payload run drops --flags, so env vars are used).
 */
import fs from 'node:fs'
import path from 'node:path'

import config from '@payload-config'
import { getPayload } from 'payload'

type Locale = 'nl-BE' | 'en'
type NewContent = Record<Locale, { intro: string; richText: unknown }>
type Block = { blockType: string; id: string; [key: string]: unknown }

const dir = process.env.PRIVACY_DIR
if (!dir) throw new Error('PRIVACY_DIR is required')
const apply = process.env.PRIVACY_APPLY === '1'
const next = JSON.parse(fs.readFileSync(path.join(dir, 'new-content.json'), 'utf8')) as NewContent

const payload = await getPayload({ config })
const found = await payload.find({
  collection: 'pages',
  where: { slug: { equals: 'privacy' } },
  locale: 'nl-BE',
  depth: 0,
  limit: 2,
})
if (found.docs.length !== 1) throw new Error(`expected 1 privacy page, found ${found.docs.length}`)
const id = found.docs[0].id

for (const locale of Object.keys(next) as Locale[]) {
  const doc = await payload.findByID({ collection: 'pages', id, locale, depth: 0, draft: false })
  const layout = (doc.layout ?? []) as unknown as Block[]
  fs.writeFileSync(path.join(dir, `before-${locale}.json`), JSON.stringify(layout, null, 1))

  const hero = layout.find((b) => b.blockType === 'hero')
  const content = layout.filter((b) => b.blockType === 'content')
  if (!hero || content.length !== 1) throw new Error(`${locale}: unexpected layout shape`)
  const columns = content[0].columns as { richText: unknown }[]
  if (!Array.isArray(columns) || columns.length !== 1)
    throw new Error(`${locale}: expected 1 column`)

  const newLayout = layout.map((b) => {
    if (b === hero) return { ...b, intro: next[locale].intro }
    if (b === content[0])
      return { ...b, columns: [{ ...columns[0], richText: next[locale].richText }] }
    return b
  })

  const oldIntro = String(hero.intro ?? '')
  console.log(`${locale}: intro "${oldIntro}" -> "${next[locale].intro}"; rich text replaced`)
  if (!apply) continue

  await payload.update({
    collection: 'pages',
    id,
    locale,
    depth: 0,
    context: { skipScreenshotQueue: true },
    data: { layout: newLayout, _status: 'published' } as never,
  })
  console.log(`${locale}: updated`)
}

console.log(apply ? 'applied' : 'dry run (set PRIVACY_APPLY=1 to write)')
process.exit(0)
