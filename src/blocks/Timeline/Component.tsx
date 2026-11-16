import React from 'react'

import type { TimelineBlock as Props } from '@/payload-types'

import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'

/** Experience as a notebook: a hand-drawn rail, the period in the margin. */
export function TimelineBlock({
  eyebrow,
  groups,
  heading,
  intro,
  locale,
}: Props & { locale: Locale }) {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading eyebrow={eyebrow} heading={heading} intro={intro} locale={locale} />
        <div className="grid gap-14 lg:grid-cols-2">
          {groups?.map((group, gi) => (
            <div className={gi === 2 ? 'lg:col-span-2' : undefined} key={group.id ?? gi}>
              <h3 className="hand mb-6 -rotate-1 text-3xl text-primary">{group.label}</h3>
              <ol className="relative grid gap-8 border-l-2 border-dashed border-border pl-6">
                {group.entries?.map((entry, i) => (
                  <li className="relative" key={entry.id ?? i}>
                    <span
                      aria-hidden="true"
                      className="absolute -left-[1.95rem] top-1.5 size-3.5 rounded-full border-2 border-foreground bg-background"
                      style={entry.current ? { background: 'var(--primary)' } : undefined}
                    />
                    <p className="text-sm text-muted-foreground">{entry.period}</p>
                    <p className="font-heading text-xl">
                      {entry.title}
                      {entry.organisation && (
                        <span className="text-muted-foreground"> · {entry.organisation}</span>
                      )}
                    </p>
                    {entry.description && <p className="mt-1">{entry.description}</p>}
                    {entry.note && (
                      <p className="hand mt-1 text-xl text-primary/90">{entry.note}</p>
                    )}
                    {entry.tags && entry.tags.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {entry.tags.map((tag) => (
                          <li
                            className="rounded-full border border-border px-2.5 py-0.5 text-xs"
                            key={tag}
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
