import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

import { isAdmin } from '@/access/isAdmin'
import { isAdminUser } from '@/access/roles'
import { l } from '@/utilities/label'

/** Payments (and their refund status) are admin-only and hidden for editors. */
export const transactionsCollectionOverride: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    ...defaultCollection.admin,
    group: l('Webshop', 'Shop'),
    hidden: ({ user }) => !isAdminUser(user),
  },
})
