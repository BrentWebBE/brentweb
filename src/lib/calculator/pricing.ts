import {
  DEFAULT_ESTIMATE_INPUT,
  type AiAnalysis,
  type AutomationLevel,
  type BudgetKey,
  type ContentLevel,
  type DesignLevel,
  type EstimateInput,
  type FeatureKey,
  type MaintenancePlan,
  type RoleLevel,
  type ScopeKey,
} from '@/lib/schemas/lead'

/**
 * The computable brackets: every budget the form offers except 'not-sure',
 * which is a visitor's answer rather than an estimator output. Derived from
 * BUDGET_KEYS so the two lists cannot drift — widening this type turns
 * BRACKET_BOUNDS below into a compile error rather than a silent gap.
 */
type BudgetBracket = Exclude<BudgetKey, 'not-sure'>

/** A [low, high] pair: hours, euros or weeks. */
export type Range = [number, number]

/*
 * ── The rule table ─────────────────────────────────────────────────────────
 *
 * Deterministic, no AI, no database. The estimator prices work in hours: every
 * answer adds a line with a low/high hour range, the lines are summed, a share
 * for testing and communication goes on top, and the hours are multiplied by
 * one rate. The AI analysis (lib/calculator/ai.ts) can only add hour lines on
 * top of this, never change the rate or remove anything.
 *
 * Priced for a student-zelfstandige working alongside study, not an agency:
 * the rate sits well below agency rates and the weekly capacity assumes
 * part-time hours.
 *
 * Numbers only. Every label lives in the message bundle under
 * calculator.lines / calculator.features, because they are rendered to Dutch
 * visitors in both the estimator and the generated PDF.
 *
 * Website hours were lowered in November 2026: sites are built on the Payload starter,
 * so setup, forms, SEO, blog and webshop reuse finished modules. Ranges are kept narrow
 * because every site is still built by hand on top of it.
 *
 * ⚠ TODO(brent): every figure below is a first calibration, not a confirmed
 * price. The rate and capacity drive everything; the hour ranges were tuned so
 * the derived bands in SCOPE_DEFINITIONS land near the ranges the site quoted
 * before (website €600-2000); the web-app band came out higher than the old
 * €800-2500 placeholder, which already flagged its floor as too low.
 */
export const PRICING = {
  /** Euros per hour, all work. */
  hourlyRate: 40,
  /** Prices are rounded to this many euros, so nothing reads as false precision. */
  roundTo: 25,
  /** Hours per week available for one project: [slow week, good week]. */
  weeklyHours: [12, 18] as Range,
  /** Testing, revisions and communication, as a share of the build hours. */
  overhead: 0.1,
  /** Monthly fee per maintenance plan, outside the project price. */
  maintenance: { none: 0, basic: 25, active: 90 } satisfies Record<MaintenancePlan, number>,
} as const

