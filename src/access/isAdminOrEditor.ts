import type { Access } from 'payload'

import { hasRole } from './roles'

/** Collection/global-level: any CMS user (admin or editor). */
export const isAdminOrEditor: Access = ({ req: { user } }) => hasRole(user, 'admin', 'editor')
