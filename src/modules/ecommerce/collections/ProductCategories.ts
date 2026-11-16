import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { l } from '@/utilities/label'
import { slugField } from 'payload'

export const ProductCategories: CollectionConfig<'product-categories'> = {
  slug: 'product-categories',
  labels: {
    singular: l('Productcategorie', 'Product category'),
    plural: l('Productcategorieën', 'Product categories'),
  },
  access: {
    create: isAdminOrEditor,
    delete: isAdminOrEditor,
    read: anyone,
    update: isAdminOrEditor,
  },
  admin: {
    group: l('Webshop', 'Shop'),
    useAsTitle: 'title',
  },
  defaultSort: 'title',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: l('Naam', 'Name'),
      required: true,
    },
    slugField({ position: undefined }),
  ],
}
