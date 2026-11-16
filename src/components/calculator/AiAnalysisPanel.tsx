'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from '@/hooks/useTranslations'
import type { Locale } from '@/lib/locales'
import {
  ESTIMATE_LIMITS,
  type AiAnalysis,
  type EstimateInput,
  type FeatureKey,
} from '@/lib/schemas/lead'
import { estimatorClasses } from '@/components/calculator/controls'
import type { AiState } from '@/components/calculator/CostEstimator'

type Status = 'idle' | 'running' | 'error' | 'rateLimited'

/** The estimator's AI endpoint. Not under /api: Payload owns that prefix. */
export const ESTIMATE_AI_URL = '/next/estimate-ai'

/**
 * Sends the answers and description to the estimate-ai route and shows what
 * came back. Only explicit: nothing reaches Anthropic until the visitor
 * clicks, which is also what the privacy policy promises.
 */
export function AiAnalysisPanel({
  locale,
  input,
  inputKey,
  ai,
  isCurrent,
  onResult,
  onAddFeatures,
  onEditDescription,
}: {
  locale: Locale
  input: EstimateInput
  inputKey: string
  ai: AiState | null
  isCurrent: boolean
  onResult: (state: AiState) => void
  onAddFeatures: (features: FeatureKey[]) => void
  onEditDescription: () => void
}) {
  const { t } = useTranslations()
  const [status, setStatus] = useState<Status>('idle')
  // The API key only exists at container start, so availability is asked at
  // runtime. Without a key the whole panel stays hidden.
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(ESTIMATE_AI_URL)
      .then((response) => (response.ok ? response.json() : { enabled: false }))
      .then((data: { enabled: boolean }) => !cancelled && setEnabled(data.enabled))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  const hasDescription = input.description.trim().length >= ESTIMATE_LIMITS.descriptionMin

  const run = async () => {
    setStatus('running')
    try {
      const response = await fetch(ESTIMATE_AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimate: input, locale }),
      })
      if (response.status === 429) {
        setStatus('rateLimited')
        return
      }
      if (!response.ok) throw new Error(`AI request failed with status ${response.status}`)
      const data = (await response.json()) as { analysis: AiAnalysis; signature: string | null }
      onResult({ ...data, forInput: inputKey })
      setStatus('idle')
    } catch (error) {
      console.error('[calculator] AI analysis failed', error)
      setStatus('error')
    }
  }

  const analysis = ai?.analysis
  if (!enabled) return null

  return (
    <section
      className="paper-sheet mt-12 p-6 sm:p-8"
      aria-labelledby="estimator-ai-title"
      aria-busy={status === 'running'}
    >
      <h3 id="estimator-ai-title" className={estimatorClasses.title}>
        {t('calculator.ai.title')}
      </h3>
      <p className={estimatorClasses.description}>{t('calculator.ai.intro')}</p>

      {!hasDescription ? (
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <p className={estimatorClasses.help}>{t('calculator.ai.needDescription')}</p>
          <button type="button" className="btn btn-ghost" onClick={onEditDescription}>
            ← {t('calculator.back')}
          </button>
        </div>
      ) : (
        <>
          {ai && !isCurrent && <p className="small mt-4">{t('calculator.ai.stale')}</p>}

          {(!ai || !isCurrent) && (
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="btn btn-primary"
                onClick={run}
                disabled={status === 'running'}
              >
                {status === 'running' && <Loader2 aria-hidden className="size-4 animate-spin" />}
                {status === 'running'
                  ? t('calculator.ai.running')
                  : ai
                    ? t('calculator.ai.rerun')
                    : t('calculator.ai.run')}
              </button>
              <p className={`${estimatorClasses.help} max-w-md`}>{t('calculator.ai.privacy')}</p>
            </div>
          )}

          {status === 'error' && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {t('calculator.ai.error')}
            </p>
          )}
          {status === 'rateLimited' && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {t('calculator.ai.rateLimited')}
            </p>
          )}
        </>
      )}

      {analysis && isCurrent && (
        <div className="mt-8 grid gap-7">
          <div>
            <h4 className="flex flex-wrap items-center gap-3 font-heading text-xl">
              {t('calculator.ai.summaryTitle')}
              <span className="rounded-full bg-[var(--color-paper-2)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-ink-2)]">
                {t('calculator.ai.complexityLabel')}:{' '}
                {t(`calculator.ai.complexity.${analysis.complexity}`)}
              </span>
            </h4>
            <p className="mt-2">{analysis.summary}</p>
          </div>

          <div>
            <h4 className={estimatorClasses.subTitle}>{t('calculator.ai.extraTitle')}</h4>
            {analysis.extraItems.length === 0 ? (
              <p className="mt-2">{t('calculator.ai.noExtra')}</p>
            ) : (
              <ul className={estimatorClasses.list}>
                {analysis.extraItems.map((item) => (
                  <li key={item.label}>
                    <strong>{item.label}</strong>: {item.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {analysis.suggestedFeatures.length > 0 && (
            <div>
              <h4 className={estimatorClasses.subTitle}>{t('calculator.ai.suggestedTitle')}</h4>
              <ul className={estimatorClasses.list}>
                {analysis.suggestedFeatures.map((key) => (
                  <li key={key}>{t(`calculator.features.options.${key}.label`)}</li>
                ))}
              </ul>
              {/* Changes the answers, so the analysis goes stale and asks to be re-run. */}
              <button
                type="button"
                className="btn btn-ghost mt-4"
                onClick={() => onAddFeatures(analysis.suggestedFeatures)}
              >
                {t('calculator.ai.addSuggested')}
              </button>
            </div>
          )}

          <AiList title={t('calculator.ai.risksTitle')} items={analysis.risks} />
          <AiList title={t('calculator.ai.assumptionsTitle')} items={analysis.assumptions} />
          <AiList title={t('calculator.ai.questionsTitle')} items={analysis.questions} />
        </div>
      )}
    </section>
  )
}

function AiList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <h4 className={estimatorClasses.subTitle}>{title}</h4>
      <ul className={estimatorClasses.list}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
