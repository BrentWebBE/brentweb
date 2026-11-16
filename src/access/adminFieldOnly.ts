import type { FieldAccess } from 'payload'

import { isAdminUser } from './roles'

/**
 * Field-level access for admin-only fields (SEO meta, technical settings, roles).
 *
 * - create/update: admins only. Editors saving a document keep the existing value.
 * - read: admins, plus unauthenticated requests. Editors don't see the field in the
 *   admin panel, but the public site (Local API / REST without a user) can still read
 *   it, e.g. to render meta tags.
 */
export const adminFieldOnly: {
  create: FieldAccess
  read: FieldAccess
  update: FieldAccess
} = {
  create: ({ req: { user } }) => isAdminUser(user),
  read: ({ req: { user } }) => !user || isAdminUser(user),
  update: ({ req: { user } }) => isAdminUser(user),
}