const HOURS = {
  website: {
    /**
     * Every website is built on the BrentWeb Payload starter: repo, hosting, domain, SSL,
     * deploy, base layout, and the client's own Payload admin (editor account, content
     * set-up, a short walkthrough). Self-editing is standard, so it is priced here.
     */
    base: [7, 9] as Range,
    /** Building one page, excluding its design. */
    perPage: [1, 1.5] as Range,
  },
  webApp: {
    /** Architecture, database, authentication, deploy. */
    base: [16, 26] as Range,
    /** One screen or module: data model, UI, validation. */
    perScreen: [4, 7] as Range,
    roles: { single: [0, 0], few: [5, 10], many: [12, 24] } satisfies Record<RoleLevel, Range>,
  },
  integration: {
    base: [2, 3] as Range,
    perIntegration: [4, 8] as Range,
  },
  automation: {
    /** Hosting, scheduling and failure alerts, once. */
    base: [3, 5] as Range,
    perWorkflow: { simple: [2, 4], moderate: [4, 8], complex: [8, 16] } satisfies Record<
      AutomationLevel,
      Range
    >,
  },
  design: {
    /** Once per project: colours, type, components. */
    system: { basic: [2, 2.5], custom: [4, 7], premium: [8, 14] } satisfies Record<
      DesignLevel,
      Range
    >,
    /** Per page. App screens count at half, they reuse more. */
    perPage: { basic: [0.5, 0.6], custom: [1, 2], premium: [2, 3.5] } satisfies Record<
      DesignLevel,
      Range
    >,
  },
  /** Per page: editing supplied text, or writing it from scratch. */
  content: { ready: [0, 0], polish: [0.5, 0.75], write: [1, 2] } satisfies Record<
    ContentLevel,
    Range
  >,
  languages: {
    /** Once, as soon as there is a second language. */
    setup: [3, 6] as Range,
    /** Per page or screen, per extra language. Translations come from the client. */
    perPage: [0.3, 0.6] as Range,
  },
  start: {
    /** Per page: moving content over from the old site. */
    redesignPerPage: [0.5, 1] as Range,
    /** Reading an existing codebase before changing it. */
    extendOnboarding: [4, 10] as Range,
    /** Share of the base setup still needed when the project already exists. */
    extendBaseFactor: 0.4,
  },
} as const

type FeatureGroup = 'content' | 'commerce' | 'users' | 'marketing' | 'technical'

interface FeatureDefinition {
  hours: Range
  group: FeatureGroup
  /** The project types the feature is offered for; ignored otherwise. */
  appliesTo: ScopeKey[]
}

const WEB: ScopeKey[] = ['website', 'web_app']

export const FEATURES: Record<FeatureKey, FeatureDefinition> = {
  contact_form: { hours: [1.5, 2], group: 'content', appliesTo: ['website'] },
  // Standard on every website since November 2026 (in HOURS.website.base): offered for
  // no project type, so it never shows up as an add-on. Kept so old saved answers parse.
  cms: { hours: [0, 0], group: 'content', appliesTo: [] },
  blog: { hours: [3.5, 4.5], group: 'content', appliesTo: ['website'] },
  gallery: { hours: [2, 2.5], group: 'content', appliesTo: ['website'] },
  search: { hours: [3, 7], group: 'content', appliesTo: WEB },
  webshop: { hours: [20, 26], group: 'commerce', appliesTo: WEB },
  payments: { hours: [6, 12], group: 'commerce', appliesTo: [...WEB, 'api_integration'] },
  booking: { hours: [10, 18], group: 'commerce', appliesTo: WEB },
  invoicing: { hours: [5, 10], group: 'commerce', appliesTo: ['web_app', 'automation'] },
  // A web app already includes logins in its base; this is for websites.
  user_accounts: { hours: [8, 15], group: 'users', appliesTo: ['website'] },
  admin_dashboard: { hours: [10, 20], group: 'users', appliesTo: ['web_app'] },
  file_uploads: { hours: [3, 6], group: 'users', appliesTo: WEB },
  notifications: { hours: [3, 5], group: 'users', appliesTo: [...WEB, 'automation'] },
  realtime: { hours: [10, 20], group: 'users', appliesTo: ['web_app'] },
  newsletter: { hours: [2, 4], group: 'marketing', appliesTo: ['website'] },
  seo: { hours: [2.5, 3], group: 'marketing', appliesTo: ['website'] },
  analytics: { hours: [2, 3], group: 'marketing', appliesTo: WEB },
  maps: { hours: [1, 1.25], group: 'marketing', appliesTo: ['website'] },
  branding: { hours: [8, 14], group: 'marketing', appliesTo: WEB },
  accessibility: { hours: [5, 10], group: 'technical', appliesTo: WEB },
  data_migration: {
    hours: [5, 12],
    group: 'technical',
    appliesTo: ['website', 'web_app', 'api_integration', 'automation'],
  },
  public_api: { hours: [8, 16], group: 'technical', appliesTo: ['web_app'] },
  pwa: { hours: [6, 12], group: 'technical', appliesTo: ['web_app'] },
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  'content',
  'commerce',
  'users',
  'marketing',
  'technical',
]

