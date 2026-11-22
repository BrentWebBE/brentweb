/**
 * Reverts scripts/seo-backfill.ts: reads <out>/seo-backfill-applied.csv and puts every
 * old value back through the Local API, but only where the field still holds the value
 * the backfill wrote (anything edited by hand since is left alone and reported).
 *
 *   sh scripts/seo-backfill.sh --target production --out backups/<folder> --revert           (dry run)
 *   sh scripts/seo-backfill.sh --target production --out backups/<folder> --revert --apply
 *
 * --apply writes <out>/seo-backfill-reverted.csv.
 */
import fs from 'node:fs'
import path from 'node:path'

import { getPayload } from 'payload'

import config from '../src/payload.config'
import type { Locale } from '../src/lib/locales'

// `payload run` drops --flags, so the wrapper passes options as env vars.
const APPLY = process.env.SEO_APPLY === '1'
const OUT = process.env.SEO_OUT || undefined
const source = OUT ? path.join(OUT, 'seo-backfill-applied.csv') : ''
if (!OUT || !fs.existsSync(source)) {
  console.error(`No ${source || '<out>/seo-backfill-applied.csv'} to revert.`)
  process.exit(1)
}

/** Minimal RFC 4180 parser (quoted cells, doubled quotes, newlines inside quotes). */
function parseCsv(text: string): Record<string, string>[] {
  const records: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n') {
      row.push(cell)
      records.push(row)
      row = []
      cell = ''
    } else cell += c
  }
  if (cell || row.length) {
    row.push(cell)
    records.push(row)
  }
  const [head, ...body] = records
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
}

/** Text and relation ids as the CSV stores them (missing = empty string). */
const same = (a: unknown, b: string) => String(a ?? '') === b
const strip = (list: unknown) =>
  JSON.stringify(
    ((list as { kind: string; name: string }[] | null) ?? []).map(({ kind, name }) => ({
      kind,
      name,
    })),
  )

const payload = await getPayload({ config })
const CONTEXT = { skipScreenshotQueue: true }
const report: string[] = []
const rows = parseCsv(fs.readFileSync(source, 'utf8'))

for (const r of rows) {
  const locale = r.locale as Locale
  const label = `${r.collection}/${r.slug || r.id} [${r.locale}] ${r.field}`
  let status = ''
  if (r.collection === 'pages' || r.collection === 'projects') {
    const collection = r.collection
    const doc = await payload.findByID({
      collection,
      id: r.id,
      locale: r.locale === '-' ? 'nl-BE' : locale,
      depth: 0,
      draft: false,
    })
    if (r.field.startsWith('meta.')) {
      const key = r.field.slice(5)
      const meta = (doc.meta ?? {}) as Record<string, unknown>
      if (!same(meta[key], r.new)) status = 'SKIP (edited since the backfill)'
      else {
        status = 'REVERT'
        if (APPLY)
          await payload.update({
            collection,
            id: r.id,
            locale,
            depth: 0,
            context: CONTEXT,
            data: { meta: { ...meta, [key]: r.old || null }, _status: 'published' } as never,
          })
      }
    } else if (r.field === 'structuredData.areaServed') {
      const sd = (doc as { structuredData?: Record<string, unknown> }).structuredData ?? {}
      if (strip(sd.areaServed) !== r.new) status = 'SKIP (edited since the backfill)'
      else {
        status = 'REVERT'
        if (APPLY)
          await payload.update({
            collection,
            id: r.id,
            locale: 'nl-BE',
            depth: 0,
            context: CONTEXT,
            data: {
              structuredData: { ...sd, areaServed: JSON.parse(r.old) },
              _status: 'published',
            } as never,
          })
      }
    }
  } else if (r.collection === 'globals/site-settings') {
    const key = r.field.replace('technical.', '')
    const settings = await payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
      locale: r.locale === '-' ? 'nl-BE' : locale,
    })
    const current = (settings.technical as Record<string, unknown> | undefined)?.[key]
    const matches = key === 'areaServed' ? strip(current) === r.new : same(current, r.new)
    if (!matches) status = 'SKIP (edited since the backfill)'
    else {
      status = 'REVERT'
      const old = key === 'areaServed' ? JSON.parse(r.old || '[]') : r.old || null
      if (APPLY)
        await payload.updateGlobal({
          slug: 'site-settings',
          depth: 0,
          ...(r.locale === '-' ? {} : { locale }),
          data: { technical: { [key]: old } } as never,
        })
    }
  }
  report.push(`${status || 'SKIP (unknown field)'}\t${label}`)
}

console.log(`\n${APPLY ? 'REVERTED' : 'REVERT DRY RUN'}: ${rows.length} rows\n${report.join('\n')}`)
if (APPLY)
  fs.writeFileSync(
    path.join(OUT, 'seo-backfill-reverted.csv'),
    ['status\tfield', ...report].join('\n') + '\n',
    { mode: 0o600 },
  )
process.exit(0)
