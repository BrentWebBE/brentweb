import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import React from 'react'

import type { MenuBlock as MenuBlockProps, MenuItem } from '@/payload-types'

import { features } from '@/features'
import { cn } from '@/utilities/ui'

import { MENU_ITEMS_CACHE_TAG } from '../../collections/MenuItems/hooks/revalidateMenuItems'
import { formatPrice } from '../../utilities/formatPrice'

const getPublishedMenuItems = unstable_cache(
  async (): Promise<MenuItem[]> => {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'menu-items',
      depth: 0,
      draft: false,
      limit: 0,
      overrideAccess: false,
      pagination: false,
      sort: ['sortOrder', 'name'],
    })
    return docs
  },
  [MENU_ITEMS_CACHE_TAG],
  { tags: [MENU_ITEMS_CACHE_TAG] },
)

type Group = { category: string; items: MenuItem[] }

const groupByCategory = (items: MenuItem[]): Group[] => {
  const groups = new Map<string, MenuItem[]>()
  for (const item of items) {
    const list = groups.get(item.category) ?? []
    list.push(item)
    groups.set(item.category, list)
  }
  return Array.from(groups, ([category, list]) => ({ category, items: list }))
}

export const MenuBlock: React.FC<MenuBlockProps> = async ({
  categories,
  heading,
  intro,
  showUnavailable,
}) => {
  if (!features.menu) return null

  const allItems = await getPublishedMenuItems()
  const categoryFilter = (categories ?? []).map((c) => c.trim().toLowerCase())

  const items = allItems.filter(
    (item) =>
      (showUnavailable || item.available !== false) &&
      (categoryFilter.length === 0 || categoryFilter.includes(item.category.trim().toLowerCase())),
  )

  let groups = groupByCategory(items)
  if (categoryFilter.length > 0) {
    // Follow the order chosen in the block.
    groups = groups.sort(
      (a, b) =>
        categoryFilter.indexOf(a.category.trim().toLowerCase()) -
        categoryFilter.indexOf(b.category.trim().toLowerCase()),
    )
  }

  return (
    <section className="container">
      <div className="mx-auto max-w-3xl">
        {heading && <h2 className="font-heading text-3xl md:text-4xl mb-4">{heading}</h2>}
        {intro && <p className="text-muted-foreground mb-10 whitespace-pre-line">{intro}</p>}

        {groups.length === 0 && (
          <p className="text-muted-foreground">De menukaart wordt binnenkort aangevuld.</p>
        )}

        <div className="flex flex-col gap-12">
          {groups.map(({ category, items: groupItems }) => (
            <div key={category}>
              <h3 className="font-heading text-2xl border-b border-border pb-2 mb-6">{category}</h3>
              <ul className="flex flex-col gap-6">
                {groupItems.map((item) => {
                  const unavailable = item.available === false
                  const price = formatPrice(item.price)
                  return (
                    <li key={item.id} className={cn({ 'opacity-60': unavailable })}>
                      <div className="flex items-baseline gap-4">
                        <span className={cn('font-medium', { 'line-through': unavailable })}>
                          {item.name}
                        </span>
                        <span
                          aria-hidden="true"
                          className="flex-1 border-b border-dotted border-border translate-y-[-0.25em]"
                        />
                        <span className="font-medium tabular-nums">{price ?? 'Dagprijs'}</span>
                      </div>
                      {item.description && (
                        <p className="text-muted-foreground mt-1 text-sm">{item.description}</p>
                      )}
                      {(item.allergens || unavailable) && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {unavailable && <span className="mr-2">Niet beschikbaar</span>}
                          {item.allergens && <span>Allergenen: {item.allergens}</span>}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
