import { z } from 'zod'
import { locales } from '@/lib/locales'

/**
 * Shared by both the contact form and the calculator. Kept in a plain module
 * (no 'use server') because it's imported client-side for zodResolver too.
 */

export const SCOPE_KEYS = ['website', 'web_app', 'api_integration', 'automation'] as const
export type ScopeKey = (typeof SCOPE_KEYS)[number]

export const TIMELINE_KEYS = ['asap', '1-3m', '3-6m', '6m-plus', 'not-sure'] as const
export type TimelineKey = (typeof TIMELINE_KEYS)[number]

/*
 * Estimator inputs. Each list is the single source for both the zod schema
 * below and the option cards in components/calculator, and the matching hour
 * figures live in lib/calculator/pricing.ts keyed by the same values.
 */
export const STARTING_POINTS = ['new', 'redesign', 'extend'] as const
export type StartingPoint = (typeof STARTING_POINTS)[number]

export const DESIGN_LEVELS = ['basic', 'custom', 'premium'] as const
export type DesignLevel = (typeof DESIGN_LEVELS)[number]

export const CONTENT_LEVELS = ['ready', 'polish', 'write'] as const
export type ContentLevel = (typeof CONTENT_LEVELS)[number]

export const ROLE_LEVELS = ['single', 'few', 'many'] as const
export type RoleLevel = (typeof ROLE_LEVELS)[number]

export const AUTOMATION_LEVELS = ['simple', 'moderate', 'complex'] as const
export type AutomationLevel = (typeof AUTOMATION_LEVELS)[number]

export const MAINTENANCE_PLANS = ['none', 'basic', 'active'] as const
export type MaintenancePlan = (typeof MAINTENANCE_PLANS)[number]

export const FEATURE_KEYS = [
  'contact_form',
  'cms',
  'blog',
  'gallery',
  'search',
  'webshop',
  'payments',
  'booking',
  'invoicing',
  'user_accounts',
  'admin_dashboard',
  'file_uploads',
  'notifications',
  'realtime',
  'newsletter',
  'seo',
  'analytics',
  'maps',
  'accessibility',
  'data_migration',
  'public_api',
  'pwa',
  'branding',
] as const
export type FeatureKey = (typeof FEATURE_KEYS)[number]

/** Bounds for the numeric inputs, shared by the steppers and the schema. */
export const ESTIMATE_LIMITS = {
  pages: { min: 1, max: 40 },
  screens: { min: 1, max: 40 },
  integrations: { min: 1, max: 10 },
  workflows: { min: 1, max: 10 },
  languages: { min: 1, max: 4 },
  description: 2000,
  /** Shortest description worth sending to the AI analysis. */
  descriptionMin: 20,
} as const

const count = (bounds: { min: number; max: number }) =>
  z.number().int().min(bounds.min).max(bounds.max)

/**
 * Everything the estimator asks. The server re-validates this and recomputes
 * the price from it; no client-computed figure is ever trusted.
 *
 * Fields for a project type that isn't selected are still sent (they keep
 * their defaults) and simply contribute nothing in estimate().
 */
export const estimateInputSchema = z.object({
  scope: z.array(z.enum(SCOPE_KEYS)).min(1, 'Pick at least one scope item'),
  startingPoint: z.enum(STARTING_POINTS),
  pages: count(ESTIMATE_LIMITS.pages),
  screens: count(ESTIMATE_LIMITS.screens),
  roles: z.enum(ROLE_LEVELS),
  integrations: count(ESTIMATE_LIMITS.integrations),
  workflows: count(ESTIMATE_LIMITS.workflows),
  automationLevel: z.enum(AUTOMATION_LEVELS),
  design: z.enum(DESIGN_LEVELS),
  content: z.enum(CONTENT_LEVELS),
  languages: count(ESTIMATE_LIMITS.languages),
  features: z.array(z.enum(FEATURE_KEYS)).max(FEATURE_KEYS.length),
  maintenance: z.enum(MAINTENANCE_PLANS),
  timeline: z.enum(TIMELINE_KEYS),
  // Free text for the optional AI analysis; it never changes the rule-based
  // price on its own.
  description: z.string().trim().max(ESTIMATE_LIMITS.description),
})
export type EstimateInput = z.infer<typeof estimateInputSchema>

