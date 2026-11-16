import React from 'react'

import type { CallToActionBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import RichText from '@/components/RichText'
import { contentLocale, type Locale } from '@/lib/locales'

/** A tinted band: a sentence or two on the left, the action on the right. */
export function CallToActionBlock({
  links,
  locale = contentLocale,
  richText,
}: Props & { locale?: Locale }) {
  return (
    <section className="section">
      <div className="container">
        <div className="well grid gap-[var(--space-lg)] p-[var(--space-xl)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-[var(--space-2xl)] md:p-[var(--space-2xl)]">
          {richText && (
            <RichText
              className="rich-cta max-w-[56ch]"
              data={richText}
              enableGutter={false}
              enableProse={false}
              locale={locale}
            />
          )}
          <div className="flex flex-wrap items-center gap-[var(--space-md)]">
            {(links ?? []).map(({ id, link }, i) => (
              <CMSLink
                key={id ?? i}
                {...link}
                appearance={i === 0 ? 'button' : 'link'}
                locale={locale}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
