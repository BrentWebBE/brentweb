import type { Block, CollectionConfig, Plugin, Tab } from 'payload'

import { ProductGrid } from './blocks/ProductGrid/config'
import { ProductCategories } from './collections/ProductCategories'
import { legalPagesTab } from './fields/legalPages'
import { buildEcommercePlugin } from './plugin'

/**
 * Webshop module, registered only when FEATURE_ECOMMERCE=true (see payload.config.ts).
 * Functions rather than constants: building the plugin reads the Stripe keys, which
 * sites without a shop don't have.
 */
export const ecommerceCollections = (): CollectionConfig[] => [ProductCategories]
export const ecommercePlugins = (): Plugin[] => [buildEcommercePlugin()]
export const ecommercePageBlocks: Block[] = [ProductGrid]
export const ecommerceSiteSettingsTabs: Tab[] = [legalPagesTab]
