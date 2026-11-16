import type { Metadata } from 'next'

import { notFound } from 'next/navigation'

import { features } from '@/features'
import {
  ProductListing,
  productListingMetadata,
  type ProductListingArgs,
} from '@/modules/ecommerce/routes/ProductListing'

export default async function Page(args: ProductListingArgs) {
  if (!features.ecommerce) notFound()
  return <ProductListing {...args} />
}

export async function generateMetadata(): Promise<Metadata> {
  if (!features.ecommerce) return {}
  return productListingMetadata()
}
