import type { Metadata } from 'next'

import Link from 'next/link'
import React from 'react'

import { getSiteName } from '@/utilities/getSiteSettings'
import { cn } from '@/utilities/ui'

import { ProductGridList } from '../components/ProductCard'
import { shopRoutes } from '../config'
import { getProductCategories, getProducts } from '../utilities/queries'

export type ProductListingArgs = { searchParams: Promise<{ categorie?: string }> }

export async function ProductListing({ searchParams }: ProductListingArgs) {
  const { categorie } = await searchParams
  const categories = await getProductCategories()
  const active = categories.find((c) => c.slug === categorie)
  const products = await getProducts({ categoryID: active?.id })

  return (
    <div className="container pt-16 pb-24">
      <h1 className="font-heading mb-8 text-4xl">{active ? active.title : 'Shop'}</h1>
      {categories.length > 0 && (
        <nav aria-label="Categorieën" className="mb-8 flex flex-wrap gap-2">
          {[{ id: 'all', slug: undefined, title: 'Alles' }, ...categories].map((c) => {
            const isActive = (c.slug ?? undefined) === (active?.slug ?? undefined)
            return (
              <Link
                aria-current={isActive ? 'page' : undefined}
                className={cn('rounded-full border border-border px-4 py-1 text-sm', {
                  'border-primary bg-primary text-primary-foreground': isActive,
                })}
                href={
                  c.slug
                    ? `${shopRoutes.listing}?categorie=${encodeURIComponent(c.slug)}`
                    : shopRoutes.listing
                }
                key={c.id}
              >
                {c.title}
              </Link>
            )
          })}
        </nav>
      )}
      <ProductGridList products={products} />
    </div>
  )
}

export async function productListingMetadata(): Promise<Metadata> {
  const siteName = await getSiteName()
  return { title: ['Shop', siteName].filter(Boolean).join(' | ') }
}
