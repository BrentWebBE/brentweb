import React from 'react'

import type { MetricGridBlock as Props } from '@/payload-types'

export function MetricGridBlock({ metrics }: Props) {
  if (!metrics?.length) return null
  return (
    <dl className="not-prose my-[var(--space-xl)] grid gap-[var(--space-lg)] sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((m, i) => (
        <div
          className="flex flex-col-reverse border-t border-[var(--color-rule)] pt-[var(--space-md)]"
          key={m.id ?? i}
        >
          <dt className="small">{m.label}</dt>
          <dd className="figure text-[length:var(--text-2xl)] font-bold text-[var(--color-ink)]">
            {m.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
