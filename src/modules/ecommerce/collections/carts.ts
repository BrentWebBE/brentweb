import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

import { isAdminUser } from '@/access/roles'
import { l } from '@/utilities/label'

/** Carts are technical (guest sessions): visible to admins only. Access stays the plugin's. */
export const cartsCollectionOverride: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection.admin,
    group: l('Webshop', 'Shop'),
    hidden: ({ user }) => !isAdminUser(user),
  },
})
