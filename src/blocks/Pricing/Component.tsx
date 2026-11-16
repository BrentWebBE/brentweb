import Link from 'next/link'
import React from 'react'

import type { Page, PricingBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import { SCOPE_DEFINITIONS } from '@/lib/calculator/pricing'
import type { Locale } from '@/lib/locales'
import { fillPrices, formatPriceRange } from '@/lib/prices'
import { pageHref } from '@/lib/routing'
import { SCOPE_KEYS } from '@/lib/scopes'
import { fill, ui } from '@/lib/ui-strings'

/**
 * The usual price per kind of project: the numbers from the estimator's table, the words
 * from Payload. Each row links to its service page; the estimator waits beside it.
 */
export function PricingBlock({
  ctaBody,
  ctaLink,
  ctaTitle,
  heading,
  locale,
  note,
  servicePages,
}: Props & { locale: Locale }) {
  const t = ui(locale)
  const hrefFor = (scope: string) => {
    const page = servicePages?.find((s) => s.scope === scope)?.page
    return page && typeof page === 'object' ? pageHref(locale, (page as Page).slug) : null
  }

  return (
    <section className="section-l">
      <div className="container">
        <div>
          <SectionHeading heading={heading} locale={locale} />
          <table className="w-full border-collapse text-left">
            <caption className="visually-hidden">{heading}</caption>
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
                const href = hrefFor(key)
                return (
                  <tr className="border-b border-[var(--color-rule)]" key={key}>
                    <th
                      className="w-full py-[var(--space-lg)] pr-[var(--space-md)] text-[length:var(--text-lg)] font-bold"
                      scope="row"
                    >
                      {href ? (
                        <Link className="hover:text-[var(--color-accent)]" href={href}>
                          {t.scopes[key]}
                        </Link>
                      ) : (
                        t.scopes[key]
                      )}
                    </th>
                    <td className="figure whitespace-nowrap py-[var(--space-lg)] text-right text-[length:var(--text-lg)]">
                      {formatPriceRange(d.minCost, d.maxCost, locale)}
                    </td>
                    <td className="figure hidden whitespace-nowrap py-[var(--space-lg)] pl-[var(--space-lg)] text-right text-[var(--color-ink-2)] sm:table-cell">
                      {fill(t.price.weeks, { min: d.minWeeks, max: d.maxWeeks })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {note && (
            <p className="small mt-[var(--space-lg)] max-w-[60ch]">{fillPrices(note, locale)}</p>
          )}
        </div>

        {(ctaTitle || ctaLink?.label) && (
          <div className="mt-[var(--space-2xl)] grid gap-[var(--space-md)] border-t-2 border-[var(--color-ink)] pt-[var(--space-lg)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-[var(--space-2xl)]">
            <p className="max-w-[60ch]">
              {ctaTitle && <strong className="font-bold">{ctaTitle} </strong>}
              {ctaBody && (
                <span className="text-[var(--color-ink-2)]">{fillPrices(ctaBody, locale)}</span>
              )}
            </p>
            {ctaLink?.label && <CMSLink {...ctaLink} appearance="button" locale={locale} />}
          </div>
        )}
      </div>
    </section>
  )
}
