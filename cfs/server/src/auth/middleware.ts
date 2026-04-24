import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify'

export interface AuthUser {
  id: number
  email: string
  role: 'ADMIN' | 'STAFF'
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireRole: (role: 'ADMIN' | 'STAFF') => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    user: AuthUser
  }
}

export async function requireAuth(this: FastifyInstance, request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    reply.status(401).send({ error: 'Invalid token' })
  }
}

export async function requireRole(role: 'ADMIN' | 'STAFF') {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      await request.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Invalid token' })
      return
    }

    const user = request.user as AuthUser
    if (user.role !== role) {
      reply.status(403).send({ error: 'Insufficient permissions' })
      return
    }
  }
}

export function registerAuthHooks(server: FastifyInstance): void {
  server.decorate('authenticate', requireAuth)
  server.decorate('requireRole', requireRole)
}
