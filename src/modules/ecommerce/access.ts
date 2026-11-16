import type { Access, FieldAccess } from 'payload'

import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { isAdmin } from '@/access/isAdmin'
import { hasRole, isAdminUser } from '@/access/roles'

/** CMS staff: admins and editors. */
export const isStaff: Access = ({ req: { user } }) => hasRole(user, 'admin', 'editor')
export const isStaffField: FieldAccess = ({ req: { user } }) => hasRole(user, 'admin', 'editor')

/**
 * Access config for @payloadcms/plugin-ecommerce.
 *
 * The plugin only knows "admin" vs "customer". Here its admin checks map to CMS staff,
 * so editors manage products, variants and orders. Transactions (payments, refunds) are
 * narrowed to admins in collections/transactions.ts. There are no customer accounts:
 * checkout is guest-only, so nobody "owns" a document except staff.
 */
export const ecommerceAccess = {
  adminOnlyFieldAccess: isStaffField,
  adminOrPublishedStatus: authenticatedOrPublished,
  isAdmin: isStaff,
  isAuthenticated: authenticated,
  isCustomer: () => false,
  isDocumentOwner: isStaff,
  publicAccess: anyone,
}

export { isAdmin, isAdminUser }
