import React from 'react'

import type { ContentBlock as ContentBlockProps } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import RichText from '@/components/RichText'
import type { Locale } from '@/lib/locales'
import { fillPricesInRichText } from '@/lib/fillPricesInRichText'
import { cn } from '@/utilities/ui'

const SPAN = {
  full: 'lg:col-span-12',
  half: 'lg:col-span-6',
  oneThird: 'lg:col-span-4',
  twoThirds: 'lg:col-span-8',
}

/**
 * Plain written content. A single full-width column reads as a letter (narrow measure);
 * several columns sit side by side.
 */
export function ContentBlock({ columns, locale }: ContentBlockProps & { locale: Locale }) {
  if (!columns?.length) return null
  const single = columns.length === 1 && (columns[0]?.size ?? 'full') === 'full'

  return (
    <section className="section">
      <div
        className={
          single
            ? 'container-prose'
            : 'container grid grid-cols-1 gap-x-16 gap-y-10 lg:grid-cols-12'
        }
      >
        {columns.map((col, i) => (
          <div className={cn(!single && SPAN[col.size ?? 'full'])} key={col.id ?? i}>
            {col.richText && (
              <RichText
                data={fillPricesInRichText(col.richText, locale)}
                enableGutter={false}
                locale={locale}
              />
            )}
            {col.enableLink && col.link && (
              <CMSLink {...col.link} appearance="arrow" className="mt-4" locale={locale} />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
