/**
 * The estimator's optional AI analysis. Lives under /next/* because Payload owns
 * /api/*. GET tells the client whether the AI step is available (ANTHROPIC_API_KEY
 * set); POST runs one analysis and returns it signed.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ESTIMATE_LIMITS, estimateInputSchema } from '@/lib/schemas/lead'
import { defaultLocale, locales } from '@/lib/locales'
import { consume, RATE_LIMITS } from '@/lib/rate-limit'
import { AiEstimateError, analyseEstimate, isAiEnabled } from '@/lib/calculator/ai'
import { signAnalysis } from '@/lib/calculator/signature'
import { clientIp } from '@/lib/client-ip'
import { readJson } from '@/lib/read-json'

const bodySchema = z.object({
  estimate: estimateInputSchema,
  locale: z.enum(locales).default(defaultLocale),
})

// Read per request: the key is injected at container start, after the build.
export const dynamic = 'force-dynamic'

/** Lets the estimator hide the AI panel when no key is configured. */
export function GET() {
  return NextResponse.json({ enabled: isAiEnabled() }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  if (!isAiEnabled()) {
    return NextResponse.json({ error: 'disabled' }, { status: 503 })
  }

  const parsed = bodySchema.safeParse(await readJson(request))
  if (!parsed.success || parsed.data.estimate.description.length < ESTIMATE_LIMITS.descriptionMin) {
    return NextResponse.json({ error: 'validation' }, { status: 400 })
  }

  // After validation, so a malformed request doesn't spend a token: every
  // allowed call here is a paid model request.
  const ip = clientIp(request.headers)
  const { allowed, retryAfterMs } = consume(`${ip}:estimate-ai`, RATE_LIMITS.ai)
  if (!allowed) {
    return NextResponse.json(
      { error: 'rate_limited', retryAfterSeconds: Math.ceil(retryAfterMs / 1000) },
      { status: 429 },
    )
  }

  const { estimate, locale } = parsed.data
  try {
    const analysis = await analyseEstimate(estimate, locale)
    const signature = signAnalysis(estimate, analysis)
    return NextResponse.json({ analysis, signature }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (!(error instanceof AiEstimateError)) console.error('[estimate-ai] analysis failed', error)
    else console.warn('[estimate-ai]', error.message)
    return NextResponse.json({ error: 'failed' }, { status: 502 })
  }
}
