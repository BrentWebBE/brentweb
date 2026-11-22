/**
 * One-off migration: brentweb-portfolio (messages/*.json + MDX case studies + images)
 * → Payload (pages, projects, testimonials, media, header, footer, site settings).
 *
 *   PORTFOLIO_DIR=../brentweb-portfolio pnpm payload run scripts/migrate-portfolio.ts
 *
 * Idempotent: documents are matched on slug (pages, projects), filename (media) or
 * business (testimonials) and updated in place, so re-running refreshes the content
 * instead of duplicating it. Re-running DOES overwrite edits made in the admin since.
 *
 * Content decisions baked in here (see the PR description):
 *  - The tech audience is folded in: tech write-ups become each project's
 *    "technical" tab, experience and stack move to the about page, the lab is dropped.
 *  - Prices stay placeholders ({websiteRange} …), filled in from the estimator at render.
 *  - Images are re-encoded with sharp, which strips EXIF (one source photo has GPS data).
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import {
  convertMarkdownToLexical,
  editorConfigFactory,
  type DefaultTypedEditorState,
} from '@payloadcms/richtext-lexical'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'

import config from '../src/payload.config'
import { caseStudyLexical } from '../src/fields/caseStudyLexical'
import type { Locale } from '../src/lib/locales'

const LOCALES: Locale[] = ['nl-BE', 'en']
const ROOT = path.resolve(process.env.PORTFOLIO_DIR || '../brentweb-portfolio')
const CONTEXT = { disableRevalidate: true }

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any
type Messages = Any

const messages: Record<Locale, Messages> = {
  'nl-BE': JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/nl-BE.json'), 'utf8')),
  en: JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/en.json'), 'utf8')),
}

const log = (...args: unknown[]) => console.log('[migrate]', ...args)
const nl = (locale: Locale) => locale === 'nl-BE'

/* ───────────────────────── Lexical helpers ───────────────────────── */

const textNode = (text: string) => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  version: 1,
})
const base = { direction: 'ltr' as const, format: '' as const, indent: 0, version: 1 }
const p = (text: string) => ({
  ...base,
  type: 'paragraph',
  textFormat: 0,
  children: [textNode(text)],
})
const h = (tag: 'h2' | 'h3', text: string) => ({
  ...base,
  type: 'heading',
  tag,
  children: [textNode(text)],
})
const ul = (items: string[]) => ({
  ...base,
  type: 'list',
  listType: 'bullet',
  start: 1,
  tag: 'ul',
  children: items.map((text, i) => ({
    ...base,
    type: 'listitem',
    value: i + 1,
    children: [textNode(text)],
  })),
})
const root = (children: Any[]): DefaultTypedEditorState =>
  ({ root: { ...base, type: 'root', children } }) as DefaultTypedEditorState

const blockNode = (blockType: string, fields: Record<string, unknown>) => ({
  type: 'block',
  version: 2,
  format: '',
  fields: { id: crypto.randomBytes(12).toString('hex'), blockName: '', blockType, ...fields },
})

type Line = string | { text: string }
const lineText = (line: Line) => (typeof line === 'string' ? line : line.text)

/** Simple sections ({ title, paragraphs, list }) as one rich-text document. */
const sectionsToRichText = (sections: { title: string; paragraphs?: Line[]; list?: Line[] }[]) =>
  root(
    sections.flatMap((s) => [
      h('h2', s.title),
      ...(s.paragraphs ?? []).map((line) => p(lineText(line))),
      ...(s.list?.length ? [ul(s.list.map(lineText))] : []),
    ]),
  )

let editorConfig: Awaited<ReturnType<typeof editorConfigFactory.fromEditor>>

/**
 * MDX → Lexical. Markdown goes through Payload's converter; the three custom MDX
 * components and fenced code become Lexical blocks. JSX comments are dropped.
 */
function mdxToLexical(source: string): DefaultTypedEditorState {
  const body = source.replace(/^---[\s\S]*?---\s*/, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  const children: Any[] = []
  const pushMarkdown = (md: string) => {
    if (!md.trim()) return
    const state = convertMarkdownToLexical({ editorConfig, markdown: md.trim() })
    children.push(...((state.root as Any).children ?? []))
  }

  const pattern =
    /```(\w+)?\n([\s\S]*?)```|<Callout>([\s\S]*?)<\/Callout>|<MetricGrid\s+metrics=\{(\[[\s\S]*?\])\}\s*\/>/g
  let last = 0
  for (const match of body.matchAll(pattern)) {
    pushMarkdown(body.slice(last, match.index))
    last = (match.index ?? 0) + match[0].length
    if (match[2] !== undefined) {
      const lang = match[1] ?? 'tsx'
      const language = lang === 'ts' ? 'tsx' : lang === 'html' ? 'markup' : lang
      children.push(blockNode('codeSnippet', { language, code: match[2].replace(/\n$/, '') }))
    } else if (match[3] !== undefined) {
      children.push(blockNode('callout', { text: match[3].trim().replace(/\s*\n\s*/g, ' ') }))
    } else if (match[4] !== undefined) {
      const metrics = [...match[4].matchAll(/value:\s*"([^"]*)",\s*label:\s*"([^"]*)"/g)].map(
        ([, value, label]) => ({ id: crypto.randomBytes(12).toString('hex'), value, label }),
      )
      children.push(blockNode('metricGrid', { metrics }))
    }
  }
  pushMarkdown(body.slice(last))
  return root(children)
}

function readMdx(audience: 'business' | 'tech', slug: string, locale: Locale) {
  const file = path.join(ROOT, 'content/case-studies', audience, slug, `${locale}.mdx`)
  if (!fs.existsSync(file)) return null
  const raw = fs.readFileSync(file, 'utf8')
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
  const field = (key: string) => fm.match(new RegExp(`^${key}:\\s*"(.*)"$`, 'm'))?.[1]
  return {
    body: mdxToLexical(raw),
    title: field('title'),
    summary: field('summary'),
    publishedAt: field('publishedAt'),
  }
}

/* ───────────────────────── Upsert helpers ───────────────────────── */

async function upsertMedia(payload: Payload, file: string, alt: Record<Locale, string>) {
  const name = `${path.parse(file).name}.webp`
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: name } },
    limit: 1,
  })
  const doc =
    existing.docs[0] ??
    (await (async () => {
      // Re-encoding drops all metadata (EXIF, GPS) and keeps the files small.
      const data = await sharp(path.join(ROOT, 'public', file))
        .rotate()
        .resize({ width: 1800, withoutEnlargement: true })
        .webp({ quality: 84 })
        .toBuffer()
      return payload.create({
        collection: 'media',
        locale: 'nl-BE',
        data: { alt: alt['nl-BE'] },
        file: { data, mimetype: 'image/webp', name, size: data.length },
        context: CONTEXT,
      })
    })())
  for (const locale of LOCALES) {
    await payload.update({
      collection: 'media',
      id: doc.id,
      locale,
      data: { alt: alt[locale] },
      context: CONTEXT,
    })
  }
  return doc.id
}

