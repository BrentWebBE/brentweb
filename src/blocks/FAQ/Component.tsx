import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import React from 'react'

import type { FAQBlock as FAQBlockProps } from '@/payload-types'

import { JsonLd } from '@/components/JsonLd'
import RichText from '@/components/RichText'

export const FAQBlock: React.FC<FAQBlockProps> = ({ heading, items }) => {
  if (!items?.length) return null

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ answer, question }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: convertLexicalToPlaintext({ data: answer }),
      },
    })),
  }

  return (
    <section className="container">
      <div className="mx-auto max-w-3xl">
        {heading && <h2 className="font-heading text-3xl md:text-4xl mb-8">{heading}</h2>}
        <div className="divide-y divide-border border-y border-border">
          {items.map(({ answer, id, question }, i) => (
            <details className="group py-4" key={id ?? i}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                {question}
                <span
                  aria-hidden="true"
                  className="text-xl leading-none transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="pt-3 text-muted-foreground">
                <RichText data={answer} enableGutter={false} />
              </div>
            </details>
          ))}
        </div>
      </div>
      <JsonLd data={faqJsonLd} />
    </section>
  )
}
