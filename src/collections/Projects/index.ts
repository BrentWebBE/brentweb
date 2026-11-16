import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

import { adminOnlyTab } from '@/access/adminOnlyTab'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { isAdminOrEditor } from '@/access/isAdminOrEditor'
import { caseStudyLexical } from '@/fields/caseStudyLexical'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { l } from '@/utilities/label'

import { revalidateProject, revalidateProjectDelete } from './hooks/revalidateProject'

/**
 * Case studies. One document per project, in both languages. The business story is
 * the main write-up; the technical side (stack, decisions, the longer engineering
 * write-up) sits in its own tab and shows as a collapsible section on the page.
 */
export const Projects: CollectionConfig<'projects'> = {
  slug: 'projects',
  labels: {
    singular: l('Project', 'Project'),
    plural: l('Projecten', 'Projects'),
  },
  access: {
    create: isAdminOrEditor,
    delete: isAdminOrEditor,
    read: authenticatedOrPublished,
    update: isAdminOrEditor,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    client: true,
    sector: true,
    period: true,
    status: true,
    abstract: true,
    technical: { tags: true },
    cover: true,
    liveUrl: true,
  },
  defaultSort: 'order',
  admin: {
    defaultColumns: ['title', 'sector', 'status', 'order', 'updatedAt'],
    group: l('Inhoud', 'Content'),
    useAsTitle: 'title',
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({ slug: data?.slug, collection: 'projects', req }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({ slug: data?.slug as string, collection: 'projects', req }),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: l('Titel', 'Title'),
      localized: true,
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: l('Overzicht', 'Overview'),
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'client',
                  type: 'text',
                  label: l('Klant', 'Client'),
                  admin: { width: '34%' },
                },
                {
                  name: 'sector',
                  type: 'text',
                  label: l('Soort project', 'Kind of project'),
                  localized: true,
                  admin: { width: '33%', placeholder: 'Klantwebsite' },
                },
                {
                  name: 'period',
                  type: 'text',
                  label: l('Periode', 'Period'),
                  localized: true,
                  admin: { width: '33%', placeholder: '2021 - nu' },
                },
              ],
            },
            {
              name: 'abstract',
              type: 'textarea',
              label: l('Korte samenvatting (voor kaartjes)', 'Short summary (for cards)'),
              localized: true,
              required: true,
            },
            {
              name: 'summary',
              type: 'textarea',
              label: l('Inleiding op de projectpagina', 'Intro on the project page'),
              localized: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'cover',
                  type: 'upload',
                  relationTo: 'media',
                  label: l('Screenshot', 'Screenshot'),
                  admin: { width: '50%' },
                },
                {
                  name: 'coverMobile',
                  type: 'upload',
                  relationTo: 'media',
                  label: l('Screenshot op gsm (optioneel)', 'Phone screenshot (optional)'),
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'metrics',
              type: 'array',
              label: l('Cijfers', 'Metrics'),
              localized: true,
              maxRows: 4,
              admin: {
                initCollapsed: true,
                description: l('Enkel echte cijfers.', 'Real figures only.'),
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'value', type: 'text', label: l('Waarde', 'Value'), required: true },
                    {
                      name: 'label',
                      type: 'text',
                      label: l('Omschrijving', 'Label'),
                      required: true,
                    },
                  ],
                },
              ],
            },
            {
              name: 'outcomes',
              type: 'text',
              hasMany: true,
              label: l('Wat het opleverde', 'Outcomes'),
              localized: true,
            },
            {
              name: 'body',
              type: 'richText',
              label: l('Het verhaal', 'The story'),
              localized: true,
              editor: caseStudyLexical,
              admin: {
                description: l(
                  'Het probleem, de aanpak, het resultaat. Leeg laten als er nog geen uitwerking is.',
                  'The problem, the approach, the result. Leave empty if there is no write-up yet.',
                ),
              },
            },
          ],
        },
        {
          name: 'technical',
          label: l('Technisch', 'Technical'),
          fields: [
            { name: 'tags', type: 'text', hasMany: true, label: l('Stack', 'Stack') },
            {
              name: 'summary',
              type: 'textarea',
              label: l('Technische samenvatting', 'Technical summary'),
              localized: true,
            },
            {
              name: 'decisions',
              type: 'text',
              hasMany: true,
              label: l('Belangrijkste keuzes', 'Key decisions'),
              localized: true,
            },
            {
              name: 'body',
              type: 'richText',
              label: l('Technische uitwerking', 'Technical write-up'),
              localized: true,
              editor: caseStudyLexical,
            },
            { name: 'githubUrl', type: 'text', label: l('Broncode (URL)', 'Source code (URL)') },
          ],
        },
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
    {
      name: 'status',
      type: 'select',
      label: l('Status', 'Status'),
      defaultValue: 'active',
      options: [
        { label: l('Online', 'Live'), value: 'active' },
        { label: l('Actief onderhouden', 'Actively maintained'), value: 'maintained' },
        { label: l('Afgerond', 'Finished'), value: 'finished' },
        { label: l('Gearchiveerd', 'Archived'), value: 'decommissioned' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'liveUrl',
      type: 'text',
      label: l('Live site (URL)', 'Live site (URL)'),
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      label: l('Volgorde', 'Order'),
      defaultValue: 10,
      admin: {
        position: 'sidebar',
        description: l('Laagste eerst in lijsten.', 'Lowest first in lists.'),
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: l('Publicatiedatum', 'Published at'),
      admin: { position: 'sidebar' },
    },
    slugField({ position: 'sidebar' }),
  ],
  hooks: {
    afterChange: [revalidateProject],
    beforeChange: [populatePublishedAt],
    afterDelete: [revalidateProjectDelete],
  },
  versions: {
    drafts: { autosave: { interval: 100 }, schedulePublish: true },
    maxPerDoc: 20,
  },
}
