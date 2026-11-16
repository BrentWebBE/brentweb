import 'server-only'
import type { Locale } from '@/lib/locales'
import { runtimeEnv } from '@/utilities/runtimeEnv'
import type { EstimateInput, LeadSubmission } from '@/lib/schemas/lead'
import type { WebsiteCheck } from '@/lib/schemas/website-check'
import type { EstimatorResult } from '@/lib/calculator/pricing'
import { maskEmail } from '@/lib/mask-email'

/**
 * Hands a lead to the n8n CRM hub, which files it in Twenty (crm.brentweb.be)
 * as a contact + NEW deal. See ~/n8n/README.md on the server.
 *
 * N8N_LEAD_WEBHOOK_URL is the internal Docker URL
 * (http://n8n:5678/webhook/website-inquiry): n8n's public router refuses
 * /webhook*, so this only works from a container on the `proxy` network.
 * Unset (local dev) means skip: the lead is only logged and emailed. N8N_WEBHOOK_SECRET goes out as
 * X-Webhook-Secret so the flow can reject anything that isn't this site.
 *
 * Server-only on purpose: the browser never sees the URL or the secret.
 */

export type CrmLeadSource = 'contactformulier' | 'schatter' | 'websitecheck'

/**
 * The contract with the n8n flow. Bump `schemaVersion` on any breaking change
 * so the flow can tell old and new payloads apart. v1 was the raw lead object
 * (`{ ...lead, estimate }`, source "contact" | "calculator").
 */
export interface CrmLeadPayload {
  schemaVersion: 2
  source: CrmLeadSource
  name: string
  email: string
  companyWebsite: string | null
  budget: string | null
  timeline: string | null
  message: string | null
  /** Estimator leads only: what was answered and what the server computed. */
  estimator: {
    company: string | null
    answers: EstimateInput
    estimatedRange: { min: number; max: number; currency: 'EUR' }
    hours: { min: number; max: number }
    weeks: { min: number; max: number }
    monthlyMaintenance: number
    aiAdjusted: boolean
  } | null
  /** The page the form was sent from, from the Referer header. */
  pageUrl: string | null
  locale: Locale
  /** ISO 8601, server time. */
  timestamp: string
}

const orNull = (value: string | undefined) => (value ? value : null)

/** Maps a validated contact-form or estimator submission onto the contract. */
export function crmPayloadFromLead(
  lead: LeadSubmission,
  estimate: EstimatorResult | undefined,
  pageUrl: string | null,
): CrmLeadPayload {
  const common = {
    schemaVersion: 2 as const,
    name: lead.name,
    email: lead.email,
    pageUrl,
    locale: lead.locale,
    timestamp: new Date().toISOString(),
  }

  if (lead.source === 'contact') {
    return {
      ...common,
      source: 'contactformulier',
      companyWebsite: orNull(lead.website),
      budget: lead.budget,
      timeline: lead.timeline,
      message: lead.message,
      estimator: null,
    }
  }

  return {
    ...common,
    source: 'schatter',
    companyWebsite: null,
    // The bracket the estimate lands in, in the same keys the contact form's
    // budget field uses, so the CRM can filter both sources on one field.
    budget: estimate?.bracket ?? null,
    timeline: lead.estimate.timeline,
    message: orNull(lead.notes),
    estimator: estimate
      ? {
          company: orNull(lead.company),
          answers: lead.estimate,
          estimatedRange: { min: estimate.cost[0], max: estimate.cost[1], currency: 'EUR' },
          hours: { min: estimate.hours[0], max: estimate.hours[1] },
          weeks: { min: estimate.estimatedWeeks[0], max: estimate.estimatedWeeks[1] },
          monthlyMaintenance: estimate.monthly,
          aiAdjusted: estimate.aiAdjusted,
        }
      : null,
  }
}

/**
 * A website check request. n8n files it as a CRM task (the report is made by
 * hand); the normalized URL travels as companyWebsite, the field the flow already reads
 * for the other sources.
 */
export function crmPayloadFromWebsiteCheck(
  check: WebsiteCheck,
  pageUrl: string | null,
): CrmLeadPayload {
  return {
    schemaVersion: 2,
    source: 'websitecheck',
    name: check.name,
    email: check.email,
    companyWebsite: check.url,
    budget: null,
    timeline: null,
    message: null,
    estimator: null,
    pageUrl,
    locale: check.locale,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Never throws. Resolves true only when n8n accepted the lead, so the caller
 * can tell a lead that is safe in the CRM from one that only exists in a log.
 */
export async function forwardLeadToCrm(payload: CrmLeadPayload): Promise<boolean> {
  const url = runtimeEnv('N8N_LEAD_WEBHOOK_URL')
  if (!url) return false

  const secret = runtimeEnv('N8N_WEBHOOK_SECRET')
  if (!secret)
    console.warn('[crm] N8N_WEBHOOK_SECRET is not set; sending the lead without X-Webhook-Secret')

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'X-Webhook-Secret': secret } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      console.error(
        `[crm] n8n answered ${res.status} for a "${payload.source}" lead (${maskEmail(payload.email)})`,
      )
      return false
    }
    return true
  } catch (error) {
    console.error(
      `[crm] forwarding a "${payload.source}" lead (${maskEmail(payload.email)}) to n8n failed`,
      error,
    )
    return false
  }
}
