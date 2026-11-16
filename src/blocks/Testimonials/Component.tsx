import Link from 'next/link'
import React from 'react'

import type { Testimonial, TestimonialsBlock as Props } from '@/payload-types'

import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'
import { projectHref } from '@/lib/routing'
import { ui } from '@/lib/ui-strings'
import { getTestimonials } from '@/utilities/queries'

/** Real quotes on pinned paper, in the client's own words. */
export async function TestimonialsBlock({
  eyebrow,
  heading,
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

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          align={quotes.length === 1 ? 'center' : 'left'}
          eyebrow={eyebrow}
          heading={heading}
          locale={locale}
        />
        <ul
          className={quotes.length === 1 ? 'mx-auto grid max-w-2xl' : 'grid gap-10 md:grid-cols-2'}
        >
          {quotes.map((q, i) => {
            const project = q.project && typeof q.project === 'object' ? q.project : null
            return (
              <li className="relative" key={q.id} style={{ rotate: `${i % 2 ? 0.8 : -0.8}deg` }}>
                <figure className="paper-sheet relative px-7 pb-7 pt-9 md:px-10">
                  <span aria-hidden="true" className="tape" />
                  <span
                    aria-hidden="true"
                    className="absolute left-4 top-1 font-heading text-7xl leading-none text-primary/25"
                  >
                    “
                  </span>
                  <blockquote
                    className="font-heading text-xl italic leading-relaxed md:text-2xl"
                    lang={q.lang || undefined}
                  >
                    {q.quote}
                  </blockquote>
                  <figcaption className="mt-6">
                    <p className="hand text-2xl">
                      — {[q.name, q.role].filter(Boolean).join(', ') || q.business}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {q.name ? q.business : null}
                      {q.website && (
                        <>
                          {q.name ? ' · ' : ''}
                          {q.website}
                        </>
                      )}
                      {q.context && <> · {q.context}</>}
                    </p>
                    {project && (
                      <Link
                        className="link-arrow mt-3 text-sm"
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
      </div>
    </section>
  )
}
