import React from 'react'

import type { MetricGridBlock as Props } from '@/payload-types'

export function MetricGridBlock({ metrics }: Props) {
  if (!metrics?.length) return null
  return (
    <dl className="not-prose my-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((m, i) => (
        <div className="paper-card flex flex-col-reverse px-5 py-4" key={m.id ?? i}>
          <dt className="text-sm text-muted-foreground">{m.label}</dt>
          <dd className="font-heading text-3xl text-primary">{m.value}</dd>
        </div>
      ))}
    </dl>
  )
}
