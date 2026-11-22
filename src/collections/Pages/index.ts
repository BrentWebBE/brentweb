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
import { Estimator } from '@/blocks/Estimator/config'
import { Features } from '@/blocks/Features/config'
import { PainPoints } from '@/blocks/PainPoints/config'
import { Pricing } from '@/blocks/Pricing/config'
import { PricingTable } from '@/blocks/PricingTable/config'
import { ProjectsBlock } from '@/blocks/Projects/config'
import { Services } from '@/blocks/Services/config'
import { Steps } from '@/blocks/Steps/config'
import { TestimonialsBlock } from '@/blocks/Testimonials/config'
import { TextImage } from '@/blocks/TextImage/config'
import { Timeline } from '@/blocks/Timeline/config'
import { WebsiteCheck } from '@/blocks/WebsiteCheck/config'
import { SCOPE_OPTIONS } from '@/lib/scopes'
import { features } from '@/features'
import { blogPageBlocks } from '@/modules/blog'
import { ecommercePageBlocks } from '@/modules/ecommerce'
import { menuPageBlocks } from '@/modules/menu'
import { l } from '@/utilities/label'
import { slugField } from 'payload'
import { populatePublishedAt } from '../../hooks/populatePublishedAt'
import { redirectOnSlugChange } from '../../hooks/redirectOnSlugChange'
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
  PainPoints,
  Services,
  ProjectsBlock,
  TestimonialsBlock,
  Features,
  Steps,
  Pricing,
  PricingTable,
  Estimator,
  FAQ,
  TextImage,
  Timeline,
  WebsiteCheck,
  CallToAction,
  Contact,
  Content,
  Gallery,
  OpeningHours,
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
      localized: true,
      required: true,
      admin: {
        description: l(
          'Intern en in de browsertab. De H1 staat in het Hero-blok.',
          'Internal and in the browser tab. The H1 lives in the Hero block.',
        ),
      },
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
              // Each language has its own layout: a translation can add or drop a block.
              localized: true,
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
          localized: true,
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
            {
              name: 'noIndex',
              type: 'checkbox',
              label: l('Niet indexeren (noindex)', "Don't index (noindex)"),
              admin: {
                description: l(
                  "Voor bedankpagina's en andere pagina's die niet in Google horen.",
                  "For thank-you pages and other pages that don't belong in search.",
                ),
              },
            },
          ],
        }),
        adminOnlyTab({
          name: 'structuredData',
          label: l('Structured data', 'Structured data'),
          fields: [
            {
              name: 'type',
              type: 'select',
              label: l('Soort pagina', 'Page type'),
              defaultValue: 'none',
              options: [
                { label: l('Gewone pagina', 'Regular page'), value: 'none' },
                {
                  label: l('Dienst (Service + Offer)', 'Service (Service + Offer)'),
                  value: 'service',
                },
                { label: l('Lokale pagina (regio)', 'Local page (region)'), value: 'local' },
              ],
            },
            {
              name: 'serviceName',
              type: 'text',
              label: l('Naam van de dienst', 'Service name'),
              localized: true,
              admin: { condition: (_, siblingData) => siblingData?.type === 'service' },
            },
            {
              name: 'scopes',
              type: 'select',
              hasMany: true,
              label: l('Prijsvork uit', 'Price range from'),
              options: SCOPE_OPTIONS,
              admin: { condition: (_, siblingData) => siblingData?.type === 'service' },
            },
            {
              name: 'areaServed',
              type: 'array',
              label: l('Gebied', 'Area served'),
              admin: { condition: (_, siblingData) => siblingData?.type === 'local' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'kind',
                      type: 'select',
                      defaultValue: 'City',
                      options: ['City', 'AdministrativeArea'],
                      required: true,
                    },
                    { name: 'name', type: 'text', required: true },
                  ],
                },
              ],
            },
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
    slugField({ localized: true }),
  ],
  hooks: {
    afterChange: [revalidatePage, redirectOnSlugChange('pages')],
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
