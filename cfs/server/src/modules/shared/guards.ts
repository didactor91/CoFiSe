import type { AuthUser } from '../../auth/middleware.js'
import { hasAnyPermission, hasPermission, type Permission } from '../../auth/permissions.js'

export interface Context {
    user?: AuthUser
    reply: any
    jwt: any
}

export function requireAuth(ctx: Context): AuthUser {
    if (!ctx.user) {
        throw new Error('Unauthorized')
    }
    return ctx.user
}

export function requirePermission(ctx: Context, permission: Permission): AuthUser {
    const user = requireAuth(ctx)
    if (!hasPermission(user.role, permission)) {
        throw new Error('Insufficient permissions')
    }
    return user
}

export function requireAnyPermission(ctx: Context, permissions: Permission[]): AuthUser {
    const user = requireAuth(ctx)
    if (!hasAnyPermission(user.role, permissions)) {
        throw new Error('Insufficient permissions')
    }
    return user
}

export function requireStaff(ctx: Context): AuthUser {
    const user = requireAuth(ctx)
    if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
        throw new Error('Insufficient permissions')
    }
    return user
}

export function requireAdmin(ctx: Context): AuthUser {
    const user = requireAuth(ctx)
    if (user.role !== 'ADMIN') {
        throw new Error('Insufficient permissions')
    }
    return user
}
