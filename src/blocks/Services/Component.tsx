import React from 'react'

import type { ServicesBlock as Props } from '@/payload-types'

import { CMSLink, linkHref } from '@/components/Link'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'
import { fillPrices } from '@/lib/prices'
import { cn } from '@/utilities/ui'

const COLS: Record<string, string> = {
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-2 lg:grid-cols-3',
  '4': 'md:grid-cols-2 lg:grid-cols-4',
}

/** Services as index cards; the whole card is the link when there is one. */
export function ServicesBlock({
  columns,
  heading,
  intro,
  items,
  locale,
}: Props & { locale: Locale }) {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading heading={heading} intro={intro} locale={locale} />
        <ul className={cn('grid gap-6', COLS[columns] ?? COLS['3'])}>
          {items?.map((item, i) => {
            const href = item.enableLink && item.link ? linkHref({ locale, ...item.link }) : null
            return (
              <li
                className="paper-card group relative flex flex-col p-6 transition-transform hover:-rotate-1"
                key={item.id ?? i}
              >
                <h3 className="display-3 mb-2">{item.title}</h3>
                {item.description && (
                  <p className="text-muted-foreground">{fillPrices(item.description, locale)}</p>
                )}
                {href && item.link && (
                  <CMSLink
                    {...item.link}
                    appearance="arrow"
                    className="mt-auto pt-5 before:absolute before:inset-0 before:content-['']"
                    locale={locale}
                  />
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
