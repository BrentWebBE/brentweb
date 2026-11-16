import type { Access, FieldAccess } from 'payload'

import { isAdminUser } from './roles'

/** Collection/global-level: only admins. */
export const isAdmin: Access = ({ req: { user } }) => isAdminUser(user)

/** Field-level variant of `isAdmin`. */
export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => isAdminUser(user)
