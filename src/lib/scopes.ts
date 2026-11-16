import { l } from '@/utilities/label'

/**
 * The estimator's scope keys (ScopeKey in lib/schemas/lead.ts), as select options for
 * blocks that show a price range. Kept free of the pricing table itself, so the
 * Payload config doesn't import zod schemas.
 */
export const SCOPE_KEYS = ['website', 'web_app', 'api_integration', 'automation'] as const

export const SCOPE_OPTIONS = [
  { label: l('Website', 'Website'), value: 'website' },
  { label: l('Webapplicatie', 'Web application'), value: 'web_app' },
  { label: l('Koppeling (API)', 'API integration'), value: 'api_integration' },
  { label: l('Automatisering', 'Automation'), value: 'automation' },
]