/** Create or update a localized, draft-enabled document by slug, one locale at a time. */
async function upsertLocalized(
  payload: Payload,
  collection: 'pages' | 'projects',
  key: string,
  data: Record<Locale, Record<string, unknown>>,
) {
  const slugNl = data['nl-BE'].slug as string
  const existing = await payload.find({
    collection,
    locale: 'nl-BE',
    draft: true,
    where: { slug: { equals: slugNl } },
    limit: 1,
    depth: 0,
  })
  let id = existing.docs[0]?.id
  for (const locale of LOCALES) {
    const doc = { ...data[locale], _status: 'published' } as Any
    if (!id) {
      const created = await payload.create({
        collection,
        locale,
        data: doc,
        context: CONTEXT,
        draft: false,
      })
      id = created.id
    } else {
      await payload.update({ collection, id, locale, data: doc, context: CONTEXT, draft: false })
    }
  }
  log(`${collection}: ${key}`)
  return id as string
}

/* ───────────────────────── Link helpers ───────────────────────── */

type LinkValue = Record<string, unknown>
const toPage = (id: string, label: string, newTab = false): LinkValue => ({
  type: 'reference',
  reference: { relationTo: 'pages', value: id },
  label,
  newTab,
})
const toUrl = (url: string, label: string): LinkValue => ({ type: 'custom', url, label })
const links = (...items: LinkValue[]) => items.map((link) => ({ link }))
const items = (list: string[]) => list.map((body) => ({ body }))
const lower = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()
const unArrow = (s: string) => s.replace(/^←\s*/, '').replace(/\s*→$/, '')
const ordered = (obj: Record<string, Any>) =>
  Object.keys(obj)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => obj[k])

/* ───────────────────────── Static data ───────────────────────── */

const PAGE_SLUGS = {
  home: { 'nl-BE': 'home', en: 'home' },
  projects: { 'nl-BE': 'projecten', en: 'work' },
  pricing: { 'nl-BE': 'prijzen', en: 'pricing' },
  about: { 'nl-BE': 'over-mij', en: 'about' },
  privacy: { 'nl-BE': 'privacy', en: 'privacy' },
  websiteCheck: { 'nl-BE': 'gratis-websitecheck', en: 'free-website-check' },
  thankYou: { 'nl-BE': 'bedankt', en: 'thank-you' },
  thankYouWebsiteCheck: { 'nl-BE': 'bedankt-websitecheck', en: 'thank-you-website-check' },
  website: { 'nl-BE': 'website-laten-maken', en: 'website-development' },
  webApp: { 'nl-BE': 'webapplicatie-op-maat', en: 'custom-web-applications' },
  integrations: { 'nl-BE': 'koppelingen-en-automatisering', en: 'integrations-and-automation' },
  localGeelKempen: {
    'nl-BE': 'website-laten-maken-geel-kempen',
    en: 'website-development-geel-kempen',
  },
  localKust: { 'nl-BE': 'website-laten-maken-kust', en: 'website-development-coast' },
} as const
type PageKey = keyof typeof PAGE_SLUGS

/**
 * Clients editing their own site, with Payload. Every claim matches the BrentWeb setup:
 * editors change content but not layout, SEO or technical settings (roles); drafts with a
 * live preview and scheduled publishing; opening hours and contact details stored once
 * (SiteSettings) and used site-wide, structured data included; Dutch admin labels with
 * help text; open source, self-hosted, daily back-ups. In the estimator it is the paid
 * base price since November 2026 (the "cms" add-on is gone), so the copy calls it standard.
 */
