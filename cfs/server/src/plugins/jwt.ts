import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import { registerAuthHooks } from '../auth/middleware.js'

const jwtPlugin: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Register JWT plugin
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'changeme',
    sign: {
      expiresIn: '24h'
    }
  })

  // Register auth hooks (authenticate and requireRole)
  registerAuthHooks(server)
}

export default fp(jwtPlugin, {
  name: 'jwt-plugin'
})

// Re-export auth utilities
export { requireAuth, requireRole, type AuthUser } from '../auth/middleware.js'