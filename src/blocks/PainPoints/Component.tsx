import React from 'react'

import Link from 'next/link'

import type { PainPointsBlock as Props, Project } from '@/payload-types'

import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'
import { CONTACT_PREFILL_PARAM, projectHref } from '@/lib/routing'

/**
 * "Klinkt dit bekend?": each problem in the visitor's words, set large, with what fixes
 * it underneath. The link carries the problem into the contact form.
 */
export function PainPointsBlock({
  caseLinkLabel,
  heading,
  items,
  linkLabel,
  locale,
}: Props & { locale: Locale }) {
  return (
    <section className="section-l">
      <div className="container">
        <SectionHeading heading={heading} locale={locale} />
        <ol className="grid gap-x-[var(--gap-columns)] gap-y-[var(--space-2xl)] md:grid-cols-3">
          {items?.map((item, i) => (
            <li
              className="flex flex-col border-t-2 border-[var(--color-ink)] pt-[var(--space-lg)]"
              key={item.id ?? i}
            >
              <p className="h-title mb-[var(--space-md)]">“{item.problem}”</p>
              <p className="text-[var(--color-ink-2)]">{item.fix}</p>
              {typeof item.project === 'object' && item.project && caseLinkLabel && (
                <Link
                  className="link mt-[var(--space-md)] w-fit"
                  href={projectHref(locale, (item.project as Project).slug)}
                >
                  {caseLinkLabel.replace(
                    '{client}',
                    (item.project as Project).client || (item.project as Project).title,
                  )}
                </Link>
              )}
              {linkLabel && (
                <a
                  className="link mt-auto w-fit pt-[var(--space-lg)]"
                  href={`?${CONTACT_PREFILL_PARAM}=${encodeURIComponent(item.problem)}#contact`}
                >
                  {linkLabel}
                </a>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
