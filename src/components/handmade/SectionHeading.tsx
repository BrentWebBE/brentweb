import React from 'react'

import type { Locale } from '@/lib/locales'
import { fillPrices } from '@/lib/prices'
import { cn } from '@/utilities/ui'

import { Marked } from './Marked'

/** Handwritten eyebrow, a marked-up H2 and an optional intro: the top of most blocks. */
export function SectionHeading({
  align = 'left',
  as: Tag = 'h2',
  className,
  eyebrow,
  heading,
  intro,
  locale,
}: {
  align?: 'left' | 'center'
  as?: 'h1' | 'h2'
  className?: string
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
  locale: Locale
}) {
  if (!eyebrow && !heading && !intro) return null
  return (
    <header
      className={cn(
        'mb-10 flex flex-col gap-3 md:mb-14',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow && <p className="eyebrow -rotate-2">{eyebrow}</p>}
      {heading && (
        <Tag className={cn(Tag === 'h1' ? 'display-1' : 'display-2', 'max-w-3xl')}>
          <Marked text={heading} />
        </Tag>
      )}
      {intro && <p className="lede whitespace-pre-line">{fillPrices(intro, locale)}</p>}
    </header>
  )
}
