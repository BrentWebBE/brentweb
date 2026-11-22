/**
 * SEO backfill: fills empty meta and site-settings fields and fixes over-length meta,
 * through Payload's Local API (hooks, validation and versions all run).
 *
 * Never overwrites human-written text that is fine: every proposal below names the
 * value it expects to replace, and is only applied when the current value is still
 * exactly that AND is empty or invalid (rendered title > 60 / description > 160).
 * Array/relation proposals (areaServed, default share image) are listed separately and
 * were approved one by one.
 *
 * Run through scripts/seo-backfill.sh, which picks the database, takes a fresh
 * mongodump before --apply and expires the site's caches afterwards:
 *
 *   sh scripts/seo-backfill.sh --target scratch|production --out backups/<folder> [--apply]
 *
 * Output: <out>/seo-backfill-preview.csv (dry run) or <out>/seo-backfill-applied.csv
 * (--apply, one row per changed field, input for seo-backfill-revert.ts).
 */
import fs from 'node:fs'
import path from 'node:path'

import { getPayload, type Payload } from 'payload'

import config from '../src/payload.config'
import type { Locale } from '../src/lib/locales'
import { fillPrices } from '../src/lib/prices'

const TITLE_MAX = 60
const DESCRIPTION_MAX = 160

/* ── args ─────────────────────────────────────────────────────────────── */
// `payload run` drops --flags, so the wrapper passes options as env vars.
const APPLY = process.env.SEO_APPLY === '1'
const OUT = process.env.SEO_OUT || undefined
const TARGET = process.env.SEO_TARGET || 'unknown'
if (!OUT || !fs.existsSync(OUT)) {
  console.error('Set SEO_OUT to an existing backup folder (the wrapper does this from --out).')
  process.exit(1)
}

/* ── proposals ────────────────────────────────────────────────────────── */
type MetaField = 'title' | 'description'
type MetaProposal = {
  collection: 'pages' | 'projects'
  slug: string // slug as stored (projects: shared; pages: per locale)
  locale: Locale
  field: MetaField
  expect: string | null // current value seen in the audit; null = must be empty
  value: string
}

