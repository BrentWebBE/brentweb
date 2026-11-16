import React from 'react'

import type { PainPointsBlock as Props } from '@/payload-types'

import { Reveal } from '@/components/handmade/Reveal'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'
import { CONTACT_PREFILL_PARAM } from '@/lib/routing'
import { ui } from '@/lib/ui-strings'

const TILTS = [-1.2, 0.8, -0.5, 1.1, -0.9, 0.6]

/** "Klinkt dit bekend?" Each card: the problem as the client would say it, then the fix. */
export function PainPointsBlock({
  eyebrow,
  heading,
  items,
  linkLabel,
  locale,
}: Props & { locale: Locale }) {
  const t = ui(locale)
  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={eyebrow} heading={heading} locale={locale} />
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items?.map((item, i) => (
            <Reveal
              as="li"
              className="paper-card flex flex-col p-6"
              key={item.id ?? i}
              tilt={TILTS[i % TILTS.length]}
            >
              <p className="font-heading text-2xl leading-snug">“{item.problem}”</p>
              <div aria-hidden="true" className="squiggle my-5" />
              <p className="hand text-xl text-primary">{t.painFixLabel}</p>
              <p className="mt-1 text-muted-foreground">{item.fix}</p>
              {linkLabel && (
                <a
                  className="link-arrow mt-auto pt-5"
                  href={`?${CONTACT_PREFILL_PARAM}=${encodeURIComponent(item.problem)}#contact`}
                >
                  {linkLabel}
                </a>
              )}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
