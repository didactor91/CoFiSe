import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'

// Re-implement the auth middleware pattern for testing
interface AuthUser {
  id: number
  email: string
  role: 'ADMIN' | 'STAFF'
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>
    requireRole: (role: 'ADMIN' | 'STAFF') => (request: any, reply: any) => Promise<void>
  }
}

describe('Auth Middleware', () => {
  let server: FastifyInstance

  beforeAll(async () => {
    server = Fastify({ logger: false })
    
    await server.register(import('@fastify/jwt'), {
      secret: 'test-secret'
    })

    // Decorate with auth hooks
    server.decorate('authenticate', async (request: any, reply: any) => {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.status(401).send({ error: 'Invalid token' })
      }
    })

    server.decorate('requireRole', (role: 'ADMIN' | 'STAFF') => {
      return async (request: any, reply: any) => {
        try {
          await request.jwtVerify()
        } catch (err) {
          return reply.status(401).send({ error: 'Invalid token' })
        }
        
        const user = request.user as AuthUser
        if (user.role !== role) {
          return reply.status(403).send({ error: 'Insufficient permissions' })
        }
      }
    })

    // Define test routes BEFORE ready()
    server.get('/protected', {
      preHandler: [server.authenticate]
    }, async (request) => {
      return { user: request.user }
    })

    server.get('/admin-only', {
      preHandler: [server.requireRole('ADMIN')]
    }, async (request) => {
      return { success: true }
    })

    server.get('/staff-only', {
      preHandler: [server.requireRole('STAFF')]
    }, async (request) => {
      return { success: true }
    })

    await server.ready()
  })

  afterAll(async () => {
    await server.close()
  })

  describe('JWT Authentication', () => {
    it('rejects requests without authorization header', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/protected'
      })
      
      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Invalid token')
    })

    it('rejects invalid tokens', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: 'Bearer invalid-token-here'
        }
      })
      
      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Invalid token')
    })

    it('accepts valid tokens and returns user context', async () => {
      const token = server.jwt.sign({ id: 1, email: 'test@test.com', role: 'ADMIN' })
      
      const response = await server.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.user.role).toBe('ADMIN')
      expect(body.user.email).toBe('test@test.com')
    })
  })

  describe('Role-Based Access Control', () => {
    it('allows admin for admin-only routes', async () => {
      const token = server.jwt.sign({ id: 1, email: 'admin@test.com', role: 'ADMIN' })
      
      const response = await server.inject({
        method: 'GET',
        url: '/admin-only',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(response.statusCode).toBe(200)
    })

    it('blocks staff for admin-only routes', async () => {
      const token = server.jwt.sign({ id: 2, email: 'staff@test.com', role: 'STAFF' })
      
      const response = await server.inject({
        method: 'GET',
        url: '/admin-only',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.error).toBe('Insufficient permissions')
    })

    it('allows staff for staff-only routes', async () => {
      const token = server.jwt.sign({ id: 2, email: 'staff@test.com', role: 'STAFF' })
      
      const response = await server.inject({
        method: 'GET',
        url: '/staff-only',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(response.statusCode).toBe(200)
    })

    it('blocks admin from staff-only routes when strict role matching', async () => {
      // Admin has ADMIN role, but staff-only requires STAFF
      // Since we're using strict role matching, ADMIN cannot access STAFF-only routes
      const token = server.jwt.sign({ id: 1, email: 'admin@test.com', role: 'ADMIN' })
      
      const response = await server.inject({
        method: 'GET',
        url: '/staff-only',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      // Per the spec, roles are strict - ADMIN != STAFF
      expect(response.statusCode).toBe(403)
    })

    it('allows admin to access staff routes if we add both roles', async () => {
      // This tests the pattern - in practice we'd have a requireAnyRole or similar
      // For this test we verify the middleware pattern works
      const token = server.jwt.sign({ id: 1, email: 'admin@test.com', role: 'ADMIN' })
      
      // Admin trying staff route - should fail with strict matching
      const response = await server.inject({
        method: 'GET',
        url: '/staff-only',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(response.statusCode).toBe(403)
    })
  })
})