const SELF_EDIT = {
  'nl-BE': {
    heading: 'Zelf aanpassen, zonder mij te bellen',
    intro:
      'Met Payload, een open-source beheersysteem, past u zelf aan wat vaak verandert. Het zit standaard in elke website die ik bouw.',
    items: [
      {
        title: "Teksten en foto's",
        body: 'Een nieuwe dienst, een foto van uw laatste werk of een aangepaste prijs: u typt het in en publiceert.',
      },
      {
        title: 'Openingsuren en contactgegevens',
        body: 'Op één plek aangepast, en meteen overal juist: op elke pagina en in wat Google over uw zaak leest.',
      },
      {
        title: 'Eerst bekijken, dan publiceren',
        body: 'U ziet uw wijziging op de echte site voor iemand anders ze ziet. Publiceren kan ook op een moment dat u kiest.',
      },
      {
        title: 'Niets om stuk te maken',
        body: 'U past de inhoud aan, de opmaak en de techniek blijven bij mij. De site blijft snel en netjes, wat u ook wijzigt.',
      },
      {
        title: 'In het Nederlands',
        body: 'Het beheerscherm is in het Nederlands, met een korte uitleg bij de velden die er een nodig hebben.',
      },
      {
        title: 'Geen licentie, uw gegevens',
        body: 'Payload is open source: geen maandelijkse licentie. Uw inhoud staat in uw eigen database, met dagelijkse back-ups.',
      },
    ],
    link: 'Bekijk wat een website kost',
    faq: "Ja. Ik bouw uw site met Payload, een open-source beheersysteem: u logt in, past zelf teksten, foto's, openingsuren en contactgegevens aan en bekijkt een voorbeeld voor u publiceert. Dat zit standaard in de prijs. Voor de rest mailt u mij, en ik antwoord binnen een dag of twee.",
    trust: 'Zelf aan te passen',
    included: "Zelf teksten, foto's en openingsuren aanpassen met Payload",
  },
  en: {
    heading: 'Edit it yourself, without calling me',
    intro:
      'With Payload, an open-source content system, you change what changes often yourself. It comes standard with every website I build.',
    items: [
      {
        title: 'Text and photos',
        body: 'A new service, a photo of your latest job or a new price: type it in and publish.',
      },
      {
        title: 'Opening hours and contact details',
        body: 'Changed in one place, and right everywhere at once: on every page and in what Google reads about your business.',
      },
      {
        title: 'Preview first, then publish',
        body: 'See your change on the real site before anyone else does. Publishing can also wait for a moment you pick.',
      },
      {
        title: 'Nothing to break',
        body: 'You edit the content; the layout and the technical side stay with me. The site stays fast and tidy, whatever you change.',
      },
      {
        title: 'In Dutch or English',
        body: 'The admin works in Dutch or English, with a short explanation under the fields that need one.',
      },
      {
        title: 'No licence, your data',
        body: 'Payload is open source: no monthly licence. Your content lives in your own database, backed up daily.',
      },
    ],
    link: 'See what a website costs',
    faq: 'Yes. I build your site with Payload, an open-source content system: you log in, change text, photos, opening hours and contact details yourself, and preview before you publish. It is included in the price. For anything else you email me, and I reply within a day or two.',
    trust: 'Yours to edit',
    included: 'Edit text, photos and opening hours yourself, with Payload',
  },
} as const

const SERVICES = {
  website: { scopes: ['website'], cases: ['carrosserie-kris', 'banden-leusch'] },
  webApp: { scopes: ['web_app'], cases: [] as string[] },
  integrations: { scopes: ['api_integration', 'automation'], cases: [] as string[] },
} as const
type ServiceKey = keyof typeof SERVICES
/** Each service row says where its link goes, not three times "more about this". */
const SERVICE_LINK_LABELS: Record<ServiceKey, { en: string; nl: string }> = {
  website: { nl: 'Bekijk websites', en: 'See websites' },
  webApp: { nl: 'Bekijk webapps', en: 'See web apps' },
  integrations: { nl: 'Bekijk koppelingen', en: 'See integrations' },
}

const LOCAL = {
  localGeelKempen: {
    copy: 'geelKempen',
    areaServed: [
      { kind: 'City', name: 'Geel' },
      { kind: 'AdministrativeArea', name: 'Kempen' },
    ],
  },
  localKust: {
    copy: 'kust',
    areaServed: [
      { kind: 'City', name: 'Blankenberge' },
      { kind: 'City', name: 'Brugge' },
    ],
  },
} as const

const PROJECT_IMAGES: Record<
  string,
  { cover: string; phone?: string; alt: Record<Locale, string> }
> = {
  'carrosserie-kris': {
    cover: 'images/ckris-desktop.webp',
    phone: 'images/ckris-phone.webp',
    alt: {
      'nl-BE': 'De website van Carrosserie Kris, met de werkplaats en de herstellingsdiensten',
      en: 'The Carrosserie Kris website, showing the workshop and repair services',
    },
  },
  'banden-leusch': {
    cover: 'images/leusch-desktop.webp',
    alt: {
      'nl-BE': 'De website van Banden Leusch, met banden, onderhoud en ADAS-kalibratie',
      en: 'The Banden Leusch website, with tyres, maintenance and ADAS calibration',
    },
  },
  idps: {
    cover: 'images/idps.webp',
    alt: {
      'nl-BE': 'Het dashboard van het intrusion-detectiesysteem',
      en: 'The dashboard of the intrusion detection system',
    },
  },
  'provilion-broodjes': {
    cover: 'images/provilion.webp',
    alt: {
      'nl-BE': 'Het bestelplatform van Provilion Broodjes',
      en: 'The Provilion Broodjes ordering platform',
    },
  },
  'het-smaakpand': {
    cover: 'images/hetsmaakpand.webp',
    alt: {
      'nl-BE': 'De website van Het Smaakpand, met menu en openingsuren',
      en: 'The Het Smaakpand website, with menu and opening hours',
    },
  },
}

