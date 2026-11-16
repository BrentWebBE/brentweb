import Link from 'next/link'
import React from 'react'

import type { Media, Product } from '@/payload-types'

import { Media as MediaComponent } from '@/components/Media'

import { shopRoutes } from '../config'
import { formatCents } from '../utilities/formatPrice'
import { productFromPrice } from '../utilities/queries'

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const image = (product.images ?? []).find((img): img is Media => typeof img === 'object')
  const { cents, from } = productFromPrice(product)
  const soldOut = !product.enableVariants && product.inventory === 0

  return (
    <Link
      className="group flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card text-card-foreground"
      href={shopRoutes.product(product.slug ?? '')}
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {image && (
          <MediaComponent
            imgClassName="h-full w-full object-cover transition-transform group-hover:scale-105"
            pictureClassName="block h-full"
            resource={image}
            size="(max-width: 640px) 50vw, 25vw"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-medium">{product.title}</h3>
        <p className="text-sm tabular-nums text-muted-foreground">
          {soldOut
            ? 'Uitverkocht'
            : cents !== null
              ? `${from ? 'vanaf ' : ''}${formatCents(cents)}`
              : ''}
        </p>
      </div>
    </Link>
  )
}

export const ProductGridList: React.FC<{ products: Product[] }> = ({ products }) =>
  products.length === 0 ? (
    <p className="text-muted-foreground">Er zijn nog geen producten.</p>
  ) : (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
