import path from 'path'

// Server configuration - single source of truth
// All environment-based configuration should be accessed from here

const isProduction = process.env.NODE_ENV === 'production'

export const config = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Database Configuration
  database: {
    path: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'cfs.db'),
  },

  // CORS Configuration
  cors: {
    origins: (process.env.CORS_ORIGINS || 'https://seno.didtor.dev,http://localhost:3000,http://127.0.0.1:3000')
      .split(',')
      .map(s => s.trim()),
    credentials: true,
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT_SERVER || '4000', 10),
    host: process.env.SERVER_HOST || '0.0.0.0',
  },

  // Security Configuration
  security: {
    // Rate limiting
    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
    },
    // Request limits
    bodyLimit: parseInt(process.env.BODY_LIMIT || '1048576', 10), // 1MB default
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10), // 30s default
    connectionTimeout: parseInt(process.env.CONNECTION_TIMEOUT || '30000', 10), // 30s default
  },

  // Environment
  isProduction,
} as const

export type Config = typeof config

export default config
