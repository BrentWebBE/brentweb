import type { Plugin } from 'payload'

import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'

import { l } from '@/utilities/label'

import { ecommerceAccess } from './access'
import { cartsCollectionOverride } from './collections/carts'
import { ordersCollectionOverride } from './collections/orders'
import { productsCollectionOverride, revalidateProducts } from './collections/products'
import { transactionsCollectionOverride } from './collections/transactions'
import { currenciesConfig, supportedCountries } from './config'
import { shopStripeAdapter } from './payments/stripeAdapter'

/** @payloadcms/plugin-ecommerce configured for Belgian shops (EUR, incl. VAT, Stripe). */
export const buildEcommercePlugin = (): Plugin =>
  ecommercePlugin({
    access: ecommerceAccess,
    addresses: { supportedCountries },
    carts: { allowGuestCarts: true, cartsCollectionOverride },
    currencies: currenciesConfig,
    customers: { slug: 'users' },
    orders: { ordersCollectionOverride },
    payments: { paymentMethods: [shopStripeAdapter()] },
    products: {
      productsCollectionOverride,
      variants: {
        variantsCollectionOverride: ({ defaultCollection }) => ({
          ...defaultCollection,
          labels: { singular: l('Variant', 'Variant'), plural: l('Varianten', 'Variants') },
          hooks: {
            ...defaultCollection.hooks,
            afterChange: [...(defaultCollection.hooks?.afterChange ?? []), revalidateProducts],
            afterDelete: [...(defaultCollection.hooks?.afterDelete ?? []), revalidateProducts],
          },
        }),
      },
    },
    transactions: { transactionsCollectionOverride },
  })
