import type { Block, CollectionConfig, Plugin } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { isAdminUser } from '@/access/roles'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { searchPlugin } from '@payloadcms/plugin-search'
import { l } from '@/utilities/label'

import { Archive } from './blocks/ArchiveBlock/config'
import { Categories } from './collections/Categories'
import { Posts } from './collections/Posts'
import { beforeSyncWithSearch } from './search/beforeSync'
import { searchFields } from './search/fieldOverrides'

/** Registered when FEATURE_BLOG is on. */
export const blogCollections: CollectionConfig[] = [Posts, Categories]

export const blogPageBlocks: Block[] = [Archive]

export const blogPlugins: Plugin[] = [
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      // The search index is generated; read stays public for the /search page,
      // the collection itself is only visible to admins.
      access: {
        delete: isAdmin,
        update: isAdmin,
      },
      admin: {
        group: l('Beheer', 'Administration'),
        hidden: ({ user }) => !isAdminUser(user),
      },
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
]
