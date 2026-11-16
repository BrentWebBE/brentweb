import type { Block } from 'payload'

import { l } from '@/utilities/label'

export const ProductGrid: Block = {
  slug: 'productGrid',
  interfaceName: 'ProductGridBlock',
  labels: {
    singular: l('Productenraster', 'Product grid'),
    plural: l('Productenrasters', 'Product grids'),
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: l('Titel', 'Heading'),
    },
    {
      name: 'source',
      type: 'radio',
      label: l('Producten', 'Products'),
      defaultValue: 'category',
      options: [
        { label: l('Uit een categorie', 'From a category'), value: 'category' },
        { label: l('Zelf kiezen', 'Pick products'), value: 'selection' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'category',
      type: 'relationship',
      label: l('Categorie', 'Category'),
      relationTo: 'product-categories',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'category',
        description: l('Leeg = alle producten.', 'Empty = all products.'),
      },
    },
    {
      name: 'products',
      type: 'relationship',
      label: l('Producten', 'Products'),
      relationTo: 'products',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'selection',
      },
    },
    {
      name: 'limit',
      type: 'number',
      label: l('Maximum aantal', 'Limit'),
      defaultValue: 8,
      min: 1,
      max: 48,
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'category',
      },
    },
  ],
}