/** Projects: all titles were 65-87 characters, several descriptions 164-194. */
const META: MetaProposal[] = [
  // Carrosserie Kris
  {
    collection: 'projects',
    slug: 'carrosserie-kris',
    locale: 'nl-BE',
    field: 'title',
    expect: 'Carrosserie Kris: de website die ik sinds 2021 bouw en onderhoud | BrentWeb',
    value: 'Website voor Carrosserie Kris in Grobbendonk | BrentWeb',
  },
  {
    collection: 'projects',
    slug: 'carrosserie-kris',
    locale: 'nl-BE',
    field: 'description',
    expect:
      'Sinds 2021 is de website van deze carrosserie in Grobbendonk het belangrijkste kanaal voor nieuwe aanvragen. Ze wordt doorlopend verbeterd in plaats van om de paar jaar volledig herbouwd.',
    value:
      'Sinds 2021 bouw en onderhoud ik de website van deze carrosserie in Grobbendonk: snel, vindbaar in Google en het belangrijkste kanaal voor nieuwe aanvragen.',
  },
  {
    collection: 'projects',
    slug: 'carrosserie-kris',
    locale: 'en',
    field: 'title',
    expect: 'Carrosserie Kris: a partnership since 2021, not a one-off build | BrentWeb',
    value: 'Website for Carrosserie Kris in Grobbendonk | BrentWeb',
  },
  // Banden Leusch
  {
    collection: 'projects',
    slug: 'banden-leusch',
    locale: 'nl-BE',
    field: 'title',
    expect:
      'Banden Leusch: logo, website en sociale media voor een garage in Grobbendonk | BrentWeb',
    value: 'Logo en website voor Banden Leusch, Grobbendonk | BrentWeb',
  },
  {
    collection: 'projects',
    slug: 'banden-leusch',
    locale: 'nl-BE',
    field: 'description',
    expect:
      'Banden Leusch groeide sinds 2002 uit van bandencentrale tot full-service garage. Ik maakte een nieuw logo, een nieuwe website en sociale media in dezelfde stijl, en ik host en onderhoud de site.',
    value:
      'Nieuw logo, website en sociale media voor Banden Leusch, garage en bandencentrale in Grobbendonk. Ik host en onderhoud de site sinds de lancering in 2026.',
  },
  {
    collection: 'projects',
    slug: 'banden-leusch',
    locale: 'en',
    field: 'title',
    expect: 'Banden Leusch: logo, website and social media for a garage in Grobbendonk | BrentWeb',
    value: 'Logo and website for Banden Leusch, Grobbendonk | BrentWeb',
  },
  {
    collection: 'projects',
    slug: 'banden-leusch',
    locale: 'en',
    field: 'description',
    expect:
      'Since 2002 Banden Leusch has grown from a tyre centre into a full-service garage. I made a new logo, a new website and social media in the same style, and I host and maintain the site.',
    value:
      'New logo, website and social media for Banden Leusch, a garage and tyre centre in Grobbendonk. I have hosted and maintained the site since its 2026 launch.',
  },
  // IDPS
  {
    collection: 'projects',
    slug: 'idps',
    locale: 'nl-BE',
    field: 'title',
    expect: 'Netwerkbeveiliging op bedrijfsniveau, op een Raspberry Pi | BrentWeb',
    value: 'Schoolnetwerk beveiligd met een Raspberry Pi | BrentWeb',
  },
  {
    collection: 'projects',
    slug: 'idps',
    locale: 'en',
    field: 'title',
    expect: 'Enterprise-grade network protection, on a Raspberry Pi | BrentWeb',
    value: 'School network security on a Raspberry Pi | BrentWeb',
  },
  // Provilion Broodjes
  {
    collection: 'projects',
    slug: 'provilion-broodjes',
    locale: 'nl-BE',
    field: 'title',
    expect: 'Provilion Broodjes: een bestelplatform om cash en Excel te vervangen | BrentWeb',
    value: 'Provilion Broodjes: bestelplatform voor school | BrentWeb',
  },
  {
    collection: 'projects',
    slug: 'provilion-broodjes',
    locale: 'nl-BE',
    field: 'description',
    expect:
      'Een bestelsysteem voor schoolmaaltijden, gebouwd om manuele kasverwerking te vervangen door een selfservice-platform. Volledig gebouwd, maar nooit in gebruik genomen.',
    value:
      'Bestelplatform voor broodjes op school, gebouwd om cash en Excel te vervangen door selfservice met online tegoed. Volledig gebouwd, nooit in gebruik genomen.',
  },
  {
    collection: 'projects',
    slug: 'provilion-broodjes',
    locale: 'en',
    field: 'title',
    expect: 'Provilion Broodjes: an ordering platform to replace cash and Excel | BrentWeb',
    value: 'Provilion Broodjes: school lunch ordering | BrentWeb',
  },
  // Het Smaakpand
  {
    collection: 'projects',
    slug: 'het-smaakpand',
    locale: 'nl-BE',
    field: 'title',
    expect: 'Het Smaakpand: één snelle pagina voor een broodjeszaak in Olen | BrentWeb',
    value: 'Website voor broodjeszaak Het Smaakpand in Olen | BrentWeb',
  },
  {
    collection: 'projects',
    slug: 'het-smaakpand',
    locale: 'nl-BE',
    field: 'description',
    expect:
      'Een kleine broodjeszaak in Olen wilde dat klanten op hun gsm het menu en de openingsuren vonden, zonder beheersysteem of maandelijkse kosten. Toen de zaak sloot, ging de site uit dienst.',
    value:
      'Eén snelle pagina met menu en openingsuren voor een broodjeszaak in Olen, zonder beheersysteem of maandkosten. Toen de zaak sloot, ging de site uit dienst.',
  },
  {
    collection: 'projects',
    slug: 'het-smaakpand',
    locale: 'en',
    field: 'title',
    expect: 'Het Smaakpand: online fast and affordably, retired cleanly | BrentWeb',
    value: 'Website for sandwich shop Het Smaakpand, Olen | BrentWeb',
  },
  {
    collection: 'projects',
    slug: 'het-smaakpand',
    locale: 'en',
    field: 'description',
    expect:
      'A small sandwich shop needed to be findable online without taking on ongoing complexity or cost, and when the business closed, the site was retired just as cleanly.',
    value:
      'One fast page with the menu and opening hours for a sandwich shop in Olen, with no CMS or monthly costs. When the shop closed, the site was retired cleanly.',
  },
]

