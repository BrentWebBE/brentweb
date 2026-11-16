import React from 'react'

import type { StepsBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'

/** A real sequence: the steps in order, numbered, with the one action at the end. */
export function StepsBlock({
  enableLink,
  heading,
  intro,
  link,
  locale,
  steps,
}: Props & { locale: Locale }) {
  return (
    <section className="section-l">
      <div className="container">
        <SectionHeading heading={heading} intro={intro} locale={locale} />
        <ol className="grid gap-y-[var(--space-xl)] sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))] lg:gap-x-[var(--space-lg)]">
          {steps?.map((step, i) => (
            <li
              className="border-t border-[var(--color-rule)] pt-[var(--space-md)] lg:min-w-[10rem]"
              key={step.id ?? i}
            >
              <span className="figure mb-[var(--space-sm)] block text-[length:var(--text-sm)] font-bold text-[var(--color-accent)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mb-[var(--space-2xs)] text-[length:var(--text-lg)] font-bold tracking-[-0.01em]">
                {step.title}
              </h3>
              {step.body && <p className="text-[var(--color-ink-2)]">{step.body}</p>}
            </li>
          ))}
        </ol>
        {enableLink && link && (
          <div className="mt-[var(--space-2xl)]">
            <CMSLink {...link} appearance="button" locale={locale} />
          </div>
        )}
      </div>
    </section>
  )
}
