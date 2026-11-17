import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { features } from '@/features'
import {
  ProductDetail,
  productMetadata,
  type ProductRouteArgs,
} from '@/modules/ecommerce/routes/ProductDetail'

export default async function Page(args: ProductRouteArgs) {
  if (!features.ecommerce) notFound()
  return <ProductDetail {...args} />
}

export async function generateMetadata(args: ProductRouteArgs): Promise<Metadata> {
  if (!features.ecommerce) return {}
  return productMetadata(args)
}
