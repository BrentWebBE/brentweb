import Link from 'next/link'
import React from 'react'

import type { Locale } from '@/lib/locales'
import { docHref } from '@/lib/routing'
import { cn } from '@/utilities/ui'

type Reference = {
  relationTo: string
  value: { slug?: string | null } | string | number
} | null

export type CMSLinkProps = {
  /** `button` = ink-shadow primary button, `ghost` = outlined, `arrow` = text with →, `inline` = plain. */
  appearance?: 'inline' | 'button' | 'ghost' | 'arrow' | 'default' | 'outline' | 'link'
  children?: React.ReactNode
  className?: string
  label?: string | null
  locale: Locale
  newTab?: boolean | null
  reference?: Reference
  type?: 'custom' | 'reference' | null
  url?: string | null
}

/** Resolves a Payload link field (internal reference or custom URL) to an href. */
export function linkHref({
  locale,
  reference,
  type,
  url,
}: Pick<CMSLinkProps, 'locale' | 'reference' | 'type' | 'url'>): string | null {
  if (type === 'reference' && reference) {
    return docHref(locale, reference.relationTo, reference.value as never)
  }
  return url || null
}

const APPEARANCE: Record<NonNullable<CMSLinkProps['appearance']>, string> = {
  inline: '',
  // Standalone text link: .link-tap gives it a 44px tap target.
  link: 'link-hand link-tap',
  button: 'btn btn-primary',
  default: 'btn btn-primary',
  ghost: 'btn btn-ghost',
  outline: 'btn btn-ghost',
  arrow: 'link-arrow',
}

export const CMSLink: React.FC<CMSLinkProps> = (props) => {
  const { appearance = 'inline', children, className, label, newTab } = props
  const href = linkHref(props)
  if (!href) return null

  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}
  const isExternal = /^(https?:|mailto:|tel:)/.test(href)

  const content = (
    <>
      {label}
      {children}
    </>
  )

  if (isExternal) {
    return (
      <a className={cn(APPEARANCE[appearance], className)} href={href} {...newTabProps}>
        {content}
      </a>
    )
  }

  return (
    <Link className={cn(APPEARANCE[appearance], className)} href={href} {...newTabProps}>
      {content}
    </Link>
  )
}
