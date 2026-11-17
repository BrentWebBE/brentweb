import React from 'react'

import type { Locale } from '@/lib/locales'
import { fillPrices } from '@/lib/prices'
import { cn } from '@/utilities/ui'

import { plainText } from './Marked'

/**
 * A section's heading and its one-line intro. No eyebrow above it: the heading names
 * what follows. `split` puts the intro beside a long heading on wide screens.
 */
export function SectionHeading({
  as: Tag = 'h2',
  className,
  heading,
  intro,
  locale,
  split,
}: {
  as?: 'h1' | 'h2'
  className?: string
  heading?: string | null
  intro?: string | null
  locale: Locale
  split?: boolean
}) {
  if (!heading && !intro) return null
  return (
    <header className={cn('section-head', split && intro && 'section-head--split', className)}>
      {heading && (
        <Tag className={Tag === 'h1' ? 'display' : 'h-section'}>{plainText(heading)}</Tag>
      )}
      {intro && <p className="lede whitespace-pre-line">{fillPrices(intro, locale)}</p>}
    </header>
  )
}
