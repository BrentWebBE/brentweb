import React from 'react'

import type { ProductGridBlock as ProductGridBlockProps } from '@/payload-types'

import { features } from '@/features'

import { ProductGridList } from '../../components/ProductCard'
import { getProducts } from '../../utilities/queries'

const idOf = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : value && typeof value === 'object' && 'id' in value ? String(value.id) : undefined

export const ProductGridBlock: React.FC<ProductGridBlockProps> = async ({
  category,
  heading,
  limit,
  products,
  source,
}) => {
  if (!features.ecommerce) return null

  const items =
    source === 'selection'
      ? await getProducts({ ids: (products ?? []).map(idOf).filter((id): id is string => Boolean(id)) })
      : await getProducts({ categoryID: idOf(category), limit: limit ?? 8 })

  return (
    <section className="container">
      {heading && <h2 className="font-heading mb-8 text-3xl md:text-4xl">{heading}</h2>}
      <ProductGridList products={items} />
    </section>
  )
}
