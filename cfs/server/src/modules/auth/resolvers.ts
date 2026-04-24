import bcrypt from 'bcrypt'
import { db } from '../../db/index.js'
import { userFromRow } from '../shared/mappers.js'
import { requireAuth, type Context } from '../shared/guards.js'

interface RefreshTokenPayload {
    id: number
    type: 'refresh'
}

export const authResolvers = {
    Query: {
        me: (_: any, __: any, ctx: Context) => {
            const user = requireAuth(ctx)
            const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(user.id)
            return row ? userFromRow(row) : null
        },
    },
    Mutation: {
        login: async (_: any, args: { email: string; password: string }, ctx: Context) => {
            const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(args.email) as any
            if (!user) {
                throw new Error('Credenciales inválidas')
            }
            const isValid = await bcrypt.compare(args.password, user.password)
            if (!isValid) {
                throw new Error('Credenciales inválidas')
            }

            const token = await ctx.reply.jwtSign({ id: user.id, email: user.email, role: user.role.toUpperCase() })
            const refreshToken = await ctx.reply.jwtSign({ id: user.id, type: 'refresh' }, { expiresIn: '30d' })

            return {
                token,
                refreshToken,
                user: userFromRow(user),
            }
        },

        refreshToken: async (_: any, args: { refreshToken: string }, ctx: Context) => {
            try {
                const payload = ctx.jwt.verify(args.refreshToken) as RefreshTokenPayload
                if (!payload.id || payload.type !== 'refresh') {
                    throw new Error('Invalid token payload')
                }

                const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(payload.id) as any
                if (!user) {
                    throw new Error('User not found')
                }

                const token = await ctx.reply.jwtSign({ id: user.id, email: user.email, role: user.role.toUpperCase() })
                const newRefreshToken = await ctx.reply.jwtSign({ id: user.id, type: 'refresh' }, { expiresIn: '30d' })

                return {
                    token,
                    refreshToken: newRefreshToken,
                    user: userFromRow(user),
                }
            } catch (err: unknown) {
                if (err instanceof Error && (err.message === 'Invalid token payload' || err.message === 'User not found')) {
                    throw err
                }
                throw new Error('Invalid or expired refresh token')
            }
        },
    },
}
