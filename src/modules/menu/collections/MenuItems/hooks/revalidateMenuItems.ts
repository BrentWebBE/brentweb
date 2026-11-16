import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

import { EXPIRE_NOW } from '@/utilities/cacheTags'

import type { MenuItem } from '@/payload-types'

/** Cache tag used by the Menu block (see modules/menu/blocks/Menu/Component.tsx). */
export const MENU_ITEMS_CACHE_TAG = 'menu-items'

export const revalidateMenuItem: CollectionAfterChangeHook<MenuItem> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  // Autosaved drafts don't change the public site.
  if (doc._status === 'published' || previousDoc?._status === 'published') {
    payload.logger.info(`Revalidating menu items`)
    revalidateTag(MENU_ITEMS_CACHE_TAG, EXPIRE_NOW)
  }

  return doc
}

export const revalidateMenuItemDelete: CollectionAfterDeleteHook<MenuItem> = ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    revalidateTag(MENU_ITEMS_CACHE_TAG, EXPIRE_NOW)
  }

  return doc
}
