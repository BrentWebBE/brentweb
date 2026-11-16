'use client'

import { useTranslations } from '@/hooks/useTranslations'
import { CONTENT_LEVELS, DESIGN_LEVELS, ESTIMATE_LIMITS } from '@/lib/schemas/lead'
import { ChoiceGroup, StepNav, StepShell, Stepper } from '@/components/calculator/controls'
import type { StepProps } from '@/components/calculator/DetailsStep'

export function DesignStep({ input, update, onBack, onNext }: StepProps) {
  const { t } = useTranslations()
  const option = (group: string, key: string) => ({
    label: t(`calculator.design.${group}.options.${key}.label`),
    description: t(`calculator.design.${group}.options.${key}.description`),
  })

  return (
    <StepShell
      title={t('calculator.design.title')}
      description={t('calculator.design.description')}
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
        label={t('calculator.design.level.label')}
        options={DESIGN_LEVELS}
        value={input.design}
        onChange={(design) => update({ design })}
        describe={(key) => option('level', key)}
      />

      {/* Copywriting is priced per website page; app screens have no prose. */}
      {input.scope.includes('website') && (
        <ChoiceGroup
          label={t('calculator.design.content.label')}
          options={CONTENT_LEVELS}
          value={input.content}
          onChange={(content) => update({ content })}
          describe={(key) => option('content', key)}
        />
      )}

      <Stepper
        label={t('calculator.design.languages.label')}
        help={t('calculator.design.languages.help')}
        value={input.languages}
        {...ESTIMATE_LIMITS.languages}
        onChange={(languages) => update({ languages })}
      />
    </StepShell>
  )
}
