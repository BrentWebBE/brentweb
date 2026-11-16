import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Where } from 'payload'

import type { Product, ProductCategory, Variant } from '@/payload-types'

import { PRODUCTS_TAG } from '../config'

const publishedProducts = async (where: Where | undefined, limit: number): Promise<Product[]> => {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit,
    overrideAccess: false,
    pagination: false,
    sort: 'title',
    where,
  })
  return docs
}

/** Published products, optionally filtered by category id or explicit ids. Cached by tag. */
export const getProducts = ({
  categoryID,
  ids,
  limit = 100,
}: {
  categoryID?: string
  ids?: string[]
  limit?: number
} = {}): Promise<Product[]> =>
  unstable_cache(
    async () => {
      const where: Where | undefined = ids?.length
        ? { id: { in: ids } }
        : categoryID
          ? { categories: { in: [categoryID] } }
          : undefined
      const products = await publishedProducts(where, ids?.length ? ids.length : limit)
      // Keep the editor's order for hand-picked products.
      return ids?.length
        ? ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p))
        : products
    },
    ['shop-products', categoryID ?? '', (ids ?? []).join(','), String(limit)],
    { tags: [PRODUCTS_TAG] },
  )()

export const getProductCategories = (): Promise<ProductCategory[]> =>
  unstable_cache(
    async () => {
      const payload = await getPayload({ config: configPromise })
      const { docs } = await payload.find({
        collection: 'product-categories',
        depth: 0,
        limit: 100,
        pagination: false,
        sort: 'title',
      })
      return docs
    },
    ['shop-product-categories'],
    { tags: [PRODUCTS_TAG, 'product-categories'] },
  )()

const findProductBySlug = async (slug: string, draft: boolean): Promise<Product | null> => {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'products',
    depth: 2,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: { slug: { equals: slug } },
  })
  return docs[0] ?? null
}

/** Product detail with its (published) variants populated. Drafts bypass the cache. */
export const getProductBySlug = (slug: string, draft: boolean): Promise<Product | null> =>
  draft
    ? findProductBySlug(slug, true)
    : unstable_cache(() => findProductBySlug(slug, false), ['shop-product', slug], {
        tags: [PRODUCTS_TAG],
      })()

export const productVariants = (product: Product): Variant[] =>
  (product.variants?.docs ?? []).filter((v): v is Variant => typeof v === 'object' && v !== null)

/** Lowest price of a product (its own price, or the cheapest variant), in cents. */
export const productFromPrice = (product: Product): { cents: number | null; from: boolean } => {
  if (product.enableVariants) {
    const prices = productVariants(product)
      .map((v) => v.priceInEUR)
      .filter((p): p is number => typeof p === 'number')
    if (prices.length === 0) return { cents: null, from: false }
    const min = Math.min(...prices)
    return { cents: min, from: prices.some((p) => p !== min) }
  }
  return { cents: product.priceInEUR ?? null, from: false }
}
