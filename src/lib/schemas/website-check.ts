import { z } from 'zod'
import { locales } from '@/lib/locales'

/**
 * The free website check form. Plain module (no 'use server') because the
 * client resolver uses it too; the server action re-validates with it.
 *
 * Error messages are message keys under `websiteCheck.errors`, so the form
 * can show them in the visitor's language.
 */

// Names that never resolve to a public website. The scan itself happens in
// n8n, which must still resolve the hostname and refuse private addresses:
// a public name can point at 127.0.0.1, and only a DNS lookup can tell.
const NON_PUBLIC_HOST =
  /(^|\.)(localhost|local|internal|intranet|lan|home|corp|test|example|invalid|onion)$/i
const PUBLIC_TLD = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/

/**
 * Turns what a visitor types ("mijnzaak.be", "https://www.mijnzaak.be/menu")
 * into an absolute http(s) URL, or null when it can't be a public website.
 * Rejects IP addresses, explicit ports and embedded credentials, so the form
 * can't be used to point the scanner at something internal.
 */
export function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed || trimmed.length > 500) return null

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return null
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  // Embedded credentials (user:pass@host) or an explicit port. Written as a
  // list because `url.password || url.port` reads as "password = url.port"
  // to generic secret scanners (GitGuardian, GitHub), a false positive.
  if ([url.port, url.username, url.password].some(Boolean)) return null

  // Checked after parsing: the URL parser already rewrote shorthand and hex
  // IPv4 forms (0x7f.1, 2130706433) to dotted decimal, so they land here.
  const host = url.hostname.toLowerCase()
  if (host.startsWith('[') || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null
  if (!host.includes('.') || NON_PUBLIC_HOST.test(host)) return null
  if (!PUBLIC_TLD.test(host.split('.').pop() ?? '')) return null

  url.hash = ''
  return url.href
}

export const websiteCheckSchema = z.object({
  url: z.string().transform((value, ctx) => {
    const normalized = normalizeWebsiteUrl(value)
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'url_invalid' })
      return z.NEVER
    }
    return normalized
  }),
  name: z.string().trim().min(2, 'name_short').max(100, 'name_short'),
  email: z.string().trim().email('email_invalid').max(200, 'email_invalid'),
  // Honeypot. Deliberately no .max(0): a filled-in value must pass validation
  // so the server can answer a bot with a convincing success.
  honeypot: z.string().max(200).optional().default(''),
  gdprConsent: z.boolean().refine((v) => v === true, { message: 'consent_required' }),
  locale: z.enum(locales),
})

export type WebsiteCheckInput = z.input<typeof websiteCheckSchema>
export type WebsiteCheck = z.output<typeof websiteCheckSchema>
