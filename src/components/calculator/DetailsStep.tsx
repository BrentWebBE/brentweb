'use client'

import { useTranslations } from '@/hooks/useTranslations'
import {
  AUTOMATION_LEVELS,
  ESTIMATE_LIMITS,
  ROLE_LEVELS,
  STARTING_POINTS,
  type EstimateInput,
} from '@/lib/schemas/lead'
import { ChoiceGroup, StepNav, StepShell, Stepper } from '@/components/calculator/controls'

export interface StepProps {
  input: EstimateInput
  update: (patch: Partial<EstimateInput>) => void
  onBack: () => void
  onNext: () => void
}

/** Size questions, shown only for the project types that were picked. */
export function DetailsStep({ input, update, onBack, onNext }: StepProps) {
  const { t } = useTranslations()
  const option = (group: string, key: string) => ({
    label: t(`calculator.details.${group}.options.${key}.label`),
    description: t(`calculator.details.${group}.options.${key}.description`),
  })
  const has = (type: EstimateInput['scope'][number]) => input.scope.includes(type)

  return (
    <StepShell
      title={t('calculator.details.title')}
      description={t('calculator.details.description')}
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
        label={t('calculator.details.startingPoint.label')}
        options={STARTING_POINTS}
        value={input.startingPoint}
        onChange={(startingPoint) => update({ startingPoint })}
        describe={(key) => option('startingPoint', key)}
      />

      {has('website') && (
        <Stepper
          label={t('calculator.details.pages.label')}
          help={t('calculator.details.pages.help')}
          value={input.pages}
          {...ESTIMATE_LIMITS.pages}
          onChange={(pages) => update({ pages })}
        />
      )}

      {has('web_app') && (
        <>
          <Stepper
            label={t('calculator.details.screens.label')}
            help={t('calculator.details.screens.help')}
            value={input.screens}
            {...ESTIMATE_LIMITS.screens}
            onChange={(screens) => update({ screens })}
          />
          <ChoiceGroup
            label={t('calculator.details.roles.label')}
            options={ROLE_LEVELS}
            value={input.roles}
            onChange={(roles) => update({ roles })}
            describe={(key) => option('roles', key)}
          />
        </>
      )}

      {has('api_integration') && (
        <Stepper
          label={t('calculator.details.integrations.label')}
          help={t('calculator.details.integrations.help')}
          value={input.integrations}
          {...ESTIMATE_LIMITS.integrations}
          onChange={(integrations) => update({ integrations })}
        />
      )}

      {has('automation') && (
        <>
          <Stepper
            label={t('calculator.details.workflows.label')}
            help={t('calculator.details.workflows.help')}
            value={input.workflows}
            {...ESTIMATE_LIMITS.workflows}
            onChange={(workflows) => update({ workflows })}
          />
          <ChoiceGroup
            label={t('calculator.details.automationLevel.label')}
            options={AUTOMATION_LEVELS}
            value={input.automationLevel}
            onChange={(automationLevel) => update({ automationLevel })}
            describe={(key) => option('automationLevel', key)}
          />
        </>
      )}
    </StepShell>
  )
}