/** Features offered for the current selection, in declaration order. */
export function featuresFor(scope: ScopeKey[]): FeatureKey[] {
  return (Object.keys(FEATURES) as FeatureKey[]).filter((key) =>
    FEATURES[key].appliesTo.some((type) => scope.includes(type)),
  )
}

/** Design, content and languages only mean something when there are pages or screens. */
export function hasVisualScope(scope: ScopeKey[]): boolean {
  return scope.includes('website') || scope.includes('web_app')
}

/*
 * ── The estimate ───────────────────────────────────────────────────────────
 */

/**
 * One row of the breakdown. `id` doubles as the message key:
 * calculator.lines.<id> for rule lines, calculator.features.options.<feature>
 * for features. AI lines carry their own (already localised) label.
 */
export type EstimateLine =
  | { kind: 'rule'; id: string; params?: Record<string, number>; hours: Range; cost: Range }
  | { kind: 'feature'; id: FeatureKey; hours: Range; cost: Range }
  | { kind: 'ai'; label: string; reason: string; hours: Range; cost: Range }

export interface EstimatorResult {
  lines: EstimateLine[]
  hours: Range
  cost: Range
  /** Contact-form bracket of the midpoint, kept for the lead email and filters. */
  bracket: BudgetBracket
  estimatedWeeks: Range
  /** Monthly maintenance fee, outside `cost`. 0 when none was picked. */
  monthly: number
  /** The caller renders `calculator.result.rushNote` when this is true. */
  isRush: boolean
  /** True when AI lines are included. */
  aiAdjusted: boolean
}

const roundHours = (h: number) => Math.round(h * 2) / 2
const roundMoney = (euros: number) => Math.round(euros / PRICING.roundTo) * PRICING.roundTo

const scale = ([low, high]: Range, factor: number): Range => [low * factor, high * factor]
const add = (a: Range, b: Range): Range => [a[0] + b[0], a[1] + b[1]]

function line(id: string, hours: Range, params?: Record<string, number>): EstimateLine {
  const rounded: Range = [roundHours(hours[0]), roundHours(hours[1])]
  return { kind: 'rule', id, params, hours: rounded, cost: costOf(rounded) }
}

function costOf(hours: Range): Range {
  return [roundMoney(hours[0] * PRICING.hourlyRate), roundMoney(hours[1] * PRICING.hourlyRate)]
}

function bracketFor(cost: number): BudgetBracket {
  if (cost < 500) return '<500'
  if (cost < 1500) return '500-1500'
  if (cost < 3000) return '1500-3000'
  return '3000+'
}

