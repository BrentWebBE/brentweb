import type { Metadata } from 'next'

import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import React, { cache } from 'react'

import type { Media } from '@/payload-types'

import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Media as MediaComponent } from '@/components/Media'
import RichText from '@/components/RichText'
import { generateMeta } from '@/utilities/generateMeta'

import { AddToCart, type VariantChoice } from '../components/AddToCart'
import { shopRoutes } from '../config'
import { getProductBySlug, productVariants } from '../utilities/queries'

export type ProductRouteArgs = { params: Promise<{ slug: string }> }

const loadProduct = cache(async (slug: string) => {
  const { isEnabled: draft } = await draftMode()
  return { product: await getProductBySlug(decodeURIComponent(slug), draft), draft }
})

export async function ProductDetail({ params }: ProductRouteArgs) {
  const { slug } = await params
  const { product, draft } = await loadProduct(slug)
  if (!product) notFound()

  const images = (product.images ?? []).filter((img): img is Media => typeof img === 'object')
  const variants: VariantChoice[] = product.enableVariants
    ? productVariants(product).map((v) => ({
        id: v.id,
        title: v.title ?? 'Variant',
        priceCents: v.priceInEUREnabled === false ? null : (v.priceInEUR ?? null),
        inventory: v.inventory ?? null,
      }))
    : []

  return (
    <article className="container pt-16 pb-24">
      {draft && <LivePreviewListener />}
      <div className="grid gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          {images[0] && (
            <MediaComponent
              imgClassName="aspect-square w-full rounded-[var(--radius)] object-cover"
              priority
              resource={images[0]}
              size="(max-width: 768px) 100vw, 50vw"
            />
          )}
          {images.length > 1 && (
            <ul className="grid grid-cols-4 gap-2">
              {images.slice(1).map((image) => (
                <li key={image.id}>
                  <MediaComponent
                    imgClassName="aspect-square w-full rounded-[var(--radius)] object-cover"
                    resource={image}
                    size="25vw"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col gap-6">
          <h1 className="font-heading text-3xl md:text-4xl">{product.title}</h1>
          <AddToCart
            inventory={product.inventory ?? null}
            priceCents={product.priceInEUREnabled === false ? null : (product.priceInEUR ?? null)}
            productID={product.id}
            variants={variants}
          />
          {product.description && <RichText data={product.description} enableGutter={false} />}
        </div>
      </div>
    </article>
  )
}

export async function productMetadata({ params }: ProductRouteArgs): Promise<Metadata> {
  const { slug } = await params
  const { product } = await loadProduct(slug)
  if (!product) return {}
  return generateMeta({ doc: product, path: shopRoutes.product(product.slug ?? slug) })
}
