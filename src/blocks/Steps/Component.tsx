import React from 'react'

import type { StepsBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'

/** Numbered steps on a dashed path, each number circled by hand. */
export function StepsBlock({
  enableLink,
  eyebrow,
  heading,
  intro,
  link,
  locale,
  steps,
}: Props & { locale: Locale }) {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} locale={locale} />
        <ol className="relative grid gap-8 md:grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] md:gap-6">
          <span
            aria-hidden="true"
            className="absolute left-[1.35rem] top-2 bottom-2 border-l-2 border-dashed border-border md:inset-x-6 md:top-[1.35rem] md:bottom-auto md:border-l-0 md:border-t-2"
          />
          {steps?.map((step, i) => (
            <li className="relative flex gap-4 md:flex-col" key={step.id ?? i}>
              <span className="step-number bg-background">{i + 1}</span>
              <div>
                <h3 className="font-heading text-xl">{step.title}</h3>
                {step.body && <p className="mt-1 text-muted-foreground">{step.body}</p>}
              </div>
            </li>
          ))}
        </ol>
        {enableLink && link && (
          <div className="mt-10">
            <CMSLink {...link} appearance="button" locale={locale} />
          </div>
        )}
      </div>
    </section>
  )
}
