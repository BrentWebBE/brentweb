'use client'

import { useLocale, useTranslations } from '@/hooks/useTranslations'
import {
  FEATURES,
  FEATURE_GROUPS,
  PRICING,
  featuresFor,
  formatCostRange,
} from '@/lib/calculator/pricing'
import type { FeatureKey } from '@/lib/schemas/lead'
import { OptionCard, StepNav, StepShell, estimatorClasses } from '@/components/calculator/controls'
import type { StepProps } from '@/components/calculator/DetailsStep'

export function FeaturesStep({ input, update, onBack, onNext }: StepProps) {
  const { t } = useTranslations()
  const { locale } = useLocale()
  const offered = featuresFor(input.scope)

  const toggle = (key: FeatureKey) =>
    update({
      features: input.features.includes(key)
        ? input.features.filter((k) => k !== key)
        : [...input.features, key],
    })

  // What a feature adds before overhead, so the cards stay honest about
  // the order of magnitude without pretending to the euro.
  const addsCost = (key: FeatureKey) =>
    `+${formatCostRange(
      [FEATURES[key].hours[0] * PRICING.hourlyRate, FEATURES[key].hours[1] * PRICING.hourlyRate],
      locale,
    )}`

  return (
    <StepShell
      title={t('calculator.features.title')}
      description={t('calculator.features.description')}
      actions={
        <StepNav
          backLabel={t('calculator.back')}
          nextLabel={t('calculator.next')}
          onBack={onBack}
          onNext={onNext}
        />
      }
    >
      {offered.length === 0 && (
        <p className={estimatorClasses.description}>{t('calculator.features.none')}</p>
      )}

      {FEATURE_GROUPS.map((group) => {
        const keys = offered.filter((key) => FEATURES[key].group === group)
        if (keys.length === 0) return null
        return (
          <fieldset key={group}>
            <legend className="hand text-2xl text-primary">
              {t(`calculator.features.groups.${group}`)}
            </legend>
            <div className={estimatorClasses.optionsThree}>
              {keys.map((key) => (
                <OptionCard
                  key={key}
                  selected={input.features.includes(key)}
                  onClick={() => toggle(key)}
                  label={t(`calculator.features.options.${key}.label`)}
                  description={t(`calculator.features.options.${key}.description`)}
                  aside={addsCost(key)}
                />
              ))}
            </div>
          </fieldset>
        )
      })}
    </StepShell>
  )
}