/** Real quotes only (copied from lib/testimonials.ts); entries without a quote are skipped. */
const TESTIMONIALS = [
  {
    key: 'carrosserieKris',
    quote:
      'Topwerk geleverd bij Carrosserie Kris! Bij Brent is dit geen werk maar een passie en dat voel je aan alles. Niets is hem teveel. Ik kan hem alleen maar aanbevelen!',
    lang: 'nl',
    business: 'Carrosserie Kris',
    website: 'carrosseriekris.be',
    project: 'carrosserie-kris',
  },
  {
    key: 'leusch',
    // Paragraphs two and three of his Google review (November 2026), word for word.
    quote:
      'Vanaf het begin verliep de samenwerking heel aangenaam. Brent luistert goed naar je wensen, denkt actief mee en komt zelf met ideeën en voorstellen om alles nog beter te maken. Je merkt dat hij echt aandacht besteedt aan de details en niet zomaar snel iets in elkaar steekt. Het resultaat is een moderne, professionele website en een nieuw logo die perfect aansluiten bij de uitstraling die ik voor mijn zaak voor ogen had.',
    lang: 'nl',
    name: 'Yorick Leusch',
    business: 'Banden Leusch',
    website: 'leusch.be',
    project: 'banden-leusch',
  },
]

/** The Google Business Profile's review link, under the client quotes (lib/site.ts). */
const GOOGLE_REVIEWS_URL = 'https://g.page/r/CRYPXOL2HLl3EAE/review'
/** Pain point whose fix ran for a real client (lib/pain-points.ts PAIN_CASE_STUDIES). */
const PAIN_CASE_STUDIES: Record<string, string> = { '2': 'carrosserie-kris' }
/** The live site's contact address since November 2026. */
const CONTACT_EMAIL = 'brent@brentweb.be'

const period = (value: string) =>
  value.toLowerCase().replace(' - ', ' – ').replace('heden', 'nu').replace('present', 'now')

/* ───────────────────────── Main ───────────────────────── */

