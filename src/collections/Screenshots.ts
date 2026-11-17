import type { CollectionConfig } from 'payload'

import path from 'path'

import { anyone } from '@/access/anyone'
import { isAdmin } from '@/access/isAdmin'
import { isAdminUser } from '@/access/roles'
import { l } from '@/utilities/label'

/**
 * Full-page screenshots of live project sites, written by the captureScreenshots job.
 * Kept apart from Media: no derived image sizes (a 12,000px-tall page overflows them),
 * nothing for editors to manage. Stored inside the media volume so they survive
 * container restarts.
 */
export const Screenshots: CollectionConfig = {
  slug: 'screenshots',
  labels: { singular: l('Screenshot', 'Screenshot'), plural: l('Screenshots', 'Screenshots') },
  access: { create: isAdmin, delete: isAdmin, read: anyone, update: isAdmin },
  admin: {
    group: l('Beheer', 'Administration'),
    hidden: ({ user }) => !isAdminUser(user),
  },
  fields: [{ name: 'alt', type: 'text', label: l('Alternatieve tekst', 'Alt text') }],
  upload: {
    staticDir: path.resolve(process.cwd(), 'public/media/screenshots'),
    mimeTypes: ['image/webp'],
    adminThumbnail: () => null,
  },
}