/** The rule-based lines, before overhead. */
function ruleLines(input: EstimateInput): EstimateLine[] {
  const { scope } = input
  const lines: EstimateLine[] = []
  const isWebsite = scope.includes('website')
  const isApp = scope.includes('web_app')
  const extending = input.startingPoint === 'extend'
  const baseFactor = extending ? HOURS.start.extendBaseFactor : 1

  if (extending) lines.push(line('existingCode', HOURS.start.extendOnboarding))

  if (isWebsite) {
    // A site next to an app shares its hosting and pipeline: half the setup.
    lines.push(line('websiteBase', scale(HOURS.website.base, baseFactor * (isApp ? 0.5 : 1))))
    lines.push(line('pages', scale(HOURS.website.perPage, input.pages), { count: input.pages }))
  }

  if (isApp) {
    lines.push(line('appBase', scale(HOURS.webApp.base, baseFactor)))
    lines.push(
      line('screens', scale(HOURS.webApp.perScreen, input.screens), { count: input.screens }),
    )
    if (input.roles !== 'single')
      lines.push(line(`roles_${input.roles}`, HOURS.webApp.roles[input.roles]))
  }

  if (hasVisualScope(scope)) {
    // Screens reuse more than marketing pages, so they count for half.
    const designUnits = (isWebsite ? input.pages : 0) + (isApp ? input.screens / 2 : 0)
    lines.push(line(`designSystem_${input.design}`, HOURS.design.system[input.design]))
    lines.push(
      line(`designPages_${input.design}`, scale(HOURS.design.perPage[input.design], designUnits), {
        count: Math.ceil(designUnits),
      }),
    )

    if (isWebsite && input.content !== 'ready') {
      lines.push(
        line(`content_${input.content}`, scale(HOURS.content[input.content], input.pages), {
          count: input.pages,
        }),
      )
    }

    if (input.languages > 1) {
      const extra = input.languages - 1
      const units = (isWebsite ? input.pages : 0) + (isApp ? input.screens : 0)
      lines.push(
        line(
          'languages',
          add(HOURS.languages.setup, scale(HOURS.languages.perPage, units * extra)),
          {
            count: input.languages,
          },
        ),
      )
    }

    if (isWebsite && input.startingPoint === 'redesign') {
      lines.push(
        line('redesign', scale(HOURS.start.redesignPerPage, input.pages), { count: input.pages }),
      )
    }
  }

  if (scope.includes('api_integration')) {
    lines.push(
      line(
        'integrations',
        add(HOURS.integration.base, scale(HOURS.integration.perIntegration, input.integrations)),
        {
          count: input.integrations,
        },
      ),
    )
  }

  if (scope.includes('automation')) {
    const perWorkflow = scale(HOURS.automation.perWorkflow[input.automationLevel], input.workflows)
    lines.push(
      line(`workflows_${input.automationLevel}`, add(HOURS.automation.base, perWorkflow), {
        count: input.workflows,
      }),
    )
  }

  const offered = new Set(featuresFor(scope))
  for (const key of new Set(input.features)) {
    if (!offered.has(key)) continue
    const hours = FEATURES[key].hours
    lines.push({ kind: 'feature', id: key, hours, cost: costOf(hours) })
  }

  return lines
}

/**
 * Prices a set of answers, optionally with the extra lines of a (verified)
 * AI analysis. Pure and synchronous: the client runs it live while the
 * visitor answers, and the server re-runs it for the lead email and PDF.
 */
export function estimate(input: EstimateInput, ai?: AiAnalysis | null): EstimatorResult {
  const lines = ruleLines(input)

  for (const item of ai?.extraItems ?? []) {
    const hours: Range = [roundHours(item.hours[0]), roundHours(item.hours[1])]
    lines.push({ kind: 'ai', label: item.label, reason: item.reason, hours, cost: costOf(hours) })
  }

  const buildHours = lines.reduce<Range>((sum, l) => add(sum, l.hours), [0, 0])
  lines.push(
    line('overhead', scale(buildHours, PRICING.overhead), {
      percent: Math.round(PRICING.overhead * 100),
    }),
  )

  const hours = lines.reduce<Range>((sum, l) => add(sum, l.hours), [0, 0])
  // Summing rounded line costs would drift from hours × rate; price the total once.
  const cost = costOf(hours)
  const [slow, fast] = PRICING.weeklyHours

  return {
    lines,
    hours,
    cost,
    // Bracket the midpoint so a wide min/max split doesn't land on a
    // misleadingly optimistic (or pessimistic) bracket.
    bracket: bracketFor((cost[0] + cost[1]) / 2),
    estimatedWeeks: [
      Math.max(1, Math.ceil(hours[0] / fast)),
      Math.max(1, Math.ceil(hours[1] / slow)),
    ],
    monthly: PRICING.maintenance[input.maintenance],
    isRush: input.timeline === 'asap',
    aiAdjusted: lines.some((l) => l.kind === 'ai'),
  }
}

