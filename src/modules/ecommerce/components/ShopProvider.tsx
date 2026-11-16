'use client'

import { EcommerceProvider } from '@payloadcms/plugin-ecommerce/client/react'
import { stripeAdapterClient } from '@payloadcms/plugin-ecommerce/payments/stripe'
import React from 'react'

import { currenciesConfig } from '../config'

// The publishable key isn't needed here: the checkout loads Stripe.js itself with a key
// passed from the server at runtime.
const paymentMethods = [stripeAdapterClient({ publishableKey: '', label: 'Bancontact / kaart' })]

/** Cart + payments context. Only mounted when FEATURE_ECOMMERCE=true. */
export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <EcommerceProvider
    api={{
      cartsFetchQuery: {
        depth: 2,
        populate: {
          products: { slug: true, title: true, images: true, inventory: true, priceInEUR: true },
          variants: { title: true, inventory: true, priceInEUR: true },
        },
      },
    }}
    currenciesConfig={currenciesConfig}
    enableVariants
    paymentMethods={paymentMethods}
    syncLocalStorage={{ key: 'shop-cart' }}
  >
    {children}
  </EcommerceProvider>
)
