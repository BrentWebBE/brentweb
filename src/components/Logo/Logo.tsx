import clsx from 'clsx'
import React from 'react'

import type { Media } from '@/payload-types'

import { getMediaUrl } from '@/utilities/getMediaUrl'

interface Props {
  className?: string
  /** SiteSettings.logo (populated). Falls back to the business name as text. */
  logo?: Media | string | null
  name?: string | null
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { className, loading = 'lazy', logo, name, priority = 'low' } = props

  if (logo && typeof logo === 'object' && logo.url) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        alt={logo.alt || name || ''}
        className={clsx('h-10 w-auto max-w-[12rem] object-contain', className)}
        decoding="async"
        fetchPriority={priority}
        height={logo.height ?? undefined}
        loading={loading}
        src={getMediaUrl(logo.url, logo.updatedAt)}
        width={logo.width ?? undefined}
      />
    )
  }

  return <span className={clsx('font-heading text-xl font-semibold', className)}>{name}</span>
}
