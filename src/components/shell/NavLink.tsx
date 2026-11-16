'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { cn } from '@/utilities/ui'

/** A nav item that gets a hand-drawn underline when it's the current section. */
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
        'relative rounded-lg px-3 py-2 font-medium text-foreground/80 transition-colors hover:text-foreground',
        active && 'text-foreground',
        className,
      )}
      href={href}
      onClick={onNavigate}
    >
      {children}
      {active && (
        <svg
          aria-hidden="true"
          className="absolute inset-x-3 -bottom-0.5 h-2 text-primary"
          preserveAspectRatio="none"
          viewBox="0 0 100 8"
        >
          <path
            d="M2 5.5C20 2.5 45 3 60 4s28 1.6 38-1"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </Link>
  )
}
