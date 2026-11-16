import React from 'react'

import type { FAQBlock as Props } from '@/payload-types'

import RichText from '@/components/RichText'
import { SectionHeading } from '@/components/handmade/SectionHeading'
import { fillPricesInRichText } from '@/lib/fillPricesInRichText'
import type { Locale } from '@/lib/locales'

/** Questions as folded notes: native <details>, so it works without JavaScript. */
export function FAQBlock({ heading, items, locale }: Props & { locale: Locale }) {
  return (
    <section className="section">
      <div className="container grid gap-10 lg:grid-cols-[1fr_1.7fr]">
        <SectionHeading
          className="lg:sticky lg:top-28 lg:self-start"
          heading={heading}
          locale={locale}
        />
        <div className="divide-y divide-dashed divide-border border-y border-dashed border-border">
          {items?.map((item, i) => (
            <details className="group py-2" key={item.id ?? i} name="faq">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-4 font-heading text-xl [&::-webkit-details-marker]:hidden">
                {item.question}
                <svg
                  aria-hidden="true"
                  className="mt-1 size-6 flex-none text-primary transition-transform duration-300 group-open:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2.4"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.3 4.5c-.2 5-.1 10 .1 15M4.6 11.8c5 .3 10 .2 14.8-.2" />
                </svg>
              </summary>
              <div className="pb-5 pr-10">
                <RichText
                  data={fillPricesInRichText(item.answer, locale)}
                  enableGutter={false}
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
