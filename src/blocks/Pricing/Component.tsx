import React from 'react'

import type { PricingBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import { SCOPE_DEFINITIONS } from '@/lib/calculator/pricing'
import type { Locale } from '@/lib/locales'
import { fillPrices, formatPriceRange } from '@/lib/prices'
import { SCOPE_KEYS } from '@/lib/scopes'
import { fill, ui } from '@/lib/ui-strings'

/** The usual price per kind of project. Numbers from the estimator, words from Payload. */
export function PricingBlock({
  ctaBody,
  ctaLink,
  ctaTitle,
  eyebrow,
  heading,
  locale,
  note,
}: Props & { locale: Locale }) {
  const t = ui(locale)
  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={eyebrow} heading={heading} locale={locale} />
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <ul className="divide-y divide-dashed divide-border border-y border-dashed border-border">
              {SCOPE_KEYS.map((key) => {
                const d = SCOPE_DEFINITIONS[key]
                return (
                  <li
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-5"
                    key={key}
                  >
                    <span className="font-heading text-xl">{t.scopes[key]}</span>
                    <span className="flex items-baseline gap-4">
                      <span className="text-lg font-semibold">
                        {formatPriceRange(d.minCost, d.maxCost, locale)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {fill(t.price.weeks, { min: d.minWeeks, max: d.maxWeeks })}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
            {note && (
              <p className="mt-5 max-w-xl text-muted-foreground">{fillPrices(note, locale)}</p>
            )}
          </div>

          {(ctaTitle || ctaLink?.label) && (
            <aside className="paper-card relative self-start p-7 lg:rotate-1">
              <span
                aria-hidden="true"
                className="sticker absolute -right-5 -top-8 hidden !w-24 text-lg md:grid"
                style={{ '--tilt': '10deg' } as React.CSSProperties}
              >
                {locale === 'nl-BE' ? 'gratis!' : 'free!'}
              </span>
              {ctaTitle && <h3 className="display-3 mb-2 md:pr-14">{ctaTitle}</h3>}
              {ctaBody && (
                <p className="mb-6 text-muted-foreground">{fillPrices(ctaBody, locale)}</p>
              )}
              {ctaLink?.label && <CMSLink {...ctaLink} appearance="button" locale={locale} />}
            </aside>
          )}
        </div>
      </div>
    </section>
  )
}
