import 'server-only'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import type { CrmLeadPayload } from '@/lib/crm'
import { maskEmail } from '@/lib/mask-email'

/**
 * Saves a lead in the Payload admin (collection "leads"), with whether the e-mail and
 * the CRM hand-off worked. Never throws. Resolves true when the lead is stored, so the
 * caller can count it as captured even if both other channels failed.
 */
export async function saveLead(
  lead: CrmLeadPayload,
  delivery: { email: boolean; crm: boolean },
): Promise<boolean> {
  try {
    const payload = await getPayload({ config: configPromise })
    await payload.create({
      collection: 'leads',
      overrideAccess: true,
      data: {
        name: lead.name,
        email: lead.email,
        source: lead.source,
        companyWebsite: lead.companyWebsite,
        budget: lead.budget,
        timeline: lead.timeline,
        message: lead.message,
        estimator: lead.estimator,
        locale: lead.locale,
        pageUrl: lead.pageUrl,
        status: 'new',
        delivery,
      },
    })
    return true
  } catch (error) {
    console.error(`[leads] saving a "${lead.source}" lead (${maskEmail(lead.email)}) failed`, error)
    return false
  }
}
