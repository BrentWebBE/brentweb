import React from 'react'

import type { CallToActionBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import RichText from '@/components/RichText'
import { contentLocale, type Locale } from '@/lib/locales'

/** A card pinned to the page, with one or two links. */
export function CallToActionBlock({
  links,
  locale = contentLocale,
  richText,
}: Props & { locale?: Locale }) {
  return (
    <section className="section">
      <div className="container">
        <div className="paper-card relative mx-auto flex max-w-4xl flex-col gap-8 p-8 md:flex-row md:items-center md:justify-between md:p-12">
          <span aria-hidden="true" className="tape" />
          <div className="max-w-xl">
            {richText && (
              <RichText
                className="prose-h2:mt-0 prose-h3:mt-0"
                data={richText}
                enableGutter={false}
                locale={locale}
              />
            )}
          </div>
          <div className="flex flex-col gap-3">
            {(links ?? []).map(({ id, link }, i) => (
              <CMSLink
                key={id ?? i}
                {...link}
                appearance={i === 0 ? 'button' : 'arrow'}
                locale={locale}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
