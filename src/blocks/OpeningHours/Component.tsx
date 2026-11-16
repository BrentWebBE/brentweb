import React from 'react'

import type { OpeningHoursBlock as OpeningHoursBlockProps } from '@/payload-types'

import { OpeningHoursTable } from '@/components/OpeningHoursTable'
import { getSiteSettings } from '@/utilities/getSiteSettings'

export const OpeningHoursBlock: React.FC<OpeningHoursBlockProps & { locale?: string }> = async ({
  heading,
  intro,
}) => {
  const settings = await getSiteSettings()

  return (
    <section className="section container">
      <div className="mx-auto max-w-xl">
        {heading && <h2 className="font-heading text-3xl md:text-4xl mb-4">{heading}</h2>}
        {intro && <p className="mb-8 text-muted-foreground whitespace-pre-line">{intro}</p>}
        <OpeningHoursTable openingHours={settings?.openingHours} />
      </div>
    </section>
  )
}
