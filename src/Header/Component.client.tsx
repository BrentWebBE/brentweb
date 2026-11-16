'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header, Media } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  businessName?: string | null
  data: Header
  logo?: Media | string | null
  /** Webshop cart icon, rendered by the server only when FEATURE_ECOMMERCE=true. */
  cart?: React.ReactNode
  showSearch?: boolean
}

export const HeaderClient: React.FC<HeaderClientProps> = ({
  businessName,
  data,
  logo,
  cart,
  showSearch,
}) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <header className="container relative z-20   " {...(theme ? { 'data-theme': theme } : {})}>
      <div className="py-8 flex justify-between">
        <Link aria-label={businessName || 'Home'} className="flex items-center" href="/">
          <Logo loading="eager" logo={logo} name={businessName} priority="high" />
        </Link>
        <HeaderNav cart={cart} data={data} showSearch={showSearch} />
      </div>
    </header>
  )
}
