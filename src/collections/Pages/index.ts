import type { CollectionConfig } from 'payload'

import { adminOnlyTab } from '@/access/adminOnlyTab'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { CallToAction } from '@/blocks/CallToAction/config'
import { Contact } from '@/blocks/Contact/config'
import { Content } from '@/blocks/Content/config'
import { FAQ } from '@/blocks/FAQ/config'
import { Gallery } from '@/blocks/Gallery/config'
import { Hero } from '@/blocks/Hero/config'
import { OpeningHours } from '@/blocks/OpeningHours/config'
import { Services } from '@/blocks/Services/config'
import { TextImage } from '@/blocks/TextImage/config'
import { features } from '@/features'
import { blogPageBlocks } from '@/modules/blog'
import { ecommercePageBlocks } from '@/modules/ecommerce'
import { menuPageBlocks } from '@/modules/menu'
import { l } from '@/utilities/label'
import { slugField } from 'payload'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { revalidateDelete, revalidatePage } from './hooks/revalidatePage'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

const layoutBlocks = [
  Hero,
  TextImage,
  Services,
  Gallery,
  FAQ,
  CallToAction,
  OpeningHours,
  Contact,
  Content,
  ...(features.menu ? menuPageBlocks : []),
  ...(features.blog ? blogPageBlocks : []),
  ...(features.ecommerce ? ecommercePageBlocks : []),
]

export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  labels: {
    singular: l('Pagina', 'Page'),
    plural: l("Pagina's", 'Pages'),
  },
  access: {
    create: isAdminOrEditor,
    delete: isAdminOrEditor,
    read: authenticatedOrPublished,
    update: isAdminOrEditor,
  },
  // This config controls what's populated by default when a page is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'pages'>
  defaultPopulate: {
    title: true,
    slug: true,
  },
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: l('Inhoud', 'Content'),
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'pages',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'pages',
        req,
      }),
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: l('Titel', 'Title'),
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              label: l('Blokken', 'Blocks'),
              labels: {
                singular: l('Blok', 'Block'),
                plural: l('Blokken', 'Blocks'),
              },
              blocks: layoutBlocks,
              required: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
          label: l('Inhoud', 'Content'),
        },
        // SEO internals are admin-only; editors don't see this tab.
        adminOnlyTab({
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        }),
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: l('Publicatiedatum', 'Published at'),
      admin: {
        position: 'sidebar',
      },
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePage],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 20,
  },
}
