import React from 'react'

import type { GalleryBlock as GalleryBlockProps, Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'

const columnClasses: Record<GalleryBlockProps['columns'], string> = {
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
}

export const GalleryBlock: React.FC<GalleryBlockProps> = ({ columns, heading, images }) => {
  const resolved = (images ?? []).filter((img): img is MediaType => typeof img === 'object')

  if (resolved.length === 0) return null

  return (
    <section className="container">
      {heading && <h2 className="font-heading text-3xl md:text-4xl mb-8">{heading}</h2>}
      <ul className={cn('grid gap-4', columnClasses[columns])}>
        {resolved.map((image) => (
          <li key={image.id}>
            <figure>
              <Media
                imgClassName="aspect-square w-full rounded-[var(--radius)] object-cover"
                resource={image}
                size="(max-width: 768px) 50vw, 33vw"
              />
              {image.caption && (
                <figcaption className="mt-2 text-sm text-muted-foreground">
                  <RichText data={image.caption} enableGutter={false} enableProse={false} />
                </figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
