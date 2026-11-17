'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from '@/hooks/useTranslations'
import { DEFAULT_ESTIMATE_INPUT, type AiAnalysis, type EstimateInput } from '@/lib/schemas/lead'
import { estimate, formatCostRange, formatRange, hasVisualScope } from '@/lib/calculator/pricing'
import { cn } from '@/utilities/ui'
import { ScopeStep } from '@/components/calculator/ScopeStep'
import { DetailsStep } from '@/components/calculator/DetailsStep'
import { DesignStep } from '@/components/calculator/DesignStep'
import { FeaturesStep } from '@/components/calculator/FeaturesStep'
import { ExtrasStep } from '@/components/calculator/ExtrasStep'
import { BudgetOutput } from '@/components/calculator/BudgetOutput'
import { AiAnalysisPanel } from '@/components/calculator/AiAnalysisPanel'
import { LeadCaptureStep } from '@/components/calculator/LeadCaptureStep'
import { sendEvent } from '@/lib/analytics'

type StepKey = 'type' | 'details' | 'design' | 'features' | 'extras' | 'result'

/** An analysis plus the exact answers it was made for (and signed against). */
export interface AiState {
  analysis: AiAnalysis
  signature: string | null
  forInput: string
}

/**
 * The project estimator: a few questions, a live price range, an optional AI
 * second opinion and a lead form that mails the estimate as a PDF. Needs a
 * LocaleProvider above it (the locale comes from there) and the Toaster somewhere
 * on the page.
 */
export function CostEstimator({ className }: { className?: string }) {
  const { t } = useTranslations()
  const { locale } = useLocale()
  const [input, setInput] = useState<EstimateInput>(DEFAULT_ESTIMATE_INPUT)
  const [stepKey, setStepKey] = useState<StepKey>('type')
  const [ai, setAi] = useState<AiState | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)

  // Design and content only exist for sites and apps; integration- or
  // automation-only projects skip that step entirely.
  const steps = useMemo<StepKey[]>(
    () =>
      (['type', 'details', 'design', 'features', 'extras', 'result'] as const).filter(
        (key) => key !== 'design' || hasVisualScope(input.scope),
      ),
    [input.scope],
  )
  const index = Math.max(0, steps.indexOf(stepKey))
  const go = (offset: number) =>
    setStepKey(steps[Math.min(steps.length - 1, Math.max(0, index + offset))]!)
  const next = () => go(1)
  const back = () => go(-1)

  const update = (patch: Partial<EstimateInput>) =>
    setInput((current) => ({ ...current, ...patch }))

  // The analysis was signed for one exact set of answers. Once they change,
  // it stops counting towards the price (the panel says so) until re-run.
  const inputKey = JSON.stringify(input)
  const aiCurrent = ai && ai.forInput === inputKey ? ai : null
  const result = useMemo(() => estimate(input, aiCurrent?.analysis), [input, aiCurrent])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    // Bring the new step's heading into view when the previous one was long.
    const top = rootRef.current?.getBoundingClientRect().top ?? 0
    if (top < 0) rootRef.current?.scrollIntoView({ block: 'start' })
  }, [stepKey])

  const showTicker = stepKey !== 'type' && stepKey !== 'result' && input.scope.length > 0

  return (
    <div
      className={cn('paper-sheet relative scroll-mt-24 p-5 sm:p-8 md:p-10', className)}
      ref={rootRef}
    >
      <ol
        className="mb-10 flex flex-wrap gap-x-[var(--space-xs)] gap-y-[var(--space-xs)] border-b border-[var(--color-rule)] pb-5 sm:gap-x-5"
        aria-label={t('calculator.stepOf', { current: index + 1, total: steps.length })}
      >
        {steps.map((key, i) => (
          <li
            key={key}
            className={cn(
              'flex items-center gap-2 text-sm',
              i === index ? 'font-semibold text-foreground' : 'text-muted-foreground',
            )}
            aria-current={i === index ? 'step' : undefined}
          >
            <span
              className={cn(
                'figure grid size-8 place-items-center rounded-full text-sm font-bold leading-none',
                i === index && 'bg-[var(--color-ink)] text-[var(--color-paper)]',
                i < index && 'bg-[var(--color-accent)] text-[var(--color-accent-ink)]',
                i > index && 'border border-[var(--color-rule)] text-[var(--color-muted)]',
              )}
            >
              {i < index ? '✓' : i + 1}
            </span>
            <span className={cn(i !== index && 'hidden sm:inline')}>
              {t(`calculator.steps.${key}`)}
            </span>
          </li>
        ))}
      </ol>

      {stepKey === 'type' && (
        <ScopeStep
          value={input.scope}
          onChange={(scope) => update({ scope })}
          onNext={() => {
            sendEvent('calculator_start')
            next()
          }}
        />
      )}
      {stepKey === 'details' && (
        <DetailsStep input={input} update={update} onBack={back} onNext={next} />
      )}
      {stepKey === 'design' && (
        <DesignStep input={input} update={update} onBack={back} onNext={next} />
      )}
      {stepKey === 'features' && (
        <FeaturesStep input={input} update={update} onBack={back} onNext={next} />
      )}
      {stepKey === 'extras' && (
        <ExtrasStep input={input} update={update} onBack={back} onNext={next} />
      )}

      {stepKey === 'result' && (
        <>
          <BudgetOutput
            result={result}
            scope={input.scope}
            onBack={back}
            onEdit={() => setStepKey('type')}
          />
          <AiAnalysisPanel
            locale={locale}
            input={input}
            inputKey={inputKey}
            ai={ai}
            isCurrent={aiCurrent !== null}
            onResult={setAi}
            onAddFeatures={(features) =>
              update({ features: [...new Set([...input.features, ...features])] })
            }
            onEditDescription={() => setStepKey('extras')}
          />
          <LeadCaptureStep locale={locale} input={input} ai={aiCurrent} />
        </>
      )}

      {showTicker && <EstimateTicker cost={result.cost} hours={result.hours} />}
    </div>
  )
}

/** The running total, pinned to the bottom of the viewport while answering. */
function EstimateTicker({ cost, hours }: { cost: [number, number]; hours: [number, number] }) {
  const { t } = useTranslations()
  const { locale } = useLocale()
  return (
    <div
      className="sticky bottom-4 z-10 mt-10 flex justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="paper-card flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3">
        <span className="small">{t('calculator.ticker.label')}</span>
        <span className="font-heading text-2xl">{formatCostRange(cost, locale)}</span>
        <span className="text-sm text-muted-foreground">
          {t('calculator.ticker.hours', { hours: formatRange(hours, locale) })}
        </span>
      </div>
    </div>
  )
}
