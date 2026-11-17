'use client'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import Link from 'next/link'
import React from 'react'

import type { Cart, Media, Product, Variant } from '@/payload-types'

import { Media as MediaComponent } from '@/components/Media'
import { Button } from '@/components/ui/button'

import { shopRoutes } from '../config'
import { formatCents } from '../utilities/formatPrice'

type CartItem = NonNullable<Cart['items']>[number]

export const lineInfo = (item: CartItem) => {
  const product = typeof item.product === 'object' ? (item.product as Product | null) : null
  const variant = typeof item.variant === 'object' ? (item.variant as Variant | null) : null
  const unit = variant?.priceInEUR ?? product?.priceInEUR ?? null
  const image = (product?.images ?? []).find((img): img is Media => typeof img === 'object')
  return {
    product,
    variant,
    title: product?.title ?? 'Product',
    variantTitle: variant?.title ?? null,
    unit,
    lineTotal: typeof unit === 'number' ? unit * item.quantity : null,
    image,
  }
}

export const CartView: React.FC = () => {
  const { cart, decrementItem, incrementItem, isLoading, removeItem } = useCart()
  const items = (cart?.items ?? []).filter((item) => item.quantity > 0)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p>Je winkelmand is leeg.</p>
        <Button asChild>
          <Link href={shopRoutes.listing}>Verder winkelen</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
      <ul className="divide-y divide-border border-y border-border">
        {items.map((item) => {
          const info = lineInfo(item)
          const itemID = item.id ?? ''
          return (
            <li className="flex gap-4 py-4" key={itemID}>
              <div className="w-20 shrink-0">
                {info.image && (
                  <MediaComponent
                    imgClassName="aspect-square w-20 rounded-[var(--radius)] object-cover"
                    resource={info.image}
                    size="80px"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                {info.product?.slug ? (
                  <Link
                    className="font-medium hover:underline"
                    href={shopRoutes.product(info.product.slug)}
                  >
                    {info.title}
                  </Link>
                ) : (
                  <span className="font-medium">{info.title}</span>
                )}
                {info.variantTitle && (
                  <span className="text-sm text-muted-foreground">{info.variantTitle}</span>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    aria-label={`Eén ${info.title} minder`}
                    disabled={isLoading}
                    onClick={() => decrementItem(itemID)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    −
                  </Button>
                  <span className="w-8 text-center tabular-nums" aria-label="Aantal">
                    {item.quantity}
                  </span>
                  <Button
                    aria-label={`Eén ${info.title} meer`}
                    disabled={isLoading}
                    onClick={() => incrementItem(itemID)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    +
                  </Button>
                  <Button
                    className="ml-2"
                    disabled={isLoading}
                    onClick={() => removeItem(itemID)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Verwijderen
                  </Button>
                </div>
              </div>
              <div className="text-right tabular-nums">{formatCents(info.lineTotal)}</div>
            </li>
          )
        })}
      </ul>

      <aside className="flex h-fit flex-col gap-4 rounded-[var(--radius)] border border-border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <span className="font-medium">Totaal</span>
          <span className="text-xl font-medium tabular-nums">{formatCents(cart?.subtotal)}</span>
        </div>
        <p className="text-sm text-muted-foreground">Prijzen inclusief btw.</p>
        <Button asChild size="lg">
          <Link href={shopRoutes.checkout}>Afrekenen</Link>
        </Button>
        <Link
          className="text-center text-sm underline-offset-4 hover:underline"
          href={shopRoutes.listing}
        >
          Verder winkelen
        </Link>
      </aside>
    </div>
  )
}
