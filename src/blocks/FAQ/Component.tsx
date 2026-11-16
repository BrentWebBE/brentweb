import React from 'react'

import type { FAQBlock as Props } from '@/payload-types'

import RichText from '@/components/RichText'
import { plainText } from '@/components/handmade/Marked'
import { fillPricesInRichText } from '@/lib/fillPricesInRichText'
import type { Locale } from '@/lib/locales'

/** Questions that open in place: native <details>, works without JavaScript. */
export function FAQBlock({ heading, items, locale }: Props & { locale: Locale }) {
  return (
    <section className="section-l">
      <div className="container grid gap-[var(--space-xl)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] lg:gap-[var(--space-3xl)]">
        {heading && (
          <h2 className="h-section lg:sticky lg:top-[calc(var(--nav-height)+var(--space-xl))] lg:self-start">
            {plainText(heading)}
          </h2>
        )}
        <div className="border-t border-[var(--color-rule)]">
          {items?.map((item, i) => (
            <details
              className="group border-b border-[var(--color-rule)]"
              key={item.id ?? i}
              name="faq"
            >
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-[var(--space-lg)] py-[var(--space-md)] text-[length:var(--text-lg)] font-medium [&::-webkit-details-marker]:hidden">
                {item.question}
                <svg
                  aria-hidden="true"
                  className="size-5 flex-none text-[var(--color-muted)] transition-transform duration-[var(--dur-short)] ease-[var(--ease-in-out)] group-open:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 4v12M4 10h12" />
                </svg>
              </summary>
              <div className="pb-[var(--space-lg)] pr-[var(--space-2xl)] text-[var(--color-ink-2)]">
                <RichText
                  data={fillPricesInRichText(item.answer, locale)}
                  enableGutter={false}
                  enableProse={false}
                  locale={locale}
                />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