async function run() {
  const payload = await getPayload({ config })
  editorConfig = await editorConfigFactory.fromEditor({
    config: payload.config,
    editor: caseStudyLexical,
  })
  log(`reading from ${ROOT}`)

  /* Media */
  const portrait = await upsertMedia(payload, 'brent-profile.webp', {
    'nl-BE': 'Brent Schoenmakers, met de armen gekruist, tegen een grijze muur',
    en: 'Brent Schoenmakers, arms crossed, against a grey wall',
  })
  // A portrait imported with scripts/import-portrait.ts wins over the old one.
  const imported = await payload.find({
    collection: 'media',
    where: { filename: { equals: 'brent-portrait.webp' } },
    limit: 1,
    depth: 0,
  })
  const heroPortrait = imported.docs[0]?.id ?? portrait
  // The working photo (scripts/import-desk-photo.ts) for the "about" spots; the old
  // casual portrait was dropped as not professional enough. Falls back to the portrait.
  const deskPhoto = await payload.find({
    collection: 'media',
    where: { filename: { equals: 'brent-at-work.webp' } },
    limit: 1,
    depth: 0,
  })
  const atWork = deskPhoto.docs[0]?.id ?? heroPortrait
  const projectMedia: Record<string, { cover: string; phone?: string }> = {}
  for (const [slug, img] of Object.entries(PROJECT_IMAGES)) {
    projectMedia[slug] = {
      cover: await upsertMedia(payload, img.cover, img.alt),
      phone: img.phone
        ? await upsertMedia(payload, img.phone, {
            'nl-BE': `${img.alt['nl-BE']}, op een gsm`,
            en: `${img.alt.en}, on a phone`,
          })
        : undefined,
    }
  }
  log('media done')

  /* Projects */
  const projectIds: Record<string, string> = {}
  const projectItems = (locale: Locale) => messages[locale].projects.items as Any[]
  for (const [index, item] of projectItems('nl-BE').entries()) {
    const slug = item.slug as string
    const data = {} as Record<Locale, Record<string, unknown>>
    for (const locale of LOCALES) {
      const it = projectItems(locale).find((x) => x.slug === slug)
      const story = readMdx('business', slug, locale)
      const tech = readMdx('tech', slug, locale)
      data[locale] = {
        slug,
        title: it.title,
        client: it.client ?? null,
        sector: it.sector,
        period: period(it.period),
        abstract: it.abstract,
        summary: it.business.summary,
        cover: projectMedia[slug]?.cover ?? null,
        coverMobile: projectMedia[slug]?.phone ?? null,
        metrics: it.business.metrics,
        outcomes: it.business.outcomes,
        body: story?.body ?? null,
        technical: {
          tags: it.tags,
          summary: it.engineering.summary,
          decisions: it.engineering.decisions,
          body: tech?.body ?? null,
          githubUrl: it.githubUrl || null,
        },
        status: it.status,
        liveUrl: it.liveUrl || null,
        order: (index + 1) * 10,
        publishedAt: story?.publishedAt ? new Date(story.publishedAt).toISOString() : undefined,
        meta: {
          title: story?.title ? `${story.title} | BrentWeb` : undefined,
          description: story?.summary ?? it.abstract,
          image: projectMedia[slug]?.cover ?? null,
        },
      }
    }
    projectIds[slug] = await upsertLocalized(payload, 'projects', slug, data)
  }

  /* Testimonials */
  for (const t of TESTIMONIALS) {
    const existing = await payload.find({
      collection: 'testimonials',
      where: { business: { equals: t.business } },
      limit: 1,
    })
    let id = existing.docs[0]?.id
    for (const locale of LOCALES) {
      const doc = {
        quote: t.quote,
        lang: t.lang as 'nl',
        business: t.business,
        name: (t as { name?: string }).name,
        website: t.website,
        project: projectIds[t.project],
        context: messages[locale].testimonials.items[t.key].context,
        visible: true,
      }
      if (!id)
        id = (
          await payload.create({ collection: 'testimonials', locale, data: doc, context: CONTEXT })
        ).id
      else
        await payload.update({
          collection: 'testimonials',
          id,
          locale,
          data: doc,
          context: CONTEXT,
        })
    }
    log(`testimonials: ${t.business}`)
  }
  const testimonialFor = async (slug: string) =>
    (
      await payload.find({
        collection: 'testimonials',
        where: { project: { equals: projectIds[slug] } },
        limit: 5,
      })
    ).docs.map((d) => d.id)

  /* Pages, pass 1: make sure every page exists, so layouts can reference each other. */
  const ids = {} as Record<PageKey, string>
  for (const key of Object.keys(PAGE_SLUGS) as PageKey[]) {
    const existing = await payload.find({
      collection: 'pages',
      locale: 'nl-BE',
      draft: true,
      where: { slug: { equals: PAGE_SLUGS[key]['nl-BE'] } },
      limit: 1,
      depth: 0,
    })
    ids[key] =
      existing.docs[0]?.id ??
      (
        await payload.create({
          collection: 'pages',
          locale: 'nl-BE',
          draft: false,
          context: CONTEXT,
          data: {
            title: key,
            slug: PAGE_SLUGS[key]['nl-BE'],
            _status: 'published',
            layout: [{ blockType: 'hero', variant: 'page', title: key }],
          },
        })
      ).id
  }

  /* Pages, pass 2: the real layouts. */
  type Layout = Any[]
  const pages = {} as Record<PageKey, Record<Locale, Record<string, unknown>>>
  const set = (
    key: PageKey,
    locale: Locale,
    title: string,
    layout: Layout,
    meta: Record<string, unknown> = {},
    extra: Record<string, unknown> = {},
  ) => {
    pages[key] ??= {} as Record<Locale, Record<string, unknown>>
    pages[key][locale] = { title, slug: PAGE_SLUGS[key][locale], layout, meta, ...extra }
  }

  for (const locale of LOCALES) {
    const m = messages[locale]
    const home = `/${locale}`
    const contactHref = `${home}#contact`
    const sp = m.servicePages
    const serviceCard = (key: ServiceKey) => ({
      title: sp.items[key].navLabel,
      description: sp.items[key].intro,
      enableLink: true,
      link: toPage(ids[key], SERVICE_LINK_LABELS[key][nl(locale) ? 'nl' : 'en']),
    })
    const bookCta = (): Layout[number] => ({
      blockType: 'cta',
      richText: root([p(m.bookCta.body)]),
      links: links(
        toUrl(contactHref, m.bookCta.button),
        toUrl(`mailto:${CONTACT_EMAIL}`, m.bookCta.mail),
      ),
    })
    const contactBlock = (variant: 'business' | 'tech'): Layout[number] => ({
      blockType: 'contact',
      eyebrow: lower(m.contact[variant].badge),
      heading: m.contact[variant].title,
      intro: m.contact[variant].subtitle,
      messagePlaceholder: m.contact[variant].messagePlaceholder,
      formNote: m.contact[variant].formNote,
      showMap: variant === 'business',
    })

    /* Home: who, the live work, the proof, the problems, the prices, the person, contact. */
    const firstSentence = (text: string) => text.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? text
    set(
      'home',
      locale,
      'Home',
      [
        {
          blockType: 'hero',
          variant: 'home',
          greeting: true,
          greetingSuffix: nl(locale) ? ', ik ben Brent.' : ", I'm Brent.",
          title: m.hero.business.title,
          intro: firstSentence(m.hero.tagline),
          links: links(
            toPage(ids.pricing, m.hero.business.getInTouch),
            toPage(ids.projects, m.cta.mid.secondary),
          ),
          trustItems: [
            ...(Object.values(m.hero.business.trust) as string[]),
            SELF_EDIT[locale].trust,
          ].map((text) => ({ text })),
          image: heroPortrait,
          imageCaption: m.hero.location,
        },
        {
          blockType: 'projects',
          heading: m.proof.title,
          mode: 'selected',
          items: ['carrosserie-kris', 'banden-leusch', 'het-smaakpand'].map((slug) => ({
            project: projectIds[slug],
          })),
          layout: 'showcase',
          showLink: true,
          link: toPage(ids.projects, nl(locale) ? 'Alle projecten' : 'All projects'),
        },
        {
          blockType: 'testimonials',
          heading: m.testimonials.title,
          enableLink: true,
          link: { ...toUrl(GOOGLE_REVIEWS_URL, m.testimonials.googleLink), newTab: true },
        },
        {
          blockType: 'painPoints',
          heading: m.pain.title,
          items: Object.keys(m.pain.items)
            .sort((a, b) => Number(a) - Number(b))
            .map((k) => ({
              problem: m.pain.items[k].problem,
              fix: m.pain.items[k].fix,
              project: PAIN_CASE_STUDIES[k] ? projectIds[PAIN_CASE_STUDIES[k]] : undefined,
            })),
          caseLinkLabel: m.pain.caseLink,
          linkLabel: m.pain.solveLink,
        },
        {
          blockType: 'services',
          heading: m.pain.servicesTitle,
          columns: '3',
          items: (['website', 'webApp', 'integrations'] as ServiceKey[]).map(serviceCard),
        },
        {
          blockType: 'pricing',
          heading: m.pricing.title,
          servicePages: [
            { scope: 'website', page: ids.website },
            { scope: 'web_app', page: ids.webApp },
            { scope: 'api_integration', page: ids.integrations },
            { scope: 'automation', page: ids.integrations },
          ],
          note: `${m.pricing.note} ${m.pricing.vatExempt} ${m.pricing.maintenance
            .replace('{basic}', '{maintenanceBasic}')
            .replace('{active}', '{maintenanceActive}')}`,
          ctaTitle: m.pricing.ctaTitle,
          ctaBody: m.pricing.ctaBody,
          ctaLink: toPage(ids.pricing, m.pricing.cta),
        },
        {
          blockType: 'steps',
          heading: m.process.title,
          steps: ordered(m.process.steps).map((s: Any) => ({ title: s.title, body: s.body })),
          enableLink: true,
          link: toUrl(contactHref, m.process.bookStep),
        },
        {
          blockType: 'textImage',
          richText: root([
            h('h2', m.about.business.title),
            p(m.about.business.description1),
            p(m.about.business.description2),
          ]),
          image: atWork,
          imagePosition: 'left',
          photoStyle: 'plain',
          caption: m.about.experience,
          links: links(toPage(ids.about, nl(locale) ? 'Meer over mij' : 'More about me')),
        },
        contactBlock('business'),
      ],
      {
        title: m.hero.business.metaTitle,
        description: m.hero.business.metaDescription,
        image: heroPortrait,
      },
    )

    /* Service pages */
    for (const key of Object.keys(SERVICES) as ServiceKey[]) {
      const item = sp.items[key]
      const def = SERVICES[key]
      const included = [
        ...new Set(def.scopes.flatMap((s) => m.calculator.scope.options[s].includes as string[])),
        ...(key === 'website' ? [SELF_EDIT[locale].included] : []),
      ]
      const testimonials = (await Promise.all(def.cases.map(testimonialFor))).flat()
      const layout: Layout = [
        {
          blockType: 'hero',
          variant: 'page',
          eyebrow: lower(item.eyebrow),
          title: item.title,
          intro: item.intro,
          priceScopes: [...def.scopes],
          showcaseProject: def.cases[0] ? projectIds[def.cases[0]] : undefined,
          links: links(toPage(ids.pricing, sp.ctaPrimary), toUrl(contactHref, sp.ctaSecondary)),
        },
        {
          blockType: 'features',
          heading: sp.forWhoTitle,
          style: 'ticks',
          items: items(item.forWho),
        },
        {
          blockType: 'features',
          heading: sp.includedTitle,
          style: 'cards',
          items: items(included),
        },
        {
          blockType: 'content',
          columns: [
            { size: 'full', richText: root([h('h2', sp.approachTitle), ...item.approach.map(p)]) },
          ],
        },
        ...(key === 'website'
          ? ([
              {
                blockType: 'features',
                heading: SELF_EDIT[locale].heading,
                intro: SELF_EDIT[locale].intro,
                style: 'cards',
                background: true,
                items: SELF_EDIT[locale].items.map((i) => ({ title: i.title, body: i.body })),
                enableLink: true,
                link: toPage(ids.pricing, SELF_EDIT[locale].link),
              },
              {
                blockType: 'features',
                heading: m.security.compactTitle,
                intro: m.security.lede,
                style: 'compact',
                items: Object.values(m.security.items).map((i: Any) => ({
                  title: i.title,
                  body: i.body,
                })),
              },
            ] as Layout)
          : []),
        {
          blockType: 'features',
          heading: sp.needsTitle,
          style: 'ticks',
          items: items(item.needs),
        },
        ...(def.cases.length
          ? ([
              {
                blockType: 'projects',
                heading: sp.caseTitle,
                mode: 'selected',
                layout: 'cards',
                items: def.cases.map((slug) => ({ project: projectIds[slug] })),
              },
              ...(testimonials.length ? [{ blockType: 'testimonials', testimonials }] : []),
            ] as Layout)
          : []),
        {
          blockType: 'faq',
          heading: sp.faqTitle,
          items: item.faq.map((f: Any, i: number) => ({
            question: f.q,
            // The "can I edit it myself?" answer now names how: Payload, as a paid option.
            answer: root([p(key === 'website' && i === 2 ? SELF_EDIT[locale].faq : f.a)]),
          })),
        },
        bookCta(),
        {
          blockType: 'services',
          heading: sp.otherTitle,
          columns: '2',
          items: (Object.keys(SERVICES) as ServiceKey[]).filter((k) => k !== key).map(serviceCard),
        },
      ]
      set(
        key,
        locale,
        item.navLabel,
        layout,
        { title: item.metaTitle, description: item.metaDescription },
        {
          structuredData: { type: 'service', serviceName: item.navLabel, scopes: [...def.scopes] },
        },
      )
    }

    /* Local pages */
    for (const key of Object.keys(LOCAL) as (keyof typeof LOCAL)[]) {
      const lp = m.localPages
      const item = lp.items[LOCAL[key].copy]
      const [first, ...rest] = item.intro as string[]
      const layout: Layout = [
        {
          blockType: 'hero',
          variant: 'page',
          // The short label for the breadcrumb; the old eyebrow carried a middle dot.
          eyebrow: item.navLabel,
          title: item.title,
          intro: first,
          paragraphs: rest.map((text) => ({ text })),
          priceScopes: ['website'],
          showcaseProject: item.cases?.[0] ? projectIds[item.cases[0].slug] : undefined,
          links: links(toPage(ids.website, lp.serviceLink), toPage(ids.pricing, m.pricing.cta)),
        },
        {
          blockType: 'content',
          columns: [{ size: 'full', richText: sectionsToRichText(item.sections) }],
        },
        ...(item.cases?.length
          ? ([
              {
                blockType: 'projects',
                heading: lp.caseTitle,
                mode: 'selected',
                layout: 'list',
                items: item.cases.map((c: Any) => ({ project: projectIds[c.slug], note: c.note })),
              },
            ] as Layout)
          : []),
        bookCta(),
      ]
      set(
        key,
        locale,
        item.navLabel,
        layout,
        { title: item.metaTitle, description: item.metaDescription },
        {
          structuredData: { type: 'local', areaServed: LOCAL[key].areaServed },
        },
      )
    }

    /* Pricing (the estimator) */
    const pg = m.pricingGuide
    set(
      'pricing',
      locale,
      m.calculator.metaTitle,
      [
        {
          blockType: 'hero',
          variant: 'page',
          eyebrow: lower(m.calculator.badge),
          title: m.calculator.title,
          intro: m.calculator.subtitle,
        },
        { blockType: 'estimator' },
        { blockType: 'pricingTable', heading: pg.tableTitle, intro: pg.tableIntro },
        {
          blockType: 'features',
          heading: pg.driversTitle,
          style: 'cards',
          items: pg.drivers.map((d: Any) => ({ title: d.title, body: d.body })),
        },
        {
          blockType: 'content',
          columns: [{ size: 'full', richText: sectionsToRichText(pg.sections) }],
        },
        // The objections people raise before they ask for a price (moved off the homepage).
        {
          blockType: 'faq',
          heading: m.faq.title,
          items: ordered(m.faq.items).map((f: Any) => ({ question: f.q, answer: root([p(f.a)]) })),
        },
        bookCta(),
      ],
      { title: m.calculator.metaTitle, description: m.calculator.metaDescription },
    )

    /* Projects index */
    set(
      'projects',
      locale,
      m.work.metaTitleList,
      [
        {
          blockType: 'hero',
          variant: 'page',
          eyebrow: lower(m.work.listBadge),
          title: m.work.listTitle,
          intro: m.work.listSubtitle,
        },
        { blockType: 'projects', mode: 'all', layout: 'cards' },
        bookCta(),
      ],
      {
        title: `${m.work.metaTitleList} | BrentWeb`,
        description: m.work.metaDescriptionList,
      },
    )

    /* About: the merged-in engineering side */
    const ex = m.experience
    const spec = m.hero.tech.spec
    const timelineGroup = (label: string, entries: Any[]) => ({
      label,
      entries: entries.map((e) => ({
        period: e.year,
        title: e.title,
        organisation: e.company,
        description: e.description,
        note: e.personalNote ?? null,
        tags: e.tags ?? [],
        current: e.status === 'current',
      })),
    })
    set(
      'about',
      locale,
      m.nav.about,
      [
        {
          blockType: 'hero',
          variant: 'home',
          greeting: true,
          greetingSuffix: nl(locale) ? ', ik ben Brent.' : ", I'm Brent.",
          title: m.about.business.title,
          intro: `${m.about.business.description1}\n\n${m.about.business.description2}`,
          links: links(
            toUrl(`/${locale}/${PAGE_SLUGS.about[locale]}#contact`, m.about.getInTouch),
            toPage(ids.projects, m.cta.mid.secondary),
          ),
          image: atWork,
          imageCaption: m.hero.location,
          note: unArrow(m.about.annotation),
        },
        {
          blockType: 'content',
          columns: [
            {
              size: 'full',
              richText: root([
                h('h2', m.about.techTitle),
                p(m.about.techDescription),
                p(m.about.tech.description1),
                p(m.about.tech.description2),
              ]),
            },
          ],
        },
        {
          blockType: 'features',
          eyebrow: nl(locale) ? 'mijn gereedschap' : 'my toolbox',
          heading: nl(locale) ? 'Waar ik mee werk' : 'What I work with',
          style: 'compact',
          background: true,
          items: [
            { title: spec.stackLabel, body: spec.stackValue },
            { title: spec.frameworksLabel, body: `${spec.frameworksValue}, Payload CMS` },
            { title: spec.focusLabel, body: spec.focusValue },
            { title: spec.locationLabel, body: m.hero.location },
          ],
        },
        {
          blockType: 'timeline',
          eyebrow: lower(ex.badge),
          heading: ex.title,
          groups: [
            timelineGroup(ex.work, ex.items.work),
            timelineGroup(ex.education, ex.items.education),
            timelineGroup(ex.hackathons, ex.items.hackathons),
          ],
        },
        {
          blockType: 'projects',
          eyebrow: lower(m.cta.tech.eyebrow),
          heading: m.cta.tech.title,
          intro: m.cta.tech.body,
          mode: 'all',
          layout: 'list',
        },
        contactBlock('tech'),
      ],
      {
        title: nl(locale)
          ? 'Over mij: Brent Schoenmakers, webontwikkelaar uit Geel'
          : 'About me: Brent Schoenmakers, web developer from Geel',
        description: m.hero.tech.metaDescription,
        image: atWork,
      },
    )

    /* Website check */
    const wc = m.websiteCheck
    set(
      'websiteCheck',
      locale,
      wc.eyebrow.charAt(0) + wc.eyebrow.slice(1).toLowerCase(),
      [
        {
          blockType: 'hero',
          variant: 'page',
          eyebrow: lower(wc.eyebrow),
          title: wc.title,
          intro: wc.intro,
        },
        { blockType: 'websiteCheck', variant: 'form', heading: wc.form.title },
        {
          blockType: 'features',
          heading: wc.receiveTitle,
          style: 'cards',
          items: Object.values(wc.items).map((i: Any) => ({ title: i.title, body: i.body })),
        },
      ],
      { title: wc.metaTitle, description: wc.metaDescription },
    )

    /* Thank-you pages */
    const th = m.thanks
    for (const [key, copy] of [
      ['thankYou', th.lead],
      ['thankYouWebsiteCheck', th.websitecheck],
    ] as const) {
      set(
        key,
        locale,
        th.metaTitle,
        [
          { blockType: 'hero', variant: 'page', eyebrow: lower(th.eyebrow), title: copy.title },
          {
            blockType: 'steps',
            heading: th.nextTitle,
            steps: ordered(copy.steps).map((s: Any) => ({ title: s.title, body: s.body })),
          },
          {
            blockType: 'cta',
            richText: root([
              h('h3', nl(locale) ? 'Liever meteen praten?' : 'Rather talk right away?'),
              p(
                nl(locale)
                  ? 'Bel me gerust even. Neem ik niet op, dan bel ik terug.'
                  : "Feel free to give me a call. If I don't pick up, I'll call you back.",
              ),
            ]),
            links: links(
              toUrl('tel:+32465921862', nl(locale) ? 'Bel me even' : 'Give me a call'),
              toPage(ids.home, th.backHome),
            ),
          },
        ],
        { title: th.metaTitle, noIndex: true },
      )
    }

    /* Privacy */
    const pv = m.privacy
    set(
      'privacy',
      locale,
      pv.title,
      [
        {
          blockType: 'hero',
          variant: 'page',
          title: pv.title,
          intro: pv.lastUpdated.replace(
            '{date}',
            new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(
              new Date(pv.lastUpdatedDate),
            ),
          ),
        },
        {
          blockType: 'content',
          columns: [{ size: 'full', richText: sectionsToRichText(pv.sections) }],
        },
      ],
      { title: `${pv.title} | BrentWeb`, description: pv.metaDescription },
    )
  }

  for (const key of Object.keys(PAGE_SLUGS) as PageKey[]) {
    await upsertLocalized(payload, 'pages', key, pages[key])
  }

  /* Header, footer, site settings */
  for (const locale of LOCALES) {
    const m = messages[locale]
    await payload.updateGlobal({
      slug: 'header',
      locale,
      context: CONTEXT,
      data: {
        navItems: links(
          toPage(ids.website, m.servicePages.items.website.navLabel),
          toPage(ids.projects, m.nav.projects),
          toPage(ids.pricing, m.nav.pricing),
          toPage(ids.about, m.nav.about),
        ),
        cta: toUrl(`/${locale}#contact`, nl(locale) ? 'Stuur me een bericht' : 'Send me a message'),
      } as Any,
    })
    await payload.updateGlobal({
      slug: 'footer',
      locale,
      context: CONTEXT,
      data: {
        navItems: links(
          toPage(ids.website, m.servicePages.items.website.navLabel),
          toPage(ids.webApp, m.servicePages.items.webApp.navLabel),
          toPage(ids.integrations, m.servicePages.items.integrations.navLabel),
          toPage(ids.localGeelKempen, m.localPages.items.geelKempen.navLabel),
          toPage(ids.localKust, m.localPages.items.kust.navLabel),
          toPage(ids.projects, m.nav.projects),
          toPage(ids.pricing, m.nav.pricing),
          toPage(ids.websiteCheck, m.nav.websiteCheck),
          toPage(ids.about, m.nav.about),
        ),
        note: unArrow(m.footer.annotation),
        blurb: m.hero.tagline,
      } as Any,
    })
    await payload.updateGlobal({
      slug: 'site-settings',
      locale,
      context: CONTEXT,
      data: {
        businessName: 'BrentWeb',
        personName: 'Brent Schoenmakers',
        kboNumber: '1039.059.149',
        vatExempt: true,
        availability: 'open',
        portrait,
        address: { street: 'Laarsveld 30', postalCode: '2440', city: 'Geel' },
        phone: '+32 465 92 18 62',
        email: CONTACT_EMAIL,
        whatsapp: 'https://wa.me/32465921862',
        locations: [
          { name: 'Blankenberge', lat: 51.3112589, lng: 3.1323429 },
          { name: 'Geel', lat: 51.1657, lng: 4.9902 },
        ],
        replyNote: `${m.contact.phoneNote} ${m.contact.visitNote}`,
        socialLinks: [
          { platform: 'linkedin', url: 'https://www.linkedin.com/in/brent-schoenmakers/' },
          { platform: 'instagram', url: 'https://www.instagram.com/brentweb.be/' },
          { platform: 'other', url: 'https://github.com/BrentWebBE' },
        ],
        technical: { schemaType: 'ProfessionalService', noIndex: false },
      } as Any,
    })
  }
  log('globals done')

  // The script bypasses the revalidation hooks: ask a running site to expire its cache.
  const site = process.env.NEXT_PUBLIC_SERVER_URL
  if (site && process.env.CRON_SECRET) {
    try {
      const res = await fetch(`${site}/next/revalidate`, {
        method: 'POST',
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      })
      log(`cache revalidation at ${site}: ${res.status}`)
    } catch {
      log(`no site running at ${site}; its cache starts cold anyway`)
    }
  }
  log(`done: ${Object.keys(projectIds).length} projects, ${Object.keys(ids).length} pages`)
  process.exit(0)
}

// Top-level await: `payload run` exits as soon as the import resolves.
try {
  await run()
} catch (err) {
  console.error(err)
  process.exit(1)
}
