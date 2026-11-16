'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { shopRoutes } from '../config'

/** Header cart icon with item count. */
export default function CartLink() {
  const { cart } = useCart()
  const count = (cart?.items ?? []).reduce((sum, item) => sum + (item?.quantity ?? 0), 0)

  return (
    <Link
      aria-label={count > 0 ? `Winkelmand (${count} artikels)` : 'Winkelmand'}
      className="relative inline-flex items-center text-primary"
      href={shopRoutes.cart}
    >
      <ShoppingBag aria-hidden="true" className="w-5" />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 grid min-w-5 h-5 place-items-center rounded-full bg-primary px-1 text-xs text-primary-foreground tabular-nums">
          {count}
        </span>
      )}
    </Link>
  )
}
