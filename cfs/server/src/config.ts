import path from 'path'

// Server configuration - single source of truth
// All environment-based configuration should be accessed from here

const isProduction = process.env.NODE_ENV === 'production'

export const config = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '24h',
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
    host: '0.0.0.0',
  },

  // Environment
  isProduction,
} as const

export type Config = typeof config

export default config
