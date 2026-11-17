'use client'

import { useId } from 'react'
import { useLocale, useTranslations } from '@/hooks/useTranslations'
import { ESTIMATE_LIMITS, MAINTENANCE_PLANS, TIMELINE_KEYS } from '@/lib/schemas/lead'
import { PRICING, formatEuro } from '@/lib/calculator/pricing'
import { ChoiceGroup, StepNav, StepShell, estimatorClasses } from '@/components/calculator/controls'
import type { StepProps } from '@/components/calculator/DetailsStep'

/** Timeline, maintenance, and the free-text description the AI check reads. */
export function ExtrasStep({ input, update, onBack, onNext }: StepProps) {
  const { t } = useTranslations()
  const { locale } = useLocale()
  const descriptionId = useId()

  return (
    <StepShell
      title={t('calculator.extras.title')}
      actions={
        <StepNav
          backLabel={t('calculator.back')}
          nextLabel={t('calculator.next')}
          onBack={onBack}
          onNext={onNext}
        />
      }
    >
      <ChoiceGroup
        label={t('calculator.extras.timelineLabel')}
        options={TIMELINE_KEYS}
        value={input.timeline}
        onChange={(timeline) => update({ timeline })}
        describe={(key) => ({ label: t(`calculator.timeline.options.${key}`) })}
      />

      <ChoiceGroup
        label={t('calculator.extras.maintenance.label')}
        options={MAINTENANCE_PLANS}
        value={input.maintenance}
        onChange={(maintenance) => update({ maintenance })}
        describe={(key) => ({
          label: t(`calculator.extras.maintenance.options.${key}.label`),
          description: t(`calculator.extras.maintenance.options.${key}.description`),
        })}
        aside={(key) =>
          PRICING.maintenance[key] > 0
            ? t('calculator.extras.maintenance.perMonth', {
                amount: formatEuro(PRICING.maintenance[key], locale),
              })
            : null
        }
      />

      <div>
        <label htmlFor={descriptionId} className={estimatorClasses.fieldLabel}>
          {t('calculator.extras.description.label')}
        </label>
        <p className={estimatorClasses.help}>{t('calculator.extras.description.help')}</p>
        <textarea
          id={descriptionId}
          rows={5}
          className="field-hand mt-3 resize-y"
          maxLength={ESTIMATE_LIMITS.description}
          placeholder={t('calculator.extras.description.placeholder')}
          value={input.description}
          onChange={(event) => update({ description: event.target.value })}
        />
        <span className="mt-1 block text-right text-sm tabular-nums text-muted-foreground">
          {input.description.length} / {ESTIMATE_LIMITS.description}
        </span>
      </div>
    </StepShell>
  )
}