export const DEFAULT_ESTIMATE_INPUT: EstimateInput = {
  scope: [],
  startingPoint: 'new',
  pages: 5,
  screens: 6,
  roles: 'single',
  integrations: 1,
  workflows: 1,
  automationLevel: 'simple',
  design: 'custom',
  content: 'ready',
  languages: 1,
  features: [],
  maintenance: 'none',
  timeline: 'not-sure',
  description: '',
}

export const AI_COMPLEXITY = ['low', 'medium', 'high'] as const

/**
 * The AI analysis as it travels between server and client. Produced only by
 * app/(frontend)/next/estimate-ai after clamping, and HMAC-signed together with the input
 * it was made for (lib/calculator/signature.ts), so a lead or PDF request can
 * carry it without the server having to trust the browser.
 */
export const aiAnalysisSchema = z.object({
  summary: z.string().max(1200),
  complexity: z.enum(AI_COMPLEXITY),
  extraItems: z
    .array(
      z.object({
        label: z.string().max(120),
        reason: z.string().max(400),
        hours: z.tuple([z.number().min(0), z.number().min(0)]),
      }),
    )
    .max(6),
  suggestedFeatures: z.array(z.enum(FEATURE_KEYS)).max(FEATURE_KEYS.length),
  assumptions: z.array(z.string().max(300)).max(5),
  risks: z.array(z.string().max(300)).max(5),
  questions: z.array(z.string().max(300)).max(5),
})
export type AiAnalysis = z.infer<typeof aiAnalysisSchema>

export const signedAiAnalysisSchema = z.object({
  analysis: aiAnalysisSchema,
  signature: z.string().regex(/^[0-9a-f]{64}$/),
})
export type SignedAiAnalysis = z.infer<typeof signedAiAnalysisSchema>

/**
 * Budget brackets offered on the contact form, scaled to what a
 * student-zelfstandige actually charges — small sites and fixes at the bottom,
 * a full application at the top. The first four are the same brackets the
 * calculator computes: `lib/calculator/pricing.ts` derives its `BudgetBracket`
 * from this list via Exclude<>, so the two cannot drift. They live here rather
 * than in pricing.ts because pricing.ts already imports from this module.
 */
export const BUDGET_KEYS = ['<500', '500-1500', '1500-3000', '3000+', 'not-sure'] as const
export type BudgetKey = (typeof BUDGET_KEYS)[number]

const baseLeadFields = {
  name: z.string().trim().min(2, 'Name is too short').max(100),
  email: z.string().trim().email('Enter a valid email address').max(200),
  // Honeypot: real visitors never see or fill this field. Any non-empty value
  // means a bot filled every field it could find — see submitLead's handling.
  honeypot: z.string().max(0).optional().default(''),
  // boolean (not z.literal(true)) so react-hook-form's checkbox state — which
  // is a plain boolean while unchecked — type-checks; refine enforces truthy.
  gdprConsent: z
    .boolean()
    .refine((v) => v === true, { message: 'Consent is required to submit this form' }),
  locale: z.enum(locales),
}

const contactLeadSchema = z.object({
  source: z.literal('contact'),
  ...baseLeadFields,
  message: z.string().trim().min(10, 'Tell me a bit more').max(5000),
  // Free text on purpose: people type "mijnzaak.be", not a full URL, and a
  // strict check would reject a lead over a missing https://.
  website: z.string().trim().max(200).optional(),
  // Qualification fields. The site only speaks to businesses now (the old
  // engineering path is gone), so both are always required.
  budget: z.enum(BUDGET_KEYS, { errorMap: () => ({ message: 'Select a budget range' }) }),
  timeline: z.enum(TIMELINE_KEYS, { errorMap: () => ({ message: 'Select a timeline' }) }),
})
export type ContactLead = z.infer<typeof contactLeadSchema>

/** Client-side resolver schema; the same object the server validates with. */
export const contactLeadFormSchema = contactLeadSchema

export const calculatorLeadSchema = z.object({
  source: z.literal('calculator'),
  ...baseLeadFields,
  company: z.string().trim().max(200).optional(),
  estimate: estimateInputSchema,
  // Deliberately no price field here: the server always recomputes the
  // estimate from these inputs via lib/calculator/pricing.ts rather than
  // trusting a client-supplied figure in the lead email. The AI analysis is
  // only used when its signature matches `estimate`.
  ai: signedAiAnalysisSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
})
export type CalculatorLead = z.infer<typeof calculatorLeadSchema>

export const leadSubmissionSchema = z.discriminatedUnion('source', [
  contactLeadSchema,
  calculatorLeadSchema,
])
export type LeadSubmission = z.infer<typeof leadSubmissionSchema>
