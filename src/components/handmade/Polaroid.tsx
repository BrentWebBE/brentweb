import React from 'react'

import type { Media as MediaDoc } from '@/payload-types'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

/**
 * A photo as a polaroid taped to the page, a few degrees off straight.
 * `caption` is written underneath in handwriting.
 */
export function Polaroid({
  caption,
  className,
  image,
  priority,
  sizes = '(min-width: 1024px) 28rem, 80vw',
  tape = true,
  tilt = -2,
}: {
  caption?: string | null
  className?: string
  image: MediaDoc | string | null | undefined
  priority?: boolean
  sizes?: string
  tape?: boolean
  tilt?: number
}) {
  if (!image || typeof image !== 'object') return null
  const style = {
    '--tilt': `${tilt}deg`,
    '--tape-tilt': `${-tilt * 1.5}deg`,
  } as React.CSSProperties

  return (
    <figure className={cn('polaroid', !caption && 'pb-3', className)} style={style}>
      {tape && <span aria-hidden="true" className="tape" />}
      <Media priority={priority} resource={image} size={sizes} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
