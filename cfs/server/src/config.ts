import crypto from 'node:crypto'
import path from 'path'

// Server configuration - single source of truth
// All environment-based configuration should be accessed from here

const isProduction = process.env.NODE_ENV === 'production'
const DEFAULT_DEV_CORS_ORIGINS = 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175'
const DEFAULT_PROD_CORS_ORIGINS = 'https://seno.didtor.dev'

function getIntEnv(name: string, fallback: number, min = 1): number {
  const raw = process.env[name]
  if (!raw) {
    return fallback
  }

  const value = Number.parseInt(raw, 10)
  if (!Number.isFinite(value) || value < min) {
    throw new Error(`Invalid ${name}: must be an integer >= ${min}`)
  }
  return value
}

function getBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name]
  if (!raw) {
    return fallback
  }

  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
}

function getRequiredSecret(name: string, minLength: number): string {
  const value = process.env[name]?.trim()

  if (value && value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters long`)
  }

  if (value) {
    return value
  }

  if (isProduction) {
    throw new Error(`${name} is required`)
  }

  // Safe fallback for local/test runs; production must always define JWT_SECRET.
  return crypto.randomBytes(32).toString('hex')
}

function getJwtSecret(): string {
  const secret = getRequiredSecret('JWT_SECRET', isProduction ? 32 : 16)
  if (!process.env.JWT_SECRET && !isProduction) {
    console.warn('[SECURITY] JWT_SECRET no está definido. Se usa un secreto efímero para desarrollo.')
  }

  return secret
}

const defaultCorsOrigins = isProduction ? DEFAULT_PROD_CORS_ORIGINS : DEFAULT_DEV_CORS_ORIGINS
const corsOrigins = (process.env.CORS_ORIGINS || defaultCorsOrigins).split(',').map(s => s.trim()).filter(Boolean)
const jwtSecret = getJwtSecret()

export const config = {
  // JWT Configuration
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: process.env.JWT_ISSUER || 'cfs-api',
    audience: process.env.JWT_AUDIENCE || 'cfs-client',
  },

  // Database Configuration
  database: {
    path: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'cfs.db'),
  },

  // CORS Configuration
  cors: {
    origins: corsOrigins,
    credentials: true,
  },

  // Server Configuration
  server: {
    port: getIntEnv('PORT_SERVER', 4000),
    host: process.env.SERVER_HOST || (isProduction ? '0.0.0.0' : '127.0.0.1'),
  },

  // Security Configuration
  security: {
    // Rate limiting
    rateLimit: {
      max: getIntEnv('RATE_LIMIT_MAX', isProduction ? 60 : 100),
      timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
    },
    // Request limits
    bodyLimit: getIntEnv('BODY_LIMIT', 5242880), // 5MB default for file uploads
    requestTimeout: getIntEnv('REQUEST_TIMEOUT', 30000), // 30s default
    connectionTimeout: getIntEnv('CONNECTION_TIMEOUT', 30000), // 30s default
    trustProxy: getBooleanEnv('TRUST_PROXY', isProduction),
    enableGraphqlIntrospection: getBooleanEnv('ENABLE_GRAPHQL_INTROSPECTION', !isProduction),
    graphqlQueryDepth: getIntEnv('GRAPHQL_QUERY_DEPTH', 8),
  },

  // Upload Configuration
  uploads: {
    dir: process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads'),
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },

  // Environment
  isProduction,
} as const

export type Config = typeof config

export default config
