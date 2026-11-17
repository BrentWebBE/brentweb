import React from 'react'

import type { FeaturesBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'
import { fillPrices } from '@/lib/prices'
import { cn } from '@/utilities/ui'

/**
 * Short facts in three looks: ticks (a list), compact (a row of facts under hairlines)
 * and cards (two columns of titled notes). `background` puts the block in a tinted well.
 */
export function FeaturesBlock({
  background,
  enableLink,
  heading,
  intro,
  items,
  link,
  locale,
  style,
}: Props & { locale: Locale }) {
  const list = items ?? []
  const content =
    style === 'ticks' ? (
      <ul className="list-ticks max-w-[68ch]">
        {list.map((item, i) => (
          <li key={item.id ?? i}>
            {item.title && <strong className="font-medium">{item.title}. </strong>}
            {item.body && fillPrices(item.body, locale)}
          </li>
        ))}
      </ul>
    ) : style === 'compact' ? (
      <dl className="grid gap-x-[var(--gap-columns)] gap-y-[var(--space-xl)] sm:grid-cols-2 lg:grid-cols-4">
        {list.map((item, i) => (
          <div
            className="border-t border-[var(--color-rule)] pt-[var(--space-md)]"
            key={item.id ?? i}
          >
            {item.title && <dt className="font-medium">{item.title}</dt>}
            {item.body && (
              <dd className="mt-[var(--space-2xs)] text-[var(--color-ink-2)]">
                {fillPrices(item.body, locale)}
              </dd>
            )}
          </div>
        ))}
      </dl>
    ) : (
      <dl
        className={cn(
          'grid gap-x-[var(--space-2xl)] gap-y-[var(--space-xl)] md:grid-cols-2',
          list.length % 3 === 0 && 'lg:grid-cols-3',
        )}
      >
        {list.map((item, i) => (
          <div
            className="border-t border-[var(--color-rule)] pt-[var(--space-md)]"
            key={item.id ?? i}
          >
            {item.title && <dt className="h-title mb-[var(--space-xs)]">{item.title}</dt>}
            {item.body && (
              <dd className="text-[var(--color-ink-2)]">{fillPrices(item.body, locale)}</dd>
            )}
          </div>
        ))}
      </dl>
    )

  return (
    <section className="section">
      <div className={cn('container', background && 'py-0')}>
        <div
          className={cn(
            background &&
              'well px-[var(--space-lg)] py-[var(--space-2xl)] md:px-[var(--space-2xl)]',
          )}
        >
          <SectionHeading heading={heading} intro={intro} locale={locale} />
          {content}
          {enableLink && link && (
            <div className="mt-[var(--space-xl)]">
              <CMSLink {...link} appearance="link" locale={locale} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