/** site-settings (new fields, empty until now). */
const SETTINGS_TEXT: { locale: Locale; field: 'defaultMetaDescription'; value: string }[] = [
  {
    locale: 'nl-BE',
    field: 'defaultMetaDescription',
    value:
      "BrentWeb bouwt websites, webapplicaties en koppelingen voor kmo's in Geel, Herentals, Mol en de Kempen. Vaste prijs vooraf, rechtstreeks met de ontwikkelaar.",
  },
  {
    locale: 'en',
    field: 'defaultMetaDescription',
    value:
      'BrentWeb builds websites, web apps and integrations for small businesses in Geel and the Kempen, Belgium. Fixed price up front, straight from the developer.',
  },
]
const AREA_SERVED = [
  { kind: 'AdministrativeArea', name: 'Kempen' },
  { kind: 'City', name: 'Geel' },
  { kind: 'City', name: 'Herentals' },
  { kind: 'City', name: 'Grobbendonk' },
  { kind: 'City', name: 'Mol' },
  { kind: 'City', name: 'Blankenberge' },
] as const
/** The 1200×630-cropped portrait the homepage already uses as its share image. */
const DEFAULT_OG_IMAGE_FILENAME = 'brent-portrait.webp'

/** Kempen landing page: add the target towns to its own areaServed (keeps Geel + Kempen). */
const KEMPEN_PAGE_SLUG = 'website-laten-maken-geel-kempen' // nl-BE slug
const KEMPEN_ADD = ['Herentals', 'Grobbendonk', 'Mol']

