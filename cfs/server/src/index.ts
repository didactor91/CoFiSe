import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import mercurius from 'mercurius'
import { makeExecutableSchema } from '@graphql-tools/schema'
import type { FastifyInstance } from 'fastify'
import { typeDefs } from './graphql/schema.js'
import { resolvers } from './graphql/resolvers.js'

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({ logger: true })

  // CORS: allow only seno.didtor.dev
  await server.register(cors, {
    origin: ['https://seno.didtor.dev'],
    credentials: true
  })

  // JWT plugin with 24h expiry
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'changeme',
    sign: {
      expiresIn: '24h'
    }
  })

  // Health check endpoint
  server.get('/health', async () => ({ status: 'ok' }))

  // Create executable schema for Mercurius
  const schema = makeExecutableSchema({ typeDefs, resolvers })

  // GraphQL endpoint
  await server.register(mercurius, {
    schema,
    context: (request, reply) => ({ user: request.user, jwt: reply.jwt })
  })

  return server
}

// Start server if running directly
const server = await buildServer()
await server.listen({ port: 4000, host: '0.0.0.0' })
console.log('Server running on http://0.0.0.0:4000')

export default buildServer