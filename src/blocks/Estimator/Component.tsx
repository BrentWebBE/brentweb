import React from 'react'

import type { EstimatorBlock as Props } from '@/payload-types'

import { CostEstimator } from '@/components/calculator/CostEstimator'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'

export function EstimatorBlock({ eyebrow, heading, intro, locale }: Props & { locale: Locale }) {
  return (
    <section className="section scroll-mt-24" id="estimator">
      <div className="container">
        <SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} locale={locale} />
        <CostEstimator />
      </div>
    </section>
  )
}