/* ── helpers ──────────────────────────────────────────────────────────── */
type Row = {
  target: string
  collection: string
  id: string
  slug: string
  locale: string
  field: string
  old: string
  new: string
  oldLen: string
  newLen: string
  action: 'update' | 'skip' | 'unchanged'
  reason: string
}
const rows: Row[] = []
const rendered = (s: string | null | undefined, locale: Locale) => fillPrices(s ?? '', locale)
const json = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v ?? null))
const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`
const COLS: (keyof Row)[] = [
  'target',
  'collection',
  'id',
  'slug',
  'locale',
  'field',
  'old',
  'new',
  'oldLen',
  'newLen',
  'action',
  'reason',
]
const csvLine = (r: Row) => COLS.map((c) => csvCell(r[c])).join(',')
const writeCsv = (file: string, list: Row[]) =>
  fs.writeFileSync(file, [COLS.join(','), ...list.map(csvLine)].join('\n') + '\n', { mode: 0o600 })

/**
 * --apply logs each change right after it is saved, so a run that fails halfway still
 * leaves a complete record for seo-backfill-revert.ts. One applied log per folder.
 */
const APPLIED_FILE = path.join(OUT, 'seo-backfill-applied.csv')
if (APPLY) {
  if (fs.existsSync(APPLIED_FILE)) {
    console.error(`${APPLIED_FILE} already exists: revert or move it before applying again.`)
    process.exit(1)
  }
  fs.writeFileSync(APPLIED_FILE, COLS.join(',') + '\n', { mode: 0o600 })
}
async function applyAndLog(changed: Row[], write: () => Promise<unknown>) {
  if (!APPLY || !changed.length) return
  await write()
  fs.appendFileSync(APPLIED_FILE, changed.map(csvLine).join('\n') + '\n')
}
const invalid = (field: MetaField, value: string | null | undefined, locale: Locale) => {
  const len = rendered(value, locale).length
  if (!value?.trim()) return 'empty'
  if (field === 'title' && len > TITLE_MAX) return `title ${len} > ${TITLE_MAX}`
  if (field === 'description' && len > DESCRIPTION_MAX)
    return `description ${len} > ${DESCRIPTION_MAX}`
  return null
}

/** Skip documents whose newest version is an unpublished draft: an update would publish it. */
async function hasPendingDraft(payload: Payload, collection: 'pages' | 'projects', id: string) {
  const { docs } = await payload.findVersions({
    collection,
    where: { parent: { equals: id } },
    sort: '-updatedAt',
    limit: 1,
    depth: 0,
  })
  return docs[0]?.version?._status === 'draft'
}

/* ── run ──────────────────────────────────────────────────────────────── */
const payload = await getPayload({ config })
const CONTEXT = { skipScreenshotQueue: true } // meta changes must not re-capture screenshots

// 1. Meta proposals, grouped per document + locale so each is one update.
const groups = new Map<string, MetaProposal[]>()
for (const p of META) {
  const key = `${p.collection}|${p.slug}|${p.locale}`
  groups.set(key, [...(groups.get(key) ?? []), p])
}
for (const [key, proposals] of groups) {
  const [collection, slug, locale] = key.split('|') as ['pages' | 'projects', string, Locale]
  const { docs } = await payload.find({
    collection,
    locale,
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
    draft: false,
  })
  const doc = docs[0]
  const base = { target: TARGET, collection, slug, locale }
  if (!doc) {
    proposals.forEach((p) =>
      rows.push({
        ...base,
        id: '',
        field: `meta.${p.field}`,
        old: '',
        new: p.value,
        oldLen: '',
        newLen: '',
        action: 'skip',
        reason: 'document not found',
      }),
    )
    continue
  }
  const draft = await hasPendingDraft(payload, collection, String(doc.id))
  const meta = (doc.meta ?? {}) as Record<string, unknown>
  const changes: Record<string, string> = {}
  for (const p of proposals) {
    const current = (meta[p.field] as string | null | undefined) ?? null
    const row: Row = {
      ...base,
      id: String(doc.id),
      field: `meta.${p.field}`,
      old: current ?? '',
      new: p.value,
      oldLen: String(rendered(current, locale).length),
      newLen: String(rendered(p.value, locale).length),
      action: 'skip',
      reason: '',
    }
    const why = invalid(p.field, current, locale)
    const max = p.field === 'title' ? TITLE_MAX : DESCRIPTION_MAX
    if (rendered(p.value, locale).length > max) row.reason = 'proposal itself too long'
    else if ((current ?? null) !== (p.expect ?? null) && !(p.expect === null && !current?.trim()))
      row.reason = 'value changed since the audit (human edit?)'
    else if (!why) row.reason = 'current value is valid'
    else if (doc._status !== 'published') row.reason = `document is ${doc._status}`
    else if (draft) row.reason = 'pending draft would be published'
    else {
      row.action = 'update'
      row.reason = why
      changes[p.field] = p.value
    }
    rows.push(row)
  }
  const changedRows = rows.filter(
    (r) => r.id === String(doc.id) && r.locale === locale && r.action === 'update',
  )
  await applyAndLog(changedRows, () =>
    payload.update({
      collection,
      id: doc.id,
      locale,
      depth: 0,
      context: CONTEXT,
      // the whole meta group for this locale, so nothing else in it is touched
      data: { meta: { ...meta, ...changes }, _status: 'published' } as never,
    }),
  )
}

// 2. site-settings: default description (per locale), share image, areaServed.
const settingsAll = (await payload.findGlobal({
  slug: 'site-settings',
  depth: 0,
  locale: 'all',
})) as unknown as {
  technical?: {
    defaultMetaDescription?: Partial<Record<Locale, string | null>> | null
    defaultOgImage?: string | null
    areaServed?: unknown[] | null
  }
}
const tech = settingsAll.technical ?? {}
const sBase = { target: TARGET, collection: 'globals/site-settings', id: 'site-settings', slug: '' }
for (const s of SETTINGS_TEXT) {
  const current = tech.defaultMetaDescription?.[s.locale] ?? ''
  const row: Row = {
    ...sBase,
    locale: s.locale,
    field: `technical.${s.field}`,
    old: current,
    new: s.value,
    oldLen: String(current.length),
    newLen: String(s.value.length),
    action: 'skip',
    reason: '',
  }
  if (s.value.length > DESCRIPTION_MAX) row.reason = 'proposal itself too long'
  else if (current.trim()) row.reason = 'already filled'
  else {
    row.action = 'update'
    row.reason = 'empty'
  }
  rows.push(row)
  if (row.action === 'update') {
    await applyAndLog([row], () =>
      payload.updateGlobal({
        slug: 'site-settings',
        locale: s.locale,
        depth: 0,
        data: { technical: { [s.field]: s.value } } as never,
      }),
    )
  }
}
{
  const media = await payload.find({
    collection: 'media',
    where: { filename: { equals: DEFAULT_OG_IMAGE_FILENAME } },
    depth: 0,
    limit: 1,
  })
  const imageId = media.docs[0] ? String(media.docs[0].id) : ''
  const current = tech.defaultOgImage ? String(tech.defaultOgImage) : ''
  const row: Row = {
    ...sBase,
    locale: '-',
    field: 'technical.defaultOgImage',
    old: current,
    new: imageId,
    oldLen: '',
    newLen: '',
    action: 'skip',
    reason: '',
  }
  if (!imageId) row.reason = `${DEFAULT_OG_IMAGE_FILENAME} not found`
  else if (current) row.reason = 'already set'
  else {
    row.action = 'update'
    row.reason = `empty; set to media ${DEFAULT_OG_IMAGE_FILENAME}`
  }
  rows.push(row)
  if (row.action === 'update') {
    await applyAndLog([row], () =>
      payload.updateGlobal({
        slug: 'site-settings',
        depth: 0,
        data: { technical: { defaultOgImage: imageId } } as never,
      }),
    )
  }
}
{
  const current = tech.areaServed ?? []
  const row: Row = {
    ...sBase,
    locale: '-',
    field: 'technical.areaServed',
    old: json(current),
    new: json(AREA_SERVED),
    oldLen: '',
    newLen: '',
    action: 'skip',
    reason: '',
  }
  if (current.length) row.reason = 'already filled'
  else {
    row.action = 'update'
    row.reason = 'empty (JSON-LD used the built-in fallback)'
  }
  rows.push(row)
  if (row.action === 'update') {
    await applyAndLog([row], () =>
      payload.updateGlobal({
        slug: 'site-settings',
        depth: 0,
        data: { technical: { areaServed: [...AREA_SERVED] } } as never,
      }),
    )
  }
}

// 3. Kempen landing page: structuredData.areaServed (not localized) gets the target towns.
{
  const { docs } = await payload.find({
    collection: 'pages',
    locale: 'nl-BE',
    where: { slug: { equals: KEMPEN_PAGE_SLUG } },
    depth: 0,
    limit: 1,
    draft: false,
  })
  const page = docs[0]
  const base = { target: TARGET, collection: 'pages', slug: KEMPEN_PAGE_SLUG, locale: '-' }
  if (!page) {
    rows.push({
      ...base,
      id: '',
      field: 'structuredData.areaServed',
      old: '',
      new: '',
      oldLen: '',
      newLen: '',
      action: 'skip',
      reason: 'page not found',
    })
  } else {
    const sd = (page.structuredData ?? {}) as {
      type?: string
      areaServed?: { kind: string; name: string; id?: string }[] | null
    }
    const current = sd.areaServed ?? []
    const have = new Set(current.map((a) => a.name.toLowerCase()))
    const next = [
      ...current.map(({ kind, name }) => ({ kind, name })),
      ...KEMPEN_ADD.filter((n) => !have.has(n.toLowerCase())).map((name) => ({
        kind: 'City',
        name,
      })),
    ]
    const row: Row = {
      ...base,
      id: String(page.id),
      field: 'structuredData.areaServed',
      old: json(current.map(({ kind, name }) => ({ kind, name }))),
      new: json(next),
      oldLen: '',
      newLen: '',
      action: 'skip',
      reason: '',
    }
    if (sd.type !== 'local') row.reason = `page type is ${sd.type}, not local`
    else if (next.length === current.length) row.reason = 'towns already present'
    else if (page._status !== 'published') row.reason = `document is ${page._status}`
    else if (await hasPendingDraft(payload, 'pages', String(page.id)))
      row.reason = 'pending draft would be published'
    else {
      row.action = 'update'
      row.reason = `add ${KEMPEN_ADD.filter((n) => !have.has(n.toLowerCase())).join(', ')}`
    }
    rows.push(row)
    if (row.action === 'update') {
      await applyAndLog([row], () =>
        payload.update({
          collection: 'pages',
          id: page.id,
          locale: 'nl-BE',
          depth: 0,
          context: CONTEXT,
          data: { structuredData: { ...sd, areaServed: next }, _status: 'published' } as never,
        }),
      )
    }
  }
}

/* ── report ───────────────────────────────────────────────────────────── */
const file = APPLY ? APPLIED_FILE : path.join(OUT, 'seo-backfill-preview.csv')
if (!APPLY) writeCsv(file, rows)

const short = (s: string, n = 70) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)
console.log(
  `\n${APPLY ? 'APPLIED' : 'DRY RUN'} on ${TARGET}: ${rows.filter((r) => r.action === 'update').length} to update, ${rows.filter((r) => r.action !== 'update').length} skipped\n`,
)
for (const r of rows) {
  console.log(
    `${r.action.toUpperCase().padEnd(6)} ${r.collection}/${r.slug || r.id} [${r.locale}] ${r.field}  (${r.reason})`,
  )
  console.log(`   old ${r.oldLen ? `(${r.oldLen})` : ''}: ${short(r.old, 160)}`)
  console.log(`   new ${r.newLen ? `(${r.newLen})` : ''}: ${short(r.new, 160)}`)
}
console.log(`\nCSV: ${file}`)
process.exit(0)
