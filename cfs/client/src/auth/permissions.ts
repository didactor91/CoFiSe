/**
 * Permission System for CFS (Frontend)
 * 
 * Permissions follow the format: resource.action
 * Must stay in sync with server permissions
 */

// Available permissions
export type Permission = 
  // News permissions
  | 'news.read'
  | 'news.create'
  | 'news.update'
  | 'news.delete'
  | 'news.manage'
  
  // Product permissions
  | 'product.read'
  | 'product.create'
  | 'product.update'
  | 'product.delete'
  | 'product.manage'
  
  // Reservation permissions
  | 'reservation.read'
  | 'reservation.update'
  | 'reservation.manage'
  
  // User permissions
  | 'user.read'
  | 'user.create'
  | 'user.delete'
  | 'user.manage'

// Role-Permission mapping (must match server)
export const rolePermissions: Record<'ADMIN' | 'STAFF', Permission[]> = {
  ADMIN: [
    'news.read',
    'news.create',
    'news.update',
    'news.delete',
    'news.manage',
    'product.read',
    'product.create',
    'product.update',
    'product.delete',
    'product.manage',
    'reservation.read',
    'reservation.update',
    'reservation.manage',
    'user.read',
    'user.create',
    'user.delete',
    'user.manage',
  ],
  STAFF: [
    'news.read',
    'news.create',
    'news.update',
    'news.delete',
    'product.read',
    'product.create',
    'product.update',
    'product.delete',
    'reservation.read',
    'reservation.update',
    'user.read',
  ]
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: 'ADMIN' | 'STAFF', permission: Permission): boolean {
  return rolePermissions[role].includes(permission)
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: 'ADMIN' | 'STAFF'): Permission[] {
  return [...rolePermissions[role]]
}

/**
 * Check if role can perform action on resource
 */
export function canDo(role: 'ADMIN' | 'STAFF', resource: string, action: string): boolean {
  const permission = `${resource}.${action}` as Permission
  return hasPermission(role, permission)
}
