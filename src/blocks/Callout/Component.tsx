import React from 'react'

import type { CalloutBlock as Props } from '@/payload-types'

/** An aside in a case study: a sheet of paper pinned at a slight angle. */
export function CalloutBlock({ text }: Props) {
  return (
    <aside className="not-prose paper-sheet relative my-10 -rotate-[0.6deg] px-6 py-5 md:px-8">
      <span aria-hidden="true" className="tape" />
      <p className="text-lg leading-relaxed">{text}</p>
    </aside>
  )
}
