import type { Block, CollectionConfig } from 'payload'

import { Menu } from './blocks/Menu/config'
import { MenuItems } from './collections/MenuItems'

/** Registered when FEATURE_MENU is on. */
export const menuCollections: CollectionConfig[] = [MenuItems]
export const menuPageBlocks: Block[] = [Menu]
