import type { CountryType, CurrenciesConfig } from '@payloadcms/plugin-ecommerce/types'

/**
 * Shop-wide constants. Belgian shops: EUR only, prices include VAT.
 * Shared by server code and client components, so keep this file free of server imports.
 */
export const EUR = {
  code: 'EUR',
  decimals: 2,
  label: 'Euro',
  symbol: '€',
} as const

export const currenciesConfig: CurrenciesConfig = {
  defaultCurrency: 'EUR',
  supportedCurrencies: [EUR],
}

/** Price field the plugin generates for EUR (amount in cents). */
export const PRICE_FIELD = 'priceInEUR'

export const supportedCountries: CountryType[] = [
  { label: 'België', value: 'BE' },
  { label: 'Nederland', value: 'NL' },
  { label: 'Luxemburg', value: 'LU' },
  { label: 'Frankrijk', value: 'FR' },
  { label: 'Duitsland', value: 'DE' },
]

/** Frontend routes (app/(frontend)/shop/…). */
export const shopRoutes = {
  listing: '/shop',
  product: (slug: string) => `/shop/product/${slug}`,
  cart: '/shop/winkelmand',
  checkout: '/shop/afrekenen',
  confirmation: '/shop/bevestiging',
} as const

/** Cache tag for published products (see collections/products.ts). */
export const PRODUCTS_TAG = 'products'
