import React from 'react'

import type { TextImageBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { Note } from '@/components/handmade/Note'
import { Polaroid } from '@/components/handmade/Polaroid'
import type { Locale } from '@/lib/locales'
import { cn } from '@/utilities/ui'

export function TextImageBlock({
  caption,
  eyebrow,
  image,
  imagePosition,
  links,
  locale,
  note,
  photoStyle,
  richText,
}: Props & { locale: Locale }) {
  const left = imagePosition === 'left'
  const media = image && typeof image === 'object' ? image : null

  return (
    <section className="section">
      <div className="container grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <div className={cn(left && 'md:order-2')}>
          {eyebrow && <p className="eyebrow mb-3 -rotate-2">{eyebrow}</p>}
          <RichText
            className="prose-h2:display-2 prose-h2:mt-0"
            data={richText}
            enableGutter={false}
            locale={locale}
          />
          {links && links.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {links.map(({ id, link }, i) => (
                <CMSLink
                  key={id ?? i}
                  {...link}
                  appearance={i === 0 ? 'button' : 'arrow'}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>

        {media && (
          <div className={cn('relative mx-auto w-full max-w-md', left && 'md:order-1')}>
            {photoStyle === 'plain' ? (
              <Media
                imgClassName="w-full rounded-[var(--radius)]"
                resource={media}
                size="(min-width: 768px) 28rem, 92vw"
              />
            ) : photoStyle === 'frame' ? (
              <div className="sketch-frame">
                <Media
                  imgClassName="w-full"
                  resource={media}
                  size="(min-width: 768px) 28rem, 92vw"
                />
              </div>
            ) : (
              <Polaroid caption={caption} image={media} tilt={left ? -2.5 : 2.5} />
            )}
            {note && (
              <Note
                arrow={left ? 'right' : 'left'}
                className={cn('absolute -bottom-6', left ? '-right-4' : '-left-6')}
                tilt={-4}
              >
                {note}
              </Note>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
