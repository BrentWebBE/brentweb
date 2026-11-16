import React from 'react'

import type { ServicesBlock as ServicesBlockProps } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

const columnClasses: Record<ServicesBlockProps['columns'], string> = {
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-2 lg:grid-cols-3',
  '4': 'sm:grid-cols-2 lg:grid-cols-4',
}

export const ServicesBlock: React.FC<ServicesBlockProps> = ({ columns, heading, intro, items }) => {
  return (
    <section className="container">
      {(heading || intro) && (
        <div className="mb-10 max-w-2xl">
          {heading && <h2 className="font-heading text-3xl md:text-4xl">{heading}</h2>}
          {intro && <p className="mt-4 text-muted-foreground whitespace-pre-line">{intro}</p>}
        </div>
      )}
      <ul className={cn('grid grid-cols-1 gap-6', columnClasses[columns])}>
        {items?.map((item, i) => (
          <li
            className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card text-card-foreground"
            key={item.id ?? i}
          >
            {item.image && typeof item.image === 'object' && (
              <Media
                imgClassName="aspect-[4/3] w-full object-cover"
                resource={item.image}
                size="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            )}
            <div className="flex flex-1 flex-col gap-3 p-6">
              <h3 className="font-heading text-xl">{item.title}</h3>
              {item.description && (
                <p className="text-muted-foreground whitespace-pre-line">{item.description}</p>
              )}
              {item.enableLink && item.link && (
                <div className="mt-auto pt-2">
                  <CMSLink {...item.link} appearance="link" className="px-0" />
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
