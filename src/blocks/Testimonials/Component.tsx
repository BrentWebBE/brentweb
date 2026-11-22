import Link from 'next/link'
import React from 'react'

import type { Testimonial, TestimonialsBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'
import { projectHref } from '@/lib/routing'
import { fill, ui } from '@/lib/ui-strings'
import { cn } from '@/utilities/ui'
import { getTestimonials } from '@/utilities/queries'

/** Google's "G", in its four colours: a mark the reader already knows. */
function GoogleG({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
        fill="#EA4335"
      />
    </svg>
  )
}

function Stars({ label, rating }: { label: string; rating: number }) {
  const n = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <span aria-label={label} className="flex gap-[2px]" role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          aria-hidden="true"
          className={cn('size-4', i < n ? 'text-[#F5B301]' : 'text-[var(--color-rule)]')}
          fill="currentColor"
          key={i}
          viewBox="0 0 20 20"
        >
          <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9L1.5 7.7l5.9-.8z" />
        </svg>
      ))}
    </span>
  )
}

/**
 * Real quotes, in the client's own words, each on its own card so a short quote and a long
 * one weigh the same. A Google review carries Google's mark, and its stars only as the
 * client gave them. Attributions sit on one baseline at the bottom of every card.
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
  const googleLink = enableLink && link ? link : null

  return (
    <section className="section-l">
      <div className="container">
        <div className="mb-[var(--section-head-gap)] flex flex-wrap items-end justify-between gap-x-[var(--space-xl)] gap-y-[var(--space-md)]">
          <SectionHeading className="!mb-0" heading={heading} locale={locale} />
          {/* E.g. all Google reviews, so a reader can check the quotes below against them. */}
          {googleLink && (
            <CMSLink
              {...googleLink}
              appearance="inline"
              className="inline-flex min-h-[44px] items-center gap-[var(--space-xs)] rounded-[var(--radius-pill)] border border-[var(--color-rule)] bg-[var(--color-paper)] px-[var(--space-md)] text-[length:var(--text-sm)] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink-2)]"
              label={null}
              locale={locale}
            >
              <GoogleG className="size-5 shrink-0" />
              <span>{googleLink.label}</span>
              <span aria-hidden="true">↗</span>
            </CMSLink>
          )}
        </div>
        <ul
          className={cn(
            'grid gap-[var(--space-lg)]',
            !single && 'md:grid-cols-2',
          )}
        >
          {quotes.map((q) => {
            const project = q.project && typeof q.project === 'object' ? q.project : null
            const google = q.source === 'google'
            return (
              <li key={q.id}>
                <figure className="grid h-full grid-rows-[auto_1fr_auto] rounded-[var(--radius-card)] border border-[var(--color-rule)] bg-[var(--color-paper-2)] p-[var(--space-lg)] md:p-[var(--space-xl)]">
                  <div className="mb-[var(--space-md)] flex min-h-6 flex-wrap items-center gap-x-[var(--space-sm)] gap-y-[var(--space-2xs)]">
                    {google && <GoogleG className="size-5" />}
                    {google && q.rating ? (
                      <Stars label={fill(t.stars, { n: q.rating })} rating={q.rating} />
                    ) : null}
                    {google && (
                      <span className="text-[length:var(--text-sm)] font-medium text-[var(--color-ink-2)]">
                        {t.googleReview}
                      </span>
                    )}
                  </div>
                  <blockquote
                    className="max-w-[52ch] font-heading text-[length:var(--text-lg)] font-medium leading-[1.5] tracking-[-0.01em] text-[var(--color-ink)]"
                    lang={q.lang || undefined}
                    style={{ hangingPunctuation: 'first' }}
                  >
                    “{q.quote}”
                  </blockquote>
                  <figcaption className="mt-[var(--space-lg)] flex flex-wrap items-baseline gap-x-[var(--space-md)] gap-y-[var(--space-2xs)] border-t border-[var(--color-rule)] pt-[var(--space-md)]">
                    <span className="font-semibold">
                      {[q.name, q.role].filter(Boolean).join(', ') || q.business}
                    </span>
                    {q.name && <span className="small">{q.business}</span>}
                    {q.context && <span className="small basis-full">{q.context}</span>}
                    {project && (
                      <Link
                        className="link text-[length:var(--text-sm)]"
                        href={projectHref(locale, project.slug)}
                      >
                        {t.testimonialCase}
                        <span aria-hidden="true" className="ml-[var(--space-2xs)]">
                          →
                        </span>
                      </Link>
                    )}
                  </figcaption>
                </figure>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
