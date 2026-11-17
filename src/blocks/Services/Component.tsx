import React from 'react'

import type { ServicesBlock as Props } from '@/payload-types'

import { CMSLink, linkHref } from '@/components/Link'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'
import { fillPrices } from '@/lib/prices'

/** Services as an index: the name large, one line on it, and where to read more. */
export function ServicesBlock({ heading, intro, items, locale }: Props & { locale: Locale }) {
  return (
    <section className="section-l">
      <div className="container">
        <SectionHeading heading={heading} intro={intro} locale={locale} />
        <ul className="border-t border-[var(--color-rule)]">
          {items?.map((item, i) => {
            const href = item.enableLink && item.link ? linkHref({ locale, ...item.link }) : null
            return (
              <li className="group relative border-b border-[var(--color-rule)]" key={item.id ?? i}>
                <div className="grid gap-[var(--space-xs)] py-[var(--space-xl)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] md:items-baseline md:gap-[var(--gap-columns)]">
                  <h3 className="h-title transition-colors group-hover:text-[var(--color-accent)]">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-[var(--color-ink-2)]">
                      {fillPrices(item.description, locale)}
                    </p>
                  )}
                  {href && item.link && (
                    <CMSLink
                      {...item.link}
                      appearance="link"
                      className="w-fit after:absolute after:inset-0 after:content-['']"
                      locale={locale}
                    />
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
