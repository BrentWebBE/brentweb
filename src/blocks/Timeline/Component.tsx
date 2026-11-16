import React from 'react'

import type { TimelineBlock as Props } from '@/payload-types'

import { SectionHeading } from '@/components/handmade/SectionHeading'
import type { Locale } from '@/lib/locales'

/** Experience: the period in its own column, then what, where and what it taught me. */
export function TimelineBlock({ groups, heading, intro, locale }: Props & { locale: Locale }) {
  return (
    <section className="section-l">
      <div className="container">
        <SectionHeading heading={heading} intro={intro} locale={locale} />
        <div className="grid gap-[var(--space-3xl)]">
          {groups?.map((group, gi) => (
            <section
              aria-labelledby={`timeline-${gi}`}
              className="grid gap-[var(--space-lg)] lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] lg:gap-[var(--gap-columns)]"
              key={group.id ?? gi}
            >
              <h3 className="h-title" id={`timeline-${gi}`}>
                {group.label}
              </h3>
              <ol className="border-t border-[var(--color-rule)]">
                {group.entries?.map((entry, i) => (
                  <li
                    className="grid gap-[var(--space-2xs)] border-b border-[var(--color-rule)] py-[var(--space-lg)] sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-[var(--space-lg)]"
                    key={entry.id ?? i}
                  >
                    <p className="figure small pt-[var(--space-3xs)]">{entry.period}</p>
                    <div>
                      <p className="font-bold">
                        {entry.title}
                        {entry.organisation && (
                          <span className="font-normal text-[var(--color-ink-2)]">
                            , {entry.organisation}
                          </span>
                        )}
                      </p>
                      {entry.description && (
                        <p className="mt-[var(--space-2xs)] text-[var(--color-ink-2)]">
                          {entry.description}
                        </p>
                      )}
                      {entry.note && (
                        <p className="mt-[var(--space-2xs)] text-[var(--color-ink-2)]">
                          {entry.note}
                        </p>
                      )}
                      {entry.tags && entry.tags.length > 0 && (
                        <ul className="mt-[var(--space-sm)] flex flex-wrap gap-[var(--space-xs)]">
                          {entry.tags.map((tag) => (
                            <li
                              className="rounded-[var(--radius-pill)] bg-[var(--color-paper-2)] px-[var(--space-sm)] py-[var(--space-3xs)] text-[length:var(--text-xs)] text-[var(--color-ink-2)]"
                              key={tag}
                            >
                              {tag}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}
