'use server'

import { headers } from 'next/headers'
import { leadSubmissionSchema, type AiAnalysis, type LeadSubmission } from '@/lib/schemas/lead'
import { consume, RATE_LIMITS } from '@/lib/rate-limit'
import { leadFrom, leadTo, sendMail } from '@/lib/resend'
import { renderLeadNotificationEmail, renderLeadConfirmationEmail } from '@/lib/email-templates'
import { estimate, type EstimatorResult } from '@/lib/calculator/pricing'
import { renderEstimatePdf } from '@/lib/pdf/estimate'
import { crmPayloadFromLead, forwardLeadToCrm } from '@/lib/crm'
import { verifiedAnalysis } from '@/lib/calculator/signature'
import { clientIp } from '@/lib/client-ip'
import { maskEmail } from '@/lib/mask-email'

export type SubmitLeadResult =
  | { ok: true }
  | { ok: false; error: 'validation'; fieldErrors: Record<string, string[]> }
  | { ok: false; error: 'rate_limited'; retryAfterSeconds: number }
  | { ok: false; error: 'delivery_failed' }

export async function submitLead(input: unknown): Promise<SubmitLeadResult> {
  const parsed = leadSubmissionSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'validation',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }
  const lead = parsed.data

  // Honeypot: real visitors never see or fill this field. Any value here
  // means a bot filled every field it could find. Pretend success and send
  // nothing — an explicit rejection would teach scrapers to detect the trap.
  if (lead.honeypot) {
    console.warn(
      `[submit-lead] honeypot triggered on a "${lead.source}" submission (${maskEmail(lead.email)})`,
    )
    return { ok: true }
  }

  const headerList = await headers()
  const ip = clientIp(headerList)
  const { allowed, retryAfterMs } = consume(`${ip}:${lead.source}`, RATE_LIMITS[lead.source])
  if (!allowed) {
    return { ok: false, error: 'rate_limited', retryAfterSeconds: Math.ceil(retryAfterMs / 1000) }
  }

  // Only an analysis signed for exactly these answers is used; anything else
  // falls back to the rule-based estimate.
  const ai = lead.source === 'calculator' ? verifiedAnalysis(lead.estimate, lead.ai) : null
  const estimateResult = lead.source === 'calculator' ? estimate(lead.estimate, ai) : undefined

  // The page the form was sent from. Same-origin requests carry the full URL
  // under a strict-origin-when-cross-origin referrer policy.
  const pageUrl = headerList.get('referer')?.slice(0, 2000) || null

  // Email and CRM are independent: either one on its own means the lead is
  // safe somewhere I will see it, so a hiccup in one must not lose the other
  // or turn a captured lead into an error for the visitor.
  const [emailDelivered, crmDelivered] = await Promise.all([
    sendLeadEmails(lead, estimateResult, ai),
    forwardLeadToCrm(crmPayloadFromLead(lead, estimateResult, pageUrl)),
  ])

  if (!emailDelivered && !crmDelivered) {
    return { ok: false, error: 'delivery_failed' }
  }
  return { ok: true }
}

/**
 * Notification to me plus confirmation to the lead. Never throws. Resolves true when
 * the notification (the copy that matters for not losing the lead) went out.
 */
async function sendLeadEmails(
  lead: LeadSubmission,
  estimateResult: EstimatorResult | undefined,
  ai: AiAnalysis | null,
): Promise<boolean> {
  try {
    const notification = renderLeadNotificationEmail(lead, estimateResult, ai)
    const confirmation = renderLeadConfirmationEmail(lead, lead.locale)

    const confirmationAttachments =
      lead.source === 'calculator'
        ? [
            {
              filename: 'project-estimate.pdf',
              content: await renderEstimatePdf({
                name: lead.name,
                input: lead.estimate,
                ai,
                // The confirmation email is already rendered in the lead's
                // locale; the attached PDF has to match it.
                locale: lead.locale,
              }),
            },
          ]
        : undefined

    const from = leadFrom()
    const [notificationSent, confirmationSent] = await Promise.all([
      sendMail(
        {
          from,
          to: leadTo(),
          subject: notification.subject,
          html: notification.html,
          replyTo: lead.email,
        },
        'submit-lead',
      ),
      sendMail(
        {
          from,
          to: lead.email,
          subject: confirmation.subject,
          html: confirmation.html,
          attachments: confirmationAttachments,
        },
        'submit-lead',
      ),
    ])

    return notificationSent && confirmationSent
  } catch (error) {
    console.error('[submit-lead] rendering the lead emails failed', error)
    return false
  }
}
