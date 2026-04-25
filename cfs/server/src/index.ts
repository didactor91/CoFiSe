import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { makeExecutableSchema } from '@graphql-tools/schema'
import Fastify, { type FastifyInstance } from 'fastify'
import { NoSchemaIntrospectionCustomRule } from 'graphql'
import mercurius from 'mercurius'

import config from './config.js'
import { resolvers } from './graphql/resolvers.js'
import { typeDefs } from './graphql/schema.js'

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: true,
    trustProxy: config.security.trustProxy,
    // Security: limit request body size
    bodyLimit: config.security.bodyLimit,
    // Security: connection timeout
    connectionTimeout: config.security.connectionTimeout,
    // Security: request timeout
    requestTimeout: config.security.requestTimeout,
  })

  // Security: global rate limiting
  await server.register(rateLimit, {
    max: config.security.rateLimit.max,
    timeWindow: config.security.rateLimit.timeWindow,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Has superado el límite de solicitudes. Inténtalo de nuevo en un minuto.'
    })
  })

  // Security: HTTP security headers (CSP, HSTS, X-Frame-Options, etc.)
  await server.register(helmet, {
    // Content Security Policy - strict but functional
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // inline needed for GraphQL playground in dev
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
      }
    },
    // HSTS - only in production
    hsts: config.isProduction ? {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
      upgradeInsecureRequests: true,
    } : false,
    // Prevent clickjacking
    frameguard: {
      action: 'deny'
    },
    // XSS protection
    xssFilter: true,
    // No sniff for content type
    noSniff: true,
    // Referrer policy
    referrerPolicy: 'strict-origin-when-cross-origin',
    // Disable powered-by header
    hidePoweredBy: true,
    // Force HTTPS in production (behind reverse proxy)
    forceHttps: config.isProduction,
  })

  // CORS: allow configured origins
  await server.register(cors, {
    origin: config.cors.origins,
    credentials: config.cors.credentials,
    // Security: restrict exposed methods
    methods: ['GET', 'POST', 'OPTIONS'],
    // Security: limit exposed headers
    exposedHeaders: ['Content-Type'],
    // Security: cache preflight for 1 hour
    maxAge: 3600,
  })

  // JWT plugin with configured secret and expiry
  await server.register(jwt, {
    secret: config.jwt.secret,
    sign: {
      algorithm: 'HS256',
      expiresIn: config.jwt.expiresIn,
      iss: config.jwt.issuer,
      aud: config.jwt.audience,
    },
    verify: {
      allowedIss: config.jwt.issuer,
      allowedAud: config.jwt.audience,
    },
  })

  // Health check endpoint
  server.get('/health', async () => ({ status: 'ok' }))

  // Create executable schema for Mercurius
  const schema = makeExecutableSchema({ typeDefs, resolvers })

  // GraphQL endpoint with JWT verification in context
  await server.register(mercurius, {
    schema,
    queryDepth: config.security.graphqlQueryDepth,
    graphiql: !config.isProduction,
    ide: !config.isProduction,
    validationRules: config.security.enableGraphqlIntrospection ? undefined : [NoSchemaIntrospectionCustomRule],
    context: async (request, reply) => {
      // Try to verify JWT and populate request.user if token present
      let user: unknown = request.user
      if (!user) {
        const authHeader = request.headers.authorization
        if (authHeader?.startsWith('Bearer ')) {
          try {
            const decoded = await request.jwtVerify()
            user = decoded
          } catch {
            // Token invalid or expired - user remains undefined
            user = null
          }
        }
      }
      return { user, reply, jwt: request.server.jwt }
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
