import React from 'react'

import type { EstimatorBlock as Props } from '@/payload-types'

import { CostEstimator } from '@/components/calculator/CostEstimator'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'

export function EstimatorBlock({ heading, intro, locale }: Props & { locale: Locale }) {
  return (
    <section
      className="scroll-mt-[var(--nav-height)] pb-[calc(var(--section-gap-s)/2)]"
      id="estimator"
    >
      <div className="container">
        <SectionHeading heading={heading} intro={intro} locale={locale} />
        <CostEstimator />
      </div>
    </section>
  )
}
