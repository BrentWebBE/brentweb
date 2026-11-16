import React from 'react'

import type { FeaturesBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'
import { fillPrices } from '@/lib/prices'
import { cn } from '@/utilities/ui'

export function FeaturesBlock({
  background,
  enableLink,
  eyebrow,
  heading,
  intro,
  items,
  link,
  locale,
  style,
}: Props & { locale: Locale }) {
  const list = items ?? []

  return (
    <section className={cn('section', background && 'kraft my-8')}>
      <div className={cn('container', background && 'py-6')}>
        <SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} locale={locale} />

        {style === 'ticks' ? (
          <ul className="list-ticks max-w-3xl text-lg">
            {list.map((item, i) => (
              <li key={item.id ?? i}>
                {item.title && <strong className="font-semibold">{item.title}. </strong>}
                {item.body && fillPrices(item.body, locale)}
              </li>
            ))}
          </ul>
        ) : style === 'compact' ? (
          <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((item, i) => (
              <div className="border-l-2 border-dashed border-primary/50 pl-4" key={item.id ?? i}>
                {item.title && <dt className="font-heading text-xl">{item.title}</dt>}
                {item.body && (
                  <dd className="mt-1 text-muted-foreground">{fillPrices(item.body, locale)}</dd>
                )}
              </div>
            ))}
          </dl>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {list.map((item, i) => (
              <li className="paper-card p-6" key={item.id ?? i}>
                {item.title && <h3 className="display-3 mb-2">{item.title}</h3>}
                {item.body && (
                  <p className="text-muted-foreground">{fillPrices(item.body, locale)}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        {enableLink && link && (
          <div className="mt-10">
            <CMSLink {...link} appearance="arrow" locale={locale} />
          </div>
        )}
      </div>
    </section>
  )
}
