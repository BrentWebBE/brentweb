'use server'

import { headers } from 'next/headers'
import { websiteCheckSchema, type WebsiteCheck } from '@/lib/schemas/website-check'
import { consume, RATE_LIMITS } from '@/lib/rate-limit'
import { crmPayloadFromWebsiteCheck, forwardLeadToCrm } from '@/lib/crm'
import { clientIp } from '@/lib/client-ip'
import { maskEmail } from '@/lib/mask-email'
import { saveLead } from '@/lib/leads'
import { leadFrom, leadTo, sendMail } from '@/lib/resend'
import { renderWebsiteCheckNotificationEmail } from '@/lib/email-templates'

export type SubmitWebsiteCheckResult =
  | { ok: true }
  | { ok: false; error: 'validation'; fieldErrors: Record<string, string[]> }
  | { ok: false; error: 'rate_limited'; retryAfterSeconds: number }
  | { ok: false; error: 'delivery_failed' }

/**
 * Validates the request, emails it to me and hands it to n8n, which files it in
 * the CRM as a task. Nothing is scanned here or in n8n: the report is made by
 * hand. This server only checks that the URL is a plausible public website
 * (lib/schemas/website-check.ts).
 */
export async function submitWebsiteCheck(input: unknown): Promise<SubmitWebsiteCheckResult> {
  const parsed = websiteCheckSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'validation',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }
  const check = parsed.data

  // Honeypot: same treatment as submitLead — pretend success, send nothing.
  if (check.honeypot) {
    console.warn(`[website-check] honeypot triggered (${maskEmail(check.email)})`)
    return { ok: true }
  }

  const headerList = await headers()
  const ip = clientIp(headerList)
  const { allowed, retryAfterMs } = consume(`${ip}:websitecheck`, RATE_LIMITS.websitecheck)
  if (!allowed) {
    return { ok: false, error: 'rate_limited', retryAfterSeconds: Math.ceil(retryAfterMs / 1000) }
  }

  const pageUrl = headerList.get('referer')?.slice(0, 2000) || null

  // Same rule as the lead forms: email, CRM and the admin's Leads list are
  // independent, and any one of them on its own means I will see the request.
  const crmPayload = crmPayloadFromWebsiteCheck(check, pageUrl)
  const [emailDelivered, crmDelivered] = await Promise.all([
    sendNotification(check, pageUrl),
    forwardLeadToCrm(crmPayload),
  ])
  const saved = await saveLead(crmPayload, { email: emailDelivered, crm: crmDelivered })
  return emailDelivered || crmDelivered || saved
    ? { ok: true }
    : { ok: false, error: 'delivery_failed' }
}

/** Notification to me. Never throws. */
async function sendNotification(check: WebsiteCheck, pageUrl: string | null): Promise<boolean> {
  try {
    const { subject, html } = renderWebsiteCheckNotificationEmail(check, pageUrl)
    return await sendMail(
      { from: leadFrom(), to: leadTo(), subject, html, replyTo: check.email },
      'website-check',
    )
  } catch (error) {
    console.error('[website-check] rendering the notification failed', error)
    return false
  }
}
