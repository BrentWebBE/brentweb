import Link from 'next/link'
import React from 'react'

import type { Testimonial, TestimonialsBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'
import { projectHref } from '@/lib/routing'
import { ui } from '@/lib/ui-strings'
import { cn } from '@/utilities/ui'
import { getTestimonials } from '@/utilities/queries'

/**
 * Real quotes, in the client's own words, set as type: 24px, max 52ch. Each figure is
 * a two-row grid (quote, attribution) so attributions share one baseline across columns.
 */
export async function TestimonialsBlock({
  enableLink,
  heading,
  link,
  locale,
  testimonials,
}: Props & { locale: Locale }) {
  const picked = (testimonials ?? []).filter(
    (t): t is Testimonial => typeof t === 'object' && t !== null && t.visible !== false,
  )
  const list = picked.length ? picked : await getTestimonials(locale)
  const quotes = list.filter((t) => t.quote?.trim())
  if (quotes.length === 0) return null
  const t = ui(locale)
  const single = quotes.length === 1

  return (
    <section className="section-l">
      <div className="container">
        <SectionHeading heading={heading} locale={locale} />
        <ul
          className={cn(
            'grid gap-y-[var(--space-2xl)]',
            !single && 'md:grid-cols-2 md:gap-x-[var(--space-lg)]',
          )}
        >
          {quotes.map((q) => {
            const project = q.project && typeof q.project === 'object' ? q.project : null
            return (
              <li key={q.id}>
                <figure className="grid h-full grid-rows-[1fr_auto]">
                  <blockquote
                    className="max-w-[52ch] font-heading text-[length:var(--text-xl)] font-medium leading-[1.45] tracking-[-0.01em] text-[var(--color-ink)]"
                    lang={q.lang || undefined}
                    style={{ hangingPunctuation: 'first' }}
                  >
                    “{q.quote}”
                  </blockquote>
                  <figcaption className="mt-[var(--space-xl)] flex flex-wrap items-baseline gap-x-[var(--space-lg)] gap-y-[var(--space-xs)]">
                    <span className="font-medium">
                      {[q.name, q.role].filter(Boolean).join(', ') || q.business}
                    </span>
                    {q.name && <span className="small">{q.business}</span>}
                    {q.context && <span className="small">{q.context}</span>}
                    {project && (
                      <Link
                        className="link text-[length:var(--text-sm)]"
                        href={projectHref(locale, project.slug)}
                      >
                        {t.testimonialCase}
                      </Link>
                    )}
                  </figcaption>
                </figure>
              </li>
            )
          })}
        </ul>
        {/* E.g. all Google reviews, so a reader can check the quotes above against them. */}
        {enableLink && link && (
          <div className="mt-[var(--space-2xl)]">
            <CMSLink {...link} appearance="link" locale={locale} />
          </div>
        )}
      </div>
    </section>
  )
}
