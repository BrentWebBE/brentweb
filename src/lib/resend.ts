import 'server-only'
import { Resend, type CreateEmailOptions } from 'resend'
import { maskEmail } from '@/lib/mask-email'
import { runtimeEnv } from '@/utilities/runtimeEnv'

/**
 * Requires RESEND_API_KEY and a verified sending domain (SPF/DKIM/DMARC) for the
 * sender's domain — both manual prerequisites, not something code can set up.
 *
 * Constructed lazily (not at module scope): the Resend constructor throws
 * synchronously when the API key is missing, and this module is reachable from the
 * 'use server' actions referenced by every page that renders a lead form — a
 * module-scope throw here would crash those pages outright.
 */
let client: Resend | null = null
let clientKey: string | null = null

/** Null when RESEND_API_KEY is not set. */
function getResendClient(): Resend | null {
  const key = runtimeEnv('RESEND_API_KEY')
  if (!key) return null
  if (!client || clientKey !== key) {
    client = new Resend(key)
    clientKey = key
  }
  return client
}

/** Sender of every lead email. Overridable per container. */
export const leadFrom = (): string =>
  runtimeEnv('LEAD_FROM_EMAIL') || 'BrentWeb Leads <leads@brentweb.eu>'

/** Where lead notifications go. Overridable per container. */
export const leadTo = (): string => runtimeEnv('LEAD_NOTIFICATION_EMAIL') || 'brent@brentweb.be'

/**
 * Sends one email. Never throws; resolves true when the email was accepted.
 *
 * Without RESEND_API_KEY the email is logged instead. Outside production that counts
 * as delivered, so the forms work in local dev without a key. In production it does
 * not: a lead that only exists in a log line must surface as a failure (unless the CRM
 * webhook took it).
 */
export async function sendMail(email: CreateEmailOptions, tag: string): Promise<boolean> {
  const resend = getResendClient()
  if (!resend) {
    const to = Array.isArray(email.to) ? email.to.join(', ') : email.to
    if (process.env.NODE_ENV === 'production') {
      console.error(
        `[${tag}] RESEND_API_KEY is not set; "${email.subject}" to ${maskEmail(to)} was not sent`,
      )
      return false
    }
    console.info(`[${tag}] RESEND_API_KEY is not set; would send "${email.subject}" to ${to}`)
    return true
  }

  try {
    const { error } = await resend.emails.send(email)
    if (error) {
      console.error(`[${tag}] Resend returned an error`, error)
      return false
    }
    return true
  } catch (error) {
    console.error(`[${tag}] sending "${email.subject}" failed`, error)
    return false
  }
}
