/**
 * The estimate as a PDF download. Lives under /next/* because Payload owns /api/*.
 * The price is recomputed here from the answers; no client figure is trusted.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { estimateInputSchema, signedAiAnalysisSchema } from '@/lib/schemas/lead'
import { defaultLocale, locales } from '@/lib/locales'
import { renderEstimatePdf } from '@/lib/pdf/estimate'
import { verifiedAnalysis } from '@/lib/calculator/signature'
import { consume, RATE_LIMITS } from '@/lib/rate-limit'
import { clientIp } from '@/lib/client-ip'
import { readJson } from '@/lib/read-json'

const bodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  estimate: estimateInputSchema,
  ai: signedAiAnalysisSchema.optional(),
  // Defaulted rather than required so an older client (or a bookmarked
  // request) still gets a valid PDF instead of a 400.
  locale: z.enum(locales).default(defaultLocale),
})

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const ip = clientIp(request.headers)
  const { allowed } = consume(`${ip}:pdf-download`, RATE_LIMITS.calculator)
  if (!allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const parsed = bodySchema.safeParse(await readJson(request))
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation' }, { status: 400 })
  }

  const { name, estimate, ai, locale } = parsed.data
  // An analysis that doesn't match these answers is dropped, not rejected:
  // the visitor still gets the rule-based PDF.
  const pdf = await renderEstimatePdf({
    name,
    input: estimate,
    ai: verifiedAnalysis(estimate, ai),
    locale,
  })

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="project-estimate.pdf"',
      'Cache-Control': 'no-store',
    },
  })
}
