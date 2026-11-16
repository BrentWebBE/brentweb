import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { runtimeEnv } from '@/utilities/runtimeEnv'
import type { AiAnalysis, EstimateInput, SignedAiAnalysis } from '@/lib/schemas/lead'

/**
 * The AI analysis is produced by one request (app/(frontend)/next/estimate-ai) and used by
 * later ones (the lead email, the PDF). Rather than store it or pay for a
 * second model call, the server signs it together with the exact answers it
 * was made for; the browser carries both back, and anything edited or
 * re-attached to different answers fails the check and is dropped.
 *
 * Both sides sign the zod-parsed objects, so key order is the schema's and
 * JSON.stringify is stable across the round trip.
 */
function secret(): string | null {
  return runtimeEnv('ESTIMATE_SIGNING_SECRET') || runtimeEnv('ANTHROPIC_API_KEY') || null
}

function digest(key: string, input: EstimateInput, analysis: AiAnalysis): string {
  return createHmac('sha256', key).update(JSON.stringify({ input, analysis })).digest('hex')
}

export function signAnalysis(input: EstimateInput, analysis: AiAnalysis): string | null {
  const key = secret()
  return key ? digest(key, input, analysis) : null
}

/** The analysis if its signature matches `input`, otherwise null. */
export function verifiedAnalysis(
  input: EstimateInput,
  signed: SignedAiAnalysis | undefined,
): AiAnalysis | null {
  const key = secret()
  if (!signed || !key) return null
  const expected = Buffer.from(digest(key, input, signed.analysis), 'hex')
  const actual = Buffer.from(signed.signature, 'hex')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
    ? signed.analysis
    : null
}
