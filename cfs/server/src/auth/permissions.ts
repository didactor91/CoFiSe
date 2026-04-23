/**
 * Permission System for CFS
 * 
 * Permissions follow the format: resource.action
 * 
 * Resources: news, product, reservation, user
 * Actions: create, read, update, delete, manage (all permissions)
 */

// Available permissions
export type Permission = 
  // News permissions
  | 'news.read'
  | 'news.create'
  | 'news.update'
  | 'news.delete'
  | 'news.manage' // All news permissions
  
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
  
  // User permissions (admin only for management)
  | 'user.read'
  | 'user.create'
  | 'user.delete'
  | 'user.manage'

// Role definition with assigned permissions
export interface Role {
  name: 'ADMIN' | 'STAFF'
  permissions: Permission[]
}

// Role-Permission mapping
export const roles: Record<'ADMIN' | 'STAFF', Role> = {
  ADMIN: {
    name: 'ADMIN',
    permissions: [
      // All news
      'news.read',
      'news.create',
      'news.update',
      'news.delete',
      'news.manage',
      
      // All products
      'product.read',
      'product.create',
      'product.update',
      'product.delete',
      'product.manage',
      
      // All reservations
      'reservation.read',
      'reservation.update',
      'reservation.manage',
      
      // All users (full management)
      'user.read',
      'user.create',
      'user.delete',
      'user.manage',
    ]
  },
  STAFF: {
    name: 'STAFF',
    permissions: [
      // All news (CRUD)
      'news.read',
      'news.create',
      'news.update',
      'news.delete',
      
      // All products (CRUD)
      'product.read',
      'product.create',
      'product.update',
      'product.delete',
      
      // Reservations (read + update status)
      'reservation.read',
      'reservation.update',
      
      // Users - read only (view user list)
      'user.read',
      // NO user.create, user.delete, user.manage
    ]
  }
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: 'ADMIN' | 'STAFF', permission: Permission): boolean {
  return roles[role].permissions.includes(permission)
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: 'ADMIN' | 'STAFF', permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: 'ADMIN' | 'STAFF', permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p))
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: 'ADMIN' | 'STAFF'): Permission[] {
  return [...roles[role].permissions]
}

/**
 * Check if role can perform action on resource
 */
export function canDo(role: 'ADMIN' | 'STAFF', resource: string, action: string): boolean {
  const permission = `${resource}.${action}` as Permission
  return hasPermission(role, permission)
}
