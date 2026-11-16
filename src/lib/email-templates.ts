import 'server-only'
import { getTranslations, type Locale } from '@/i18n'
import type { AiAnalysis, LeadSubmission } from '@/lib/schemas/lead'
import type { EstimatorResult } from '@/lib/calculator/pricing'
import type { WebsiteCheck } from '@/lib/schemas/website-check'
import { formatCostRange, formatEuro, formatRange, lineLabel } from '@/lib/calculator/pricing'

/**
 * Plain HTML string templates rather than @react-email/components — that
 * package (and @react-email/tailwind) were pulled from npm ("no longer
 * supported") the day this was built, so this avoids depending on a
 * flagged package for a one-way transactional email.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * The site's paper palette, as hex: email clients don't read CSS variables or
 * oklch(). Kept close to src/client/theme.css by eye, not by build step.
 */
const MAIL = {
  page: '#f4ede1',
  paper: '#fefcf8',
  ink: '#291f19',
  muted: '#5b5048',
  rule: '#d4c9b9',
  red: '#c22826',
} as const

function wrapper(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:${MAIL.page};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${MAIL.ink};">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:${MAIL.paper};border:1.5px solid ${MAIL.ink};border-radius:14px 22px 16px 20px;padding:32px;box-shadow:3px 4px 0 ${MAIL.ink};">
      <tr><td>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:22px;line-height:1.2;margin:0 0 16px;color:${MAIL.ink};">${escapeHtml(title)}</h1>
        ${bodyHtml}
      </td></tr>
    </table>
  </body>
</html>`
}

function fieldRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:${MAIL.muted};font-size:13px;vertical-align:top;width:120px;">${escapeHtml(label)}</td>
    <td style="padding:6px 0;color:${MAIL.ink};font-size:13px;white-space:pre-wrap;">${escapeHtml(value)}</td>
  </tr>`
}

/** Section heading inside the notification table. */
function headingRow(label: string): string {
  return `<tr><td colspan="2" style="padding:18px 0 6px;border-bottom:1px dashed ${MAIL.rule};color:${MAIL.red};font-size:13px;font-weight:600;">${escapeHtml(label)}</td></tr>`
}

export function renderLeadNotificationEmail(
  input: LeadSubmission,
  estimate?: EstimatorResult,
  ai?: AiAnalysis | null,
): { subject: string; html: string } {
  const rows: string[] = [
    fieldRow('Source', input.source),
    fieldRow('Name', input.name),
    fieldRow('Email', input.email),
    fieldRow('Locale', input.locale),
  ]

  if (input.source === 'contact') {
    // Qualification first: these are what decide whether the lead is worth a
    // call, and they need to survive an email client's preview truncation.
    rows.push(fieldRow('Budget', input.budget))
    rows.push(fieldRow('Timeline', input.timeline))
    if (input.website) rows.push(fieldRow('Website', input.website))
    rows.push(fieldRow('Message', input.message))
  } else {
    const answers = input.estimate
    if (input.company) rows.push(fieldRow('Company', input.company))
    // The headline numbers first, so they survive preview truncation.
    if (estimate) {
      rows.push(
        fieldRow(
          'Estimate',
          `${formatCostRange(estimate.cost, 'nl-BE')} · ${formatRange(estimate.hours, 'en')} h · ${formatRange(estimate.estimatedWeeks, 'en')} weeks${estimate.aiAdjusted ? ' · AI-adjusted' : ''}`,
        ),
      )
      if (estimate.monthly)
        rows.push(
          fieldRow(
            'Maintenance',
            `${answers.maintenance} · ${formatEuro(estimate.monthly, 'nl-BE')}/month`,
          ),
        )
    }
    rows.push(fieldRow('Scope', answers.scope.join(', ')))
    rows.push(fieldRow('Timeline', answers.timeline))
    rows.push(fieldRow('Starting point', answers.startingPoint))
    if (answers.features.length) rows.push(fieldRow('Features', answers.features.join(', ')))
    if (answers.description) rows.push(fieldRow('Description', answers.description))
    if (input.notes) rows.push(fieldRow('Notes', input.notes))

    if (estimate) {
      // English labels: this email is for me, whatever the visitor's locale.
      const { t } = getTranslations('en')
      rows.push(headingRow('Breakdown'))
      for (const line of estimate.lines) {
        rows.push(
          fieldRow(
            `${formatRange(line.hours, 'en')} h`,
            `${line.kind === 'ai' ? '[AI] ' : ''}${lineLabel(line, t)} · ${formatCostRange(line.cost, 'nl-BE')}`,
          ),
        )
      }
    }

    if (ai) {
      rows.push(headingRow(`AI analysis (complexity: ${ai.complexity})`))
      rows.push(fieldRow('Summary', ai.summary))
      if (ai.suggestedFeatures.length)
        rows.push(fieldRow('Suggested', ai.suggestedFeatures.join(', ')))
      if (ai.assumptions.length) rows.push(fieldRow('Assumptions', ai.assumptions.join(' · ')))
      if (ai.risks.length) rows.push(fieldRow('Risks', ai.risks.join(' · ')))
      if (ai.questions.length) rows.push(fieldRow('Ask', ai.questions.join(' · ')))
    }
  }

  const subject =
    input.source === 'contact'
      ? `New contact form lead: ${input.name} · ${input.budget}`
      : `New calculator lead: ${input.name}`

  const html = wrapper(subject, `<table role="presentation" width="100%">${rows.join('')}</table>`)

  return { subject, html }
}

/** To me: a free website check was requested. The report is done by hand. */
export function renderWebsiteCheckNotificationEmail(
  check: WebsiteCheck,
  pageUrl: string | null,
): { subject: string; html: string } {
  const rows = [
    fieldRow('Website', check.url),
    fieldRow('Name', check.name),
    fieldRow('Email', check.email),
    fieldRow('Locale', check.locale),
  ]
  if (pageUrl) rows.push(fieldRow('Page', pageUrl))

  const subject = `New website check: ${new URL(check.url).hostname} (${check.name})`
  const html = wrapper(
    subject,
    `<table role="presentation" width="100%">${rows.join('')}</table>
     <p style="font-size:13px;color:${MAIL.muted};margin-top:16px;">Report (speed, mobile, security) goes to the requester; reply to this email to answer them.</p>`,
  )

  return { subject, html }
}

export function renderLeadConfirmationEmail(
  input: LeadSubmission,
  locale: Locale,
): { subject: string; html: string } {
  const { t } = getTranslations(locale)

  const subject = t('email.confirmationSubject', { name: input.name })
  const body =
    input.source === 'contact'
      ? t('email.confirmationBodyContact')
      : t('email.confirmationBodyCalculator')
  const signature = t('email.confirmationSignature')

  const html = wrapper(
    subject,
    `<p style="font-size:15px;line-height:1.6;color:${MAIL.ink};">${escapeHtml(body)}</p>
     <p style="font-size:15px;color:${MAIL.muted};margin-top:24px;">${escapeHtml(signature)}</p>`,
  )

  return { subject, html }
}
