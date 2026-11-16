import React from 'react'

import type { PricingTableBlock as Props } from '@/payload-types'

import { SectionHeading } from '@/components/handmade/SectionHeading'
import { SCOPE_DEFINITIONS } from '@/lib/calculator/pricing'
import type { Locale } from '@/lib/locales'
import { formatPriceRange } from '@/lib/prices'
import { SCOPE_KEYS } from '@/lib/scopes'
import { fill, ui } from '@/lib/ui-strings'

export function PricingTableBlock({ heading, intro, locale }: Props & { locale: Locale }) {
  const t = ui(locale)
  return (
    <section className="section-l">
      <div className="container">
        <SectionHeading heading={heading} intro={intro} locale={locale} split />
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="small border-b border-[var(--color-rule)]">
              <th className="py-[var(--space-sm)] font-medium" scope="col">
                {t.pricingTable.type}
              </th>
              <th className="py-[var(--space-sm)] text-right font-medium" scope="col">
                {t.pricingTable.price}
              </th>
              <th
                className="hidden py-[var(--space-sm)] text-right font-medium sm:table-cell"
                scope="col"
              >
                {t.pricingTable.duration}
              </th>
            </tr>
          </thead>
          <tbody>
            {SCOPE_KEYS.map((key) => {
              const d = SCOPE_DEFINITIONS[key]
              return (
                <tr className="border-b border-[var(--color-rule)]" key={key}>
                  <th className="py-[var(--space-md)] pr-[var(--space-md)] font-medium" scope="row">
                    {t.scopes[key]}
                  </th>
                  <td className="figure whitespace-nowrap py-[var(--space-md)] text-right">
                    {formatPriceRange(d.minCost, d.maxCost, locale)}
                  </td>
                  <td className="figure hidden whitespace-nowrap py-[var(--space-md)] pl-[var(--space-md)] text-right text-[var(--color-ink-2)] sm:table-cell">
                    {fill(t.price.weeks, { min: d.minWeeks, max: d.maxWeeks })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
