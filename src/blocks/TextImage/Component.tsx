import React from 'react'

import type { TextImageBlock as TextImageBlockProps } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

export const TextImageBlock: React.FC<TextImageBlockProps> = ({
  image,
  imagePosition,
  links,
  richText,
}) => {
  const imageLeft = imagePosition === 'left'

  return (
    <section className="container">
      <div className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
        <div className={cn({ 'md:order-2': imageLeft })}>
          {richText && <RichText data={richText} enableGutter={false} />}
          {Array.isArray(links) && links.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-4">
              {links.map(({ link }, i) => (
                <li key={i}>
                  <CMSLink {...link} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={cn({ 'md:order-1': imageLeft })}>
          {image && typeof image === 'object' && (
            <Media
              imgClassName="w-full h-auto rounded-[var(--radius)] object-cover"
              resource={image}
              size="(max-width: 768px) 100vw, 50vw"
            />
          )}
        </div>
      </div>
    </section>
  )
}
