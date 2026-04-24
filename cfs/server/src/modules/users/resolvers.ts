import bcrypt from 'bcrypt'
import { db } from '../../db/index.js'
import { userFromRow } from '../shared/mappers.js'
import { requirePermission, type Context } from '../shared/guards.js'

export const usersResolvers = {
    Query: {
        users: (_: any, __: any, ctx: Context) => {
            requirePermission(ctx, 'user.read')
            const rows = db.prepare(`SELECT * FROM users ORDER BY created_at DESC`).all()
            return rows.map(userFromRow)
        },

        roles: (_: any, __: any, ctx: Context) => {
            requirePermission(ctx, 'role.read')
            const rows = db.prepare(`SELECT * FROM roles ORDER BY id ASC`).all()
            return rows.map((row: any) => ({
                id: row.id.toString(),
                name: row.name,
                permissions: JSON.parse(row.permissions),
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            }))
        },
    },

    Role: {
        permissions: (parent: any) => {
            if (typeof parent.permissions === 'string') {
                return JSON.parse(parent.permissions)
            }
            return parent.permissions
        },
    },

    Mutation: {
        createUser: async (_: any, args: { input: any }, ctx: Context) => {
            requirePermission(ctx, 'user.create')
            const existing = db.prepare(`SELECT * FROM users WHERE email = ?`).get(args.input.email)
            if (existing) throw new Error('Email already in use')

            const hashedPassword = await bcrypt.hash(args.input.password, 12)
            const now = new Date().toISOString()
            const result = db.prepare(`
        INSERT INTO users (email, password, role, created_at)
        VALUES (?, ?, ?, ?)
      `).run(args.input.email, hashedPassword, args.input.role.toLowerCase(), now)

            return {
                id: result.lastInsertRowid.toString(),
                email: args.input.email,
                role: args.input.role.toUpperCase(),
                createdAt: now,
            }
        },

        updateUser: (_: any, args: { id: string; input: { email?: string; role?: string } }, ctx: Context) => {
            requirePermission(ctx, 'user.manage')
            const existing = db.prepare(`SELECT * FROM users WHERE id = ?`).get(args.id) as any
            if (!existing) throw new Error('User not found')

            const email = args.input.email?.trim() || existing.email
            const role = (args.input.role || existing.role).toLowerCase()
            if (!email) throw new Error('Email is required')
            if (!['admin', 'staff'].includes(role)) throw new Error('Invalid role')

            if (email !== existing.email) {
                const duplicate = db.prepare(`SELECT id FROM users WHERE email = ? AND id != ?`).get(email, args.id)
                if (duplicate) throw new Error('Email already in use')
            }

            db.prepare(`UPDATE users SET email = ?, role = ? WHERE id = ?`).run(email, role, args.id)
            const updated = db.prepare(`SELECT * FROM users WHERE id = ?`).get(args.id) as any
            return userFromRow(updated)
        },

        deleteUser: (_: any, args: { id: string }, ctx: Context) => {
            requirePermission(ctx, 'user.delete')
            const existing = db.prepare(`SELECT * FROM users WHERE id = ?`).get(args.id) as any
            if (!existing) throw new Error('User not found')
            if (existing.id === ctx.user!.id) throw new Error('No puedes eliminarte a ti mismo')
            db.prepare(`DELETE FROM users WHERE id = ?`).run(args.id)
            return true
        },

        createRole: (_: any, args: { input: any }, ctx: Context) => {
            requirePermission(ctx, 'role.create')
            const existing = db.prepare(`SELECT * FROM roles WHERE name = ?`).get(args.input.name)
            if (existing) throw new Error('Role name already exists')

            const now = new Date().toISOString()
            const permissionsJson = JSON.stringify(args.input.permissions)
            const result = db.prepare(`
        INSERT INTO roles (name, permissions, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `).run(args.input.name, permissionsJson, now, now)

            return {
                id: result.lastInsertRowid.toString(),
                name: args.input.name,
                permissions: args.input.permissions,
                createdAt: now,
                updatedAt: now,
            }
        },

        updateRole: (_: any, args: { id: string; input: any }, ctx: Context) => {
            requirePermission(ctx, 'role.update')
            const existing = db.prepare(`SELECT * FROM roles WHERE id = ?`).get(args.id) as any
            if (!existing) throw new Error('Role not found')
            if (existing.name === 'ADMIN' || existing.name === 'STAFF') throw new Error('Cannot modify system roles')

            const now = new Date().toISOString()
            const name = args.input.name ?? existing.name
            const permissions = args.input.permissions ? JSON.stringify(args.input.permissions) : existing.permissions
            db.prepare(`UPDATE roles SET name = ?, permissions = ?, updated_at = ? WHERE id = ?`).run(name, permissions, now, args.id)

            return {
                id: args.id,
                name,
                permissions: args.input.permissions ? args.input.permissions : JSON.parse(existing.permissions),
                createdAt: existing.created_at,
                updatedAt: now,
            }
        },

        deleteRole: (_: any, args: { id: string }, ctx: Context) => {
            requirePermission(ctx, 'role.delete')
            const existing = db.prepare(`SELECT * FROM roles WHERE id = ?`).get(args.id) as any
            if (!existing) throw new Error('Role not found')
            if (existing.name === 'ADMIN' || existing.name === 'STAFF') throw new Error('Cannot delete system roles')

            const usersWithRole = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = ?`).get(existing.name) as any
            if (usersWithRole.count > 0) {
                throw new Error(`Cannot delete role: ${usersWithRole.count} user(s) are using this role`)
            }

            db.prepare(`DELETE FROM roles WHERE id = ?`).run(args.id)
            return true
        },
    },
}
