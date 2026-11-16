'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from '@/hooks/useTranslations'
import { SCOPE_DEFINITIONS, formatCostRange } from '@/lib/calculator/pricing'
import { LEGAL } from '@/lib/legal'
import { SCOPE_KEYS, type ScopeKey } from '@/lib/schemas/lead'
import { OptionCard, estimatorClasses } from '@/components/calculator/controls'

export function ScopeStep({
  value,
  onChange,
  onNext,
}: {
  value: ScopeKey[]
  onChange: (value: ScopeKey[]) => void
  onNext: () => void
}) {
  const { t } = useTranslations()
  const { locale } = useLocale()
  const [error, setError] = useState<string | null>(null)

  const toggle = (key: ScopeKey) => {
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key])
    setError(null)
  }

  const handleNext = () => {
    if (value.length === 0) {
      setError(t('calculator.scope.error'))
      return
    }
    onNext()
  }

  return (
    <div>
      <h2 className={estimatorClasses.title}>{t('calculator.scope.title')}</h2>
      <p className={estimatorClasses.description}>{t('calculator.scope.description')}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SCOPE_KEYS.map((key) => (
          <OptionCard
            key={key}
            selected={value.includes(key)}
            onClick={() => toggle(key)}
            label={t(`calculator.scope.options.${key}.label`)}
            description={t(`calculator.scope.options.${key}.description`)}
            // The range up front, so this page shows prices before anyone answers a
            // question. Same table the price blocks read (lib/prices.ts).
            aside={formatCostRange(
              [SCOPE_DEFINITIONS[key].minCost, SCOPE_DEFINITIONS[key].maxCost],
              locale,
            )}
          />
        ))}
      </div>

      <p className={`${estimatorClasses.help} mt-5`}>
        {LEGAL.vatExempt ? t('pricing.vatExempt') : t('pricing.vatExcluded')}
      </p>

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className={estimatorClasses.actions}>
        <button type="button" className="btn btn-primary" onClick={handleNext}>
          {t('calculator.next')}
        </button>
      </div>
    </div>
  )
}
