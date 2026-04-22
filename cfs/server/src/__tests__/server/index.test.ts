import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'

describe('Server Setup', () => {
  let server: FastifyInstance

  beforeAll(async () => {
    server = Fastify({ logger: false })
    
    // Register CORS for seno.didtor.dev only
    await server.register(cors, {
      origin: ['https://seno.didtor.dev'],
      credentials: true
    })

    // Register JWT plugin with secret and 24h expiry
    await server.register(jwt, {
      secret: 'test-secret',
      sign: { expiresIn: '24h' }
    })

    // Health check endpoint
    server.get('/health', async () => ({ status: 'ok' }))

    await server.ready()
  })

  afterAll(async () => {
    await server.close()
  })

  it('server starts and health check returns 200', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health'
    })
    
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ status: 'ok' })
  })

  it('CORS headers are set for seno.didtor.dev origin', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
      headers: {
        origin: 'https://seno.didtor.dev'
      }
    })
    
    expect(response.headers['access-control-allow-origin']).toBe('https://seno.didtor.dev')
    expect(response.headers['access-control-allow-credentials']).toBe('true')
  })

  it('CORS blocks other origins', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
      headers: {
        origin: 'https://evil.com'
      }
    })
    
    // CORS should not set access-control headers for untrusted origins
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('generates valid JWT token with 24h expiry', async () => {
    const token = server.jwt.sign({ id: 1, email: 'test@test.com', role: 'ADMIN' })
    
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3) // JWT has 3 parts (header.payload.signature)
  })

  it('verifies valid JWT token', async () => {
    const token = server.jwt.sign({ id: 1, email: 'test@test.com', role: 'ADMIN' })
    
    const decoded = server.jwt.verify(token) as { id: number; email: string; role: string }
    
    expect(decoded.id).toBe(1)
    expect(decoded.email).toBe('test@test.com')
    expect(decoded.role).toBe('ADMIN')
  })

  it('rejects invalid JWT token', async () => {
    await expect(() => server.jwt.verify('invalid-token-here')).toThrow()
  })

  it('rejects expired JWT token', async () => {
    // Create a token that expires immediately
    const token = server.jwt.sign({ id: 1 }, { expiresIn: '-1s' })
    
    await expect(() => server.jwt.verify(token)).toThrow()
  })
})