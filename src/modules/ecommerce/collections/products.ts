import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Field } from 'payload'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { revalidateTag } from 'next/cache'
import { slugField } from 'payload'

import { adminOnlyTab } from '@/access/adminOnlyTab'
import { EXPIRE_NOW } from '@/utilities/cacheTags'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { l } from '@/utilities/label'

import { PRODUCTS_TAG } from '../config'

export const revalidateProducts: CollectionAfterChangeHook & CollectionAfterDeleteHook = ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) revalidateTag(PRODUCTS_TAG, EXPIRE_NOW)
  return doc
}

/** Price/inventory/variant fields from the plugin, with a VAT note for editors. */
const withVatNote = (fields: Field[]): Field[] =>
  fields.map((field) =>
    field.type === 'group' && !('name' in field && field.name)
      ? {
          ...field,
          admin: {
            ...field.admin,
            description: l('Alle prijzen zijn inclusief btw.', 'All prices include VAT.'),
          },
        }
      : field,
  )

export const productsCollectionOverride: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection.admin,
    defaultColumns: ['title', 'priceInEUR', 'enableVariants', '_status', 'updatedAt'],
    group: l('Webshop', 'Shop'),
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({ slug: data?.slug, collection: 'products', req }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({ slug: data?.slug as string, collection: 'products', req }),
    useAsTitle: 'title',
  },
  defaultPopulate: {
    title: true,
    slug: true,
    images: true,
    priceInEUR: true,
    priceInEUREnabled: true,
    enableVariants: true,
    inventory: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: l('Naam', 'Title'),
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: l('Product', 'Product'),
          fields: [
            {
              name: 'description',
              type: 'richText',
              label: l('Omschrijving', 'Description'),
              editor: lexicalEditor({
                features: ({ rootFeatures }) => [
                  ...rootFeatures,
                  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
                  FixedToolbarFeature(),
                  InlineToolbarFeature(),
                ],
              }),
            },
            {
              name: 'images',
              type: 'upload',
              label: l('Afbeeldingen', 'Images'),
              relationTo: 'media',
              hasMany: true,
              admin: {
                description: l(
                  'De eerste afbeelding is de hoofdfoto.',
                  'The first image is the main photo.',
                ),
              },
            },
            {
              name: 'categories',
              type: 'relationship',
              label: l('Categorieën', 'Categories'),
              relationTo: 'product-categories',
              hasMany: true,
            },
          ],
        },
        {
          label: l('Prijs & voorraad', 'Price & stock'),
          fields: withVatNote(defaultCollection.fields),
        },
        adminOnlyTab({
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({ hasGenerateFn: true }),
            MetaImageField({ relationTo: 'media' }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        }),
      ],
    },
    slugField(),
  ],
  hooks: {
    ...defaultCollection.hooks,
    afterChange: [...(defaultCollection.hooks?.afterChange ?? []), revalidateProducts],
    afterDelete: [...(defaultCollection.hooks?.afterDelete ?? []), revalidateProducts],
  },
  versions: {
    drafts: {
      autosave: { interval: 375 },
    },
    maxPerDoc: 20,
  },
})