/*
 * ── Published bands ────────────────────────────────────────────────────────
 *
 * The homepage price list, the service pages and the structured data quote a
 * range per project type. Those ranges are not typed in: they are the
 * estimator's own answer for a small and a typical-large project of each
 * type, so a band can never contradict what the calculator says.
 */
interface ScopeDefinition {
  minCost: number
  maxCost: number
  minWeeks: number
  maxWeeks: number
}

const REFERENCE_PROJECTS: Record<ScopeKey, [Partial<EstimateInput>, Partial<EstimateInput>]> = {
  website: [
    { pages: 3, design: 'basic', features: ['contact_form'] },
    { pages: 6, design: 'custom', features: ['contact_form', 'seo', 'analytics'] },
  ],
  web_app: [
    { screens: 3, design: 'basic' },
    { screens: 8, roles: 'few', design: 'custom', features: ['admin_dashboard'] },
  ],
  api_integration: [{ integrations: 1 }, { integrations: 3, features: ['data_migration'] }],
  automation: [
    { workflows: 1, automationLevel: 'simple' },
    { workflows: 3, automationLevel: 'moderate', features: ['notifications'] },
  ],
}

function bandFor(scope: ScopeKey): ScopeDefinition {
  const [small, large] = REFERENCE_PROJECTS[scope].map((overrides) =>
    estimate({ ...DEFAULT_ESTIMATE_INPUT, scope: [scope], ...overrides }),
  )
  return {
    minCost: small.cost[0],
    maxCost: large.cost[1],
    minWeeks: small.estimatedWeeks[0],
    maxWeeks: large.estimatedWeeks[1],
  }
}

export const SCOPE_DEFINITIONS: Record<ScopeKey, ScopeDefinition> = {
  website: bandFor('website'),
  web_app: bandFor('web_app'),
  api_integration: bandFor('api_integration'),
  automation: bandFor('automation'),
}

/*
 * ── Formatting ─────────────────────────────────────────────────────────────
 */

/**
 * Bracket bounds as numbers, not pre-formatted strings.
 *
 * These used to be English-formatted literals ("€1,500 – €3,000"), which put a
 * comma thousands separator in front of Dutch-speaking visitors in both the
 * estimator and the PDF. `null` marks an open end.
 */
const BRACKET_BOUNDS: Record<BudgetBracket, [number | null, number | null]> = {
  '<500': [null, 500],
  '500-1500': [500, 1500],
  '1500-3000': [1500, 3000],
  '3000+': [3000, null],
}

function euros(locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  })
}

/** Locale-aware budget range, e.g. "€500 - €1,500" / "€500 - €1.500". */
export function formatBracket(bracket: BudgetBracket, locale: string): string {
  const money = euros(locale)
  const [min, max] = BRACKET_BOUNDS[bracket]
  if (min === null) return `< ${money.format(max as number)}`
  if (max === null) return `${money.format(min)}+`
  return `${money.format(min)} - ${money.format(max)}`
}

/** "€1.200 - €1.850", or a single amount when both ends agree. */
export function formatCostRange([low, high]: Range, locale: string): string {
  const money = euros(locale)
  return low === high ? money.format(low) : `${money.format(low)} - ${money.format(high)}`
}

export function formatEuro(amount: number, locale: string): string {
  return euros(locale).format(amount)
}

/** "6 - 12" or "6", for hour and week ranges. */
export function formatRange([low, high]: Range, locale: string): string {
  const n = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  return low === high ? n.format(low) : `${n.format(low)} - ${n.format(high)}`
}

type Translate = (key: string, params?: Record<string, string | number>) => string

/** The visitor-facing label of a breakdown row, in whatever locale `t` speaks. */
export function lineLabel(item: EstimateLine, t: Translate): string {
  if (item.kind === 'ai') return item.label
  if (item.kind === 'feature') return t(`calculator.features.options.${item.id}.label`)
  return t(`calculator.lines.${item.id}`, item.params)
}
