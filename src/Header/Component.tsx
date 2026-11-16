import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import { features } from '@/features'
import CartLink from '@/modules/ecommerce/components/CartLink'
import React from 'react'

export async function Header() {
  const [headerData, settings] = await Promise.all([
    getCachedGlobal('header', 1)(),
    getSiteSettings(),
  ])

  return (
    <HeaderClient
      businessName={settings?.businessName}
      data={headerData}
      logo={settings?.logo}
      cart={features.ecommerce ? <CartLink /> : undefined}
      showSearch={features.blog}
    />
  )
}
