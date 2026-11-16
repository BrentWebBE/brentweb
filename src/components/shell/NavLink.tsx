'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { cn } from '@/utilities/ui'

/** A nav link; the current section is ink with an underline, the rest a step quieter. */
export function NavLink({
  children,
  className,
  href,
  onNavigate,
}: {
  children: React.ReactNode
  className?: string
  href: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const active =
    pathname === href || (href.split('/').length > 2 && pathname.startsWith(`${href}/`))

  return (
    <Link
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex min-h-[44px] items-center whitespace-nowrap rounded-[var(--radius-control)] px-[var(--space-sm)] font-medium text-[var(--color-ink-2)] decoration-2 underline-offset-[0.5em] transition-colors duration-[var(--dur-short)] hover:text-[var(--color-ink)]',
        active && 'text-[var(--color-ink)] underline decoration-[var(--color-accent)]',
        className,
      )}
      href={href}
      onClick={onNavigate}
    >
      {children}
    </Link>
  )
}
