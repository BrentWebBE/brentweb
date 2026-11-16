export const ROLES = ['admin', 'editor'] as const
export type Role = (typeof ROLES)[number]

const isRole = (value: unknown): value is Role => ROLES.includes(value as Role)

/**
 * Reads the role from any user shape Payload hands us (`req.user`, the admin's
 * `ClientUser`, a `User` document). Unknown or missing roles count as no role.
 */
export const getRole = (user: unknown): Role | undefined => {
  if (user && typeof user === 'object' && 'role' in user) {
    const { role } = user as { role?: unknown }
    return isRole(role) ? role : undefined
  }
  return undefined
}

export const hasRole = (user: unknown, ...roles: Role[]): boolean => {
  const role = getRole(user)
  return Boolean(role && roles.includes(role))
}

export const isAdminUser = (user: unknown): boolean => hasRole(user, 'admin')
