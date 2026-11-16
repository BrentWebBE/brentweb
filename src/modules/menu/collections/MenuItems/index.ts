import type { CollectionConfig } from 'payload'

import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { l } from '@/utilities/label'

import { revalidateMenuItem, revalidateMenuItemDelete } from './hooks/revalidateMenuItems'

export const MenuItems: CollectionConfig<'menu-items'> = {
  slug: 'menu-items',
  labels: {
    singular: l('Menu-item', 'Menu item'),
    plural: l('Menukaart', 'Menu items'),
  },
  access: {
    create: isAdminOrEditor,
    delete: isAdminOrEditor,
    read: authenticatedOrPublished,
    update: isAdminOrEditor,
  },
  admin: {
    defaultColumns: ['name', 'category', 'price', 'available', 'sortOrder'],
    group: l('Inhoud', 'Content'),
    listSearchableFields: ['name', 'category', 'description'],
    useAsTitle: 'name',
  },
  defaultSort: ['category', 'sortOrder', 'name'],
  fields: [
    {
      name: 'name',
      type: 'text',
      label: l('Naam', 'Name'),
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: l('Omschrijving', 'Description'),
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          label: l('Prijs (EUR)', 'Price (EUR)'),
          min: 0,
          admin: {
            step: 0.1,
            width: '33%',
            description: l('Leeg laten voor "dagprijs".', 'Leave empty for "market price".'),
          },
        },
        {
          name: 'category',
          type: 'text',
          label: l('Categorie', 'Category'),
          required: true,
          index: true,
          admin: {
            width: '67%',
            description: l(
              'bv. Voorgerechten, Hoofdgerechten, Dranken. Items met dezelfde categorie worden gegroepeerd.',
              'e.g. Starters, Mains, Drinks. Items with the same category are grouped.',
            ),
          },
        },
      ],
    },
    {
      name: 'allergens',
      type: 'text',
      label: l('Allergenen', 'Allergens'),
      admin: {
        placeholder: 'gluten, lactose, noten',
      },
    },
    {
      name: 'available',
      type: 'checkbox',
      label: l('Beschikbaar', 'Available'),
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: l(
          'Uitvinken om tijdelijk te verbergen op de site.',
          'Uncheck to temporarily hide on the site.',
        ),
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: l('Volgorde', 'Sort order'),
      defaultValue: 0,
      index: true,
      admin: {
        position: 'sidebar',
        description: l('Laag getal = hoger in de lijst.', 'Lower number = higher in the list.'),
      },
    },
  ],
  hooks: {
    afterChange: [revalidateMenuItem],
    afterDelete: [revalidateMenuItemDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 375,
      },
    },
    maxPerDoc: 20,
  },
}
