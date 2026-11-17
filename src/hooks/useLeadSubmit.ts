'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations, useLocale } from '@/hooks/useTranslations'
import { systemHref } from '@/lib/routing'
import { submitLead, type SubmitLeadResult } from '@/actions/submit-lead'
import { sendEvent } from '@/lib/analytics'
import type { LeadSubmission } from '@/lib/schemas/lead'

/**
 * Sends a lead through the server action. Success goes to the thank-you page,
 * whose job is the next step (booking a call); failures stay on the form as a
 * toast. `copy` is the message namespace holding rateLimited / error.
 */
export function useLeadSubmit(copy: 'contact.form' | 'calculator.lead') {
  const { t } = useTranslations()
  const { locale } = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const submit = (values: LeadSubmission) => {
    startTransition(async () => {
      let result: SubmitLeadResult
      try {
        result = await submitLead(values)
      } catch {
        // The action itself never throws; this is the request failing
        // (offline, deploy mid-flight, server crash).
        toast.error(t(`${copy}.error`))
        return
      }

      if (result.ok) {
        // Fired here, after the server confirmed the lead, rather than on the
        // submit button: an invalid or failed attempt is not a conversion,
        // and this runs once per lead.
        sendEvent(copy === 'contact.form' ? 'form-contact' : 'form-schatter')
        router.push(systemHref(locale, 'thankYou'))
        return
      }

      toast.error(t(result.error === 'rate_limited' ? `${copy}.rateLimited` : `${copy}.error`))
    })
  }

  return { submit, isPending }
}
