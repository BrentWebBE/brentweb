'use client'

import { useLocale, useLocaleContext, useTranslations } from '@/hooks/useTranslations'
import {
  PRICING,
  formatCostRange,
  formatEuro,
  formatRange,
  lineLabel,
  type EstimatorResult,
} from '@/lib/calculator/pricing'
import { LEGAL } from '@/lib/legal'
import type { ScopeKey } from '@/lib/schemas/lead'
import { cn } from '@/utilities/ui'
import { estimatorClasses } from '@/components/calculator/controls'

export function BudgetOutput({
  result,
  scope,
  onBack,
  onEdit,
}: {
  result: EstimatorResult
  scope: ScopeKey[]
  onBack: () => void
  onEdit: () => void
}) {
  const { t } = useTranslations()
  const { locale } = useLocale()
  const { messages } = useLocaleContext()

  // The per-type bullets resolve in the visitor's own language from the
  // message bundle, never from pricing.ts.
  const includedItems = scope.flatMap((key) => messages.calculator.scope.options[key].includes)

  const facts = [
    {
      label: t('calculator.result.hoursLabel'),
      value: t('calculator.ticker.hours', { hours: formatRange(result.hours, locale) }),
    },
    {
      label: t('calculator.result.timelineLabel'),
      value: t('calculator.result.weeksLabel', {
        min: result.estimatedWeeks[0],
        max: result.estimatedWeeks[1],
      }),
    },
    ...(result.monthly > 0
      ? [
          {
            label: t('calculator.result.maintenanceLabel'),
            value: t('calculator.extras.maintenance.perMonth', {
              amount: formatEuro(result.monthly, locale),
            }),
          },
        ]
      : []),
  ]

  return (
    <div>
      <h2 className={estimatorClasses.title}>{t('calculator.result.title')}</h2>

      <div className="mt-8 grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="paper-card relative p-6 sm:p-7">
          <span className="eyebrow">{t('calculator.result.budgetLabel')}</span>
          <p className="mt-3 font-heading text-4xl sm:text-5xl">
            <span className="highlight">{formatCostRange(result.cost, locale)}</span>
          </p>
        </div>
        <dl className="grid content-start gap-4">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="rounded-[10px_14px_12px_9px] border-[1.5px] border-dashed border-border px-4 py-3"
            >
              <dt className="text-sm text-muted-foreground">{fact.label}</dt>
              <dd className="mt-0.5 text-lg font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {result.isRush && (
        <p className="hand mt-5 -rotate-1 text-2xl text-primary">
          {t('calculator.result.rushNote')}
        </p>
      )}

      <section className="mt-10">
        <h3 className={estimatorClasses.subTitle}>{t('calculator.result.breakdownTitle')}</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr className="border-b-[1.5px] border-foreground text-left">
                <th scope="col" className="py-2 pr-3 font-semibold">
                  {t('calculator.result.itemHeader')}
                </th>
                <th scope="col" className="py-2 px-3 text-right font-semibold">
                  {t('calculator.result.hoursHeader')}
                </th>
                <th scope="col" className="py-2 pl-3 text-right font-semibold">
                  {t('calculator.result.costHeader')}
                </th>
              </tr>
            </thead>
            <tbody>
              {result.lines.map((line, i) => (
                <tr
                  key={i}
                  className={cn(
                    'border-b border-dashed border-border align-top',
                    line.kind === 'ai' && 'bg-[color-mix(in_oklch,var(--accent)_22%,transparent)]',
                  )}
                >
                  <td className="py-2 pr-3">
                    {line.kind === 'ai' && <AiBadge label={t('calculator.result.aiBadge')} />}
                    {lineLabel(line, t)}
                    {line.kind === 'ai' && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {line.reason}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {formatRange(line.hours, locale)}
                  </td>
                  <td className="py-2 pl-3 text-right tabular-nums whitespace-nowrap">
                    {formatCostRange(line.cost, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-[1.5px] border-foreground font-semibold">
                <th scope="row" className="py-2 pr-3 text-left">
                  {t('calculator.result.totalLabel')}
                </th>
                <td className="py-2 px-3 text-right tabular-nums">
                  {formatRange(result.hours, locale)}
                </td>
                <td className="py-2 pl-3 text-right tabular-nums whitespace-nowrap">
                  {formatCostRange(result.cost, locale)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className={`${estimatorClasses.help} mt-3`}>
          {t('calculator.result.rateNote', { rate: formatEuro(PRICING.hourlyRate, locale) })}{' '}
          {LEGAL.vatExempt ? t('pricing.vatExempt') : t('pricing.vatExcluded')}
        </p>
      </section>

      <section className="mt-10">
        <h3 className={estimatorClasses.subTitle}>{t('calculator.result.includedTitle')}</h3>
        <ul className={estimatorClasses.list}>
          {includedItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <p className={`${estimatorClasses.help} mt-8`}>{t('calculator.result.disclaimer')}</p>

      <div className={estimatorClasses.actions}>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← {t('calculator.back')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onEdit}>
          {t('calculator.result.edit')}
        </button>
      </div>
    </div>
  )
}

export function AiBadge({ label }: { label: string }) {
  return (
    <span className="mr-2 inline-block -rotate-2 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
      {label}
    </span>
  )
}
