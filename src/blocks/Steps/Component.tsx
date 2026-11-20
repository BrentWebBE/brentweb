import React from 'react'

import type { StepsBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'

/**
 * A real sequence: numbered markers on one thread, so it reads as a path a doubting
 * client can follow, with the one action at the end.
 */
export function StepsBlock({
  enableLink,
  heading,
  intro,
  link,
  locale,
  steps,
}: Props & { locale: Locale }) {
  return (
    <section className="section-l bg-[var(--color-paper-2)]">
      <div className="container">
        <SectionHeading heading={heading} intro={intro} locale={locale} />
        <ol className="relative grid gap-y-[var(--space-xl)] sm:grid-cols-2 sm:gap-x-[var(--space-lg)] lg:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
          {steps?.map((step, i) => {
            const last = i === (steps?.length ?? 0) - 1
            return (
              <li
                className="relative grid content-start grid-cols-[auto_minmax(0,1fr)] gap-x-[var(--space-md)] lg:min-w-[10rem] lg:grid-cols-1"
                key={step.id ?? i}
              >
                {/* The thread between the steps: down beside them on small screens, across on wide. */}
                {!last && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[23px] top-[48px] h-[calc(100%-48px+var(--space-xl))] w-[2px] bg-[var(--color-rule)] sm:hidden lg:left-[48px] lg:top-[23px] lg:block lg:h-[2px] lg:w-[calc(100%-48px+var(--space-lg))]"
                  />
                )}
                <span className="figure relative z-[1] grid size-12 place-items-center rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-paper)] text-[length:var(--text-md)] font-bold text-[var(--color-accent)] lg:mb-[var(--space-md)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="pt-[var(--space-sm)] lg:pt-0">
                  <h3 className="h4 mb-[var(--space-xs)]">{step.title}</h3>
                  {step.body && (
                    <p className="max-w-[36ch] leading-[1.55] text-[var(--color-ink-2)]">{step.body}</p>
                  )}
                </div>
              </li>
            )
          })}
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
