import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'

import { anyone } from '../access/anyone'
import { isAdminOrEditor } from '../access/isAdminOrEditor'
import { l } from '../utilities/label'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: l('Media', 'Media'),
    plural: l('Media', 'Media'),
  },
  folders: true,
  access: {
    create: isAdminOrEditor,
    delete: isAdminOrEditor,
    read: anyone,
    update: isAdminOrEditor,
  },
  admin: {
    group: l('Inhoud', 'Content'),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: l('Alternatieve tekst', 'Alt text'),
      localized: true,
      required: true,
      admin: {
        description: l(
          'Korte beschrijving van de afbeelding voor zoekmachines en schermlezers.',
          'Short description of the image for search engines and screen readers.',
        ),
      },
    },
    {
      name: 'caption',
      type: 'richText',
      label: l('Bijschrift', 'Caption'),
      localized: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    // <cwd>/public/media: the project root in dev, /app/public/media in the Docker image
    // (the standalone server chdirs to /app). In production this is a mounted volume.
    // Not derived from import.meta.url: that points into .next/ once bundled.
    staticDir: path.resolve(process.cwd(), 'public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    // Crops use the focal point set by the editor.
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'card',
        width: 800,
        height: 600,
      },
      {
        name: 'hero',
        width: 1920,
        withoutEnlargement: true,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
      },
    ],
  },
}
