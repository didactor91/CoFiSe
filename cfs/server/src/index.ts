import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import mercurius from 'mercurius'
import { makeExecutableSchema } from '@graphql-tools/schema'
import type { FastifyInstance } from 'fastify'
import { typeDefs } from './graphql/schema.js'
import { resolvers } from './graphql/resolvers.js'
import config from './config.js'

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({ logger: true })

  // CORS: allow configured origins
  await server.register(cors, {
    origin: config.cors.origins,
    credentials: config.cors.credentials
  })

  // JWT plugin with configured secret and expiry
  await server.register(jwt, {
    secret: config.jwt.secret || 'changeme',
    sign: {
      expiresIn: config.jwt.expiresIn
    }
  })

  // Health check endpoint
  server.get('/health', async () => ({ status: 'ok' }))

  // Create executable schema for Mercurius
  const schema = makeExecutableSchema({ typeDefs, resolvers })

  // GraphQL endpoint with JWT verification in context
  await server.register(mercurius, {
    schema,
    context: async (request, reply) => {
      // Try to verify JWT and populate request.user if token present
      let user = request.user
      if (!user) {
        const authHeader = request.headers.authorization
        if (authHeader?.startsWith('Bearer ')) {
          try {
            const decoded = await request.jwtVerify()
            user = decoded
          } catch (err) {
            // Token invalid or expired - user remains undefined
            user = undefined
          }
        }
      }
      return { user, jwt: reply.jwt }
    }
  })

  return server
}

// Start server if running directly
async function main() {
  const server = await buildServer()
  await server.listen({ port: config.server.port, host: config.server.host })
  console.log(`Server running on http://${config.server.host}:${config.server.port}`)
}

main().catch(console.error)

export default buildServer