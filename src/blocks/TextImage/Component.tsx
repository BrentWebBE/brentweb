import React from 'react'

import type { TextImageBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import type { Locale } from '@/lib/locales'
import { cn } from '@/utilities/ui'

/** Text beside a photograph. The caption sits under the photo; nothing is taped on. */
export function TextImageBlock({
  caption,
  image,
  imagePosition,
  links,
  locale,
  richText,
}: Props & { locale: Locale }) {
  const left = imagePosition === 'left'
  const media = image && typeof image === 'object' ? image : null

  return (
    <section className="section-l">
      <div className="container grid items-center gap-[var(--space-2xl)] md:grid-cols-2 md:gap-[var(--space-3xl)]">
        <div className={cn(left && 'md:order-2')}>
          <RichText className="rich-lead" data={richText} enableGutter={false} locale={locale} />
          {links && links.length > 0 && (
            <div className="mt-[var(--space-xl)] flex flex-wrap items-center gap-[var(--space-md)]">
              {links.map(({ id, link }, i) => (
                <CMSLink
                  key={id ?? i}
                  {...link}
                  appearance={i === 0 ? 'button' : 'ghost'}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>

        {media && (
          <figure
            className={cn(
              'mx-auto w-full max-w-md',
              left ? 'md:order-1 md:mr-auto md:ml-0' : 'md:ml-auto md:mr-0',
            )}
          >
            <Media
              imgClassName="aspect-[4/5] w-full rounded-[var(--radius-card)] object-cover"
              resource={media}
              size="(min-width: 768px) 28rem, 92vw"
            />
            {caption && <figcaption className="small mt-[var(--space-sm)]">{caption}</figcaption>}
          </figure>
        )}
      </div>
    </section>
  )
}
