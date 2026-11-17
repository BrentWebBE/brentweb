import React from 'react'

import type { CalloutBlock as Props } from '@/payload-types'

/** An aside in a case study, in a tinted well. */
export function CalloutBlock({ text }: Props) {
  return (
    <aside className="not-prose well my-[var(--space-xl)] p-[var(--space-lg)] md:p-[var(--space-xl)]">
      <p className="text-[length:var(--text-lg)] leading-relaxed text-[var(--color-ink)]">{text}</p>
    </aside>
  )
}
