import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import mercurius from 'mercurius'
import { makeExecutableSchema } from '@graphql-tools/schema'
import jwt from '@fastify/jwt'
import bcrypt from 'bcrypt'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Test database setup
const TEST_DB_PATH = path.join(__dirname, 'test-auth.db')

interface AuthUser {
  id: number
  email: string
  role: 'ADMIN' | 'STAFF'
}

describe('Login Mutation', () => {
  let server: FastifyInstance
  let db: Database.Database
  let testSchema: ReturnType<typeof makeExecutableSchema>

  beforeAll(async () => {
    // Create test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    db = new Database(TEST_DB_PATH)
    db.pragma('journal_mode = WAL')

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'staff')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Seed admin user (password: admin123)
    const hashedPassword = await bcrypt.hash('admin123', 12)
    db.prepare(`INSERT INTO users (email, password, role) VALUES (?, ?, ?)`).run(
      'admin@test.com',
      hashedPassword,
      'admin'
    )

    // Seed staff user (password: staff123)
    const staffHashedPassword = await bcrypt.hash('staff123', 12)
    db.prepare(`INSERT INTO users (email, password, role) VALUES (?, ?, ?)`).run(
      'staff@test.com',
      staffHashedPassword,
      'staff'
    )

    // Build schema with resolvers
    const typeDefs = `
      type Query {
        me: User
      }
      
      type Mutation {
        login(email: String!, password: String!): AuthPayload!
      }
      
      type User {
        id: ID!
        email: String!
        role: UserRole!
      }
      
      enum UserRole {
        ADMIN
        STAFF
      }
      
      type AuthPayload {
        token: String!
        user: User!
      }
    `

    const resolvers = {
      Query: {
        me: async (_: any, __: any, context: { user: AuthUser }) => {
          return context.user
        }
      },
      Mutation: {
        login: async (_: any, args: { email: string; password: string }) => {
          const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(args.email) as any
          if (!user) {
            throw new Error('Invalid credentials')
          }
          const isValid = await bcrypt.compare(args.password, user.password)
          if (!isValid) {
            throw new Error('Invalid credentials')
          }
          const token = server.jwt.sign({ id: user.id, email: user.email, role: user.role.toUpperCase() })
          return {
            token,
            user: { id: user.id, email: user.email, role: user.role.toUpperCase() }
          }
        }
      }
    }

    testSchema = makeExecutableSchema({ typeDefs, resolvers })

    server = Fastify({ logger: false })
    await server.register(jwt, { secret: 'test-secret', sign: { expiresIn: '24h' } })
    
    server.addHook('preHandler', async (request) => {
      try {
        const decoded = await request.jwtVerify()
        request.user = decoded as AuthUser
      } catch {}
    })

    await server.register(mercurius, {
      schema: testSchema,
      resolvers,
      context: (request: any) => ({ user: request.user })
    })

    await server.ready()
  })

  afterAll(async () => {
    await server.close()
    db.close()
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  it('login with valid admin credentials returns token and user', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { login(email: "admin@test.com", password: "admin123") { token user { id email role } } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data).toBeDefined()
    expect(body.data.login.token).toBeDefined()
    expect(body.data.login.user.email).toBe('admin@test.com')
    expect(body.data.login.user.role).toBe('ADMIN')
  })

  it('login with valid staff credentials returns token and user', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { login(email: "staff@test.com", password: "staff123") { token user { id email role } } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data).toBeDefined()
    expect(body.data.login.token).toBeDefined()
    expect(body.data.login.user.email).toBe('staff@test.com')
    expect(body.data.login.user.role).toBe('STAFF')
  })

  it('login with invalid password returns error', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { login(email: "admin@test.com", password: "wrongpassword") { token user { id email role } } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data).toBeNull()
    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toBe('Invalid credentials')
  })

  it('login with non-existent user returns error', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { login(email: "nonexistent@test.com", password: "password123") { token user { id email role } } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data).toBeNull()
    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toBe('Invalid credentials')
  })
})