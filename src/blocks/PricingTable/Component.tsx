import React from 'react'

import type { PricingTableBlock as Props } from '@/payload-types'

import { SectionHeading } from '@/components/handmade/SectionHeading'
import { SCOPE_DEFINITIONS } from '@/lib/calculator/pricing'
import type { Locale } from '@/lib/locales'
import { formatPriceRange } from '@/lib/prices'
import { SCOPE_KEYS } from '@/lib/scopes'
import { fill, ui } from '@/lib/ui-strings'

export function PricingTableBlock({ eyebrow, heading, intro, locale }: Props & { locale: Locale }) {
  const t = ui(locale)
  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} locale={locale} />
        <div className="paper-sheet overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left">
            <thead>
              <tr className="border-b-2 border-dashed border-border">
                <th
                  className="hand px-6 py-4 text-xl font-normal text-muted-foreground"
                  scope="col"
                >
                  {t.pricingTable.type}
                </th>
                <th
                  className="hand px-6 py-4 text-xl font-normal text-muted-foreground"
                  scope="col"
                >
                  {t.pricingTable.price}
                </th>
                <th
                  className="hand px-6 py-4 text-xl font-normal text-muted-foreground"
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
                  <tr className="border-b border-dashed border-border last:border-0" key={key}>
                    <th className="px-6 py-4 font-heading text-lg font-normal" scope="row">
                      {t.scopes[key]}
                    </th>
                    <td className="px-6 py-4 font-semibold">
                      {formatPriceRange(d.minCost, d.maxCost, locale)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {fill(t.price.weeks, { min: d.minWeeks, max: d.maxWeeks })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
