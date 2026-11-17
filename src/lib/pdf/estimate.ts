import 'server-only'
import { createElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { EstimatePdfDocument } from '@/components/calculator/EstimatePdfDocument'
import { estimate as computeEstimate } from '@/lib/calculator/pricing'
import type { AiAnalysis, EstimateInput } from '@/lib/schemas/lead'
import { getMessages, getTranslations, type Locale } from '@/i18n'

interface RenderEstimatePdfInput {
  name: string
  input: EstimateInput
  /** Only pass an analysis that has passed verifiedAnalysis(). */
  ai: AiAnalysis | null
  /** Drives both the document copy and the generated-on date format. */
  locale: Locale
}

/**
 * Single shared builder consumed by both the calculator's download route
 * and the lead-confirmation email attachment, so the two never drift.
 */
export async function renderEstimatePdf({
  name,
  input,
  ai,
  locale,
}: RenderEstimatePdfInput): Promise<Buffer> {
  const result = computeEstimate(input, ai)
  const generatedAt = new Date().toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const doc = createElement(EstimatePdfDocument, {
    name,
    input,
    result,
    ai,
    generatedAt,
    messages: getMessages(locale),
    t: getTranslations(locale).t,
    locale,
  })

  return renderToBuffer(doc as Parameters<typeof renderToBuffer>[0])
}
