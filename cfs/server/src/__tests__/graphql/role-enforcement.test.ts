import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import mercurius from 'mercurius'
import { makeExecutableSchema } from '@graphql-tools/schema'
import jwt from '@fastify/jwt'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const TEST_DB_PATH = path.join(__dirname, 'test-roles.db')

interface AuthUser {
  id: number
  email: string
  role: 'ADMIN' | 'STAFF'
}

describe('Role Enforcement', () => {
  let server: FastifyInstance
  let db: Database.Database

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    db = new Database(TEST_DB_PATH)
    db.pragma('journal_mode = WAL')

    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'staff')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    const now = new Date().toISOString()
    db.prepare(`INSERT INTO news (title, content, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run(
      'Test News', 'Test content', null, now, now
    )

    const typeDefs = `
      type News {
        id: ID!
        title: String!
        content: String!
        imageUrl: String
        createdAt: String!
        updatedAt: String!
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
      
      type Query {
        me: User
        news: [News!]!
        allNews: [News!]!
        users: [User!]!
      }
      
      type Mutation {
        deleteNews(id: ID!): Boolean!
        deleteUser(id: ID!): Boolean!
      }
    `

    const resolvers = {
      Query: {
        me: (_: any, __: any, context: { user: AuthUser }) => {
          if (!context.user) throw new Error('Unauthorized')
          return context.user
        },
        news: () => [{ id: '1', title: 'Public News', content: 'Content', imageUrl: null, createdAt: '', updatedAt: '' }],
        allNews: (_: any, __: any, context: { user: AuthUser }) => {
          if (!context.user) throw new Error('Unauthorized')
          if (context.user.role !== 'ADMIN' && context.user.role !== 'STAFF') {
            throw new Error('Insufficient permissions')
          }
          return [{ id: '1', title: 'All News', content: 'Content', imageUrl: null, createdAt: '', updatedAt: '' }]
        },
        users: (_: any, __: any, context: { user: AuthUser }) => {
          if (!context.user) throw new Error('Unauthorized')
          if (context.user.role !== 'ADMIN') {
            throw new Error('Insufficient permissions')
          }
          return [{ id: '1', email: 'admin@test.com', role: 'ADMIN' }]
        }
      },
      Mutation: {
        deleteNews: (_: any, args: { id: string }, context: { user: AuthUser }) => {
          if (!context.user) throw new Error('Unauthorized')
          if (context.user.role !== 'ADMIN' && context.user.role !== 'STAFF') {
            throw new Error('Insufficient permissions')
          }
          return true
        },
        deleteUser: (_: any, args: { id: string }, context: { user: AuthUser }) => {
          if (!context.user) throw new Error('Unauthorized')
          if (context.user.role !== 'ADMIN') {
            throw new Error('Insufficient permissions')
          }
          return true
        }
      }
    }

    const testSchema = makeExecutableSchema({ typeDefs, resolvers })

    server = Fastify({ logger: false })
    await server.register(jwt, { secret: 'test-secret', sign: { expiresIn: '24h' } })

    server.addHook('preHandler', async (request: any) => {
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

  describe('Query access control', () => {
    it('me returns user when authenticated', async () => {
      const token = server.jwt.sign({ id: 1, email: 'admin@test.com', role: 'ADMIN' })
      
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `{ me { id email role } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.me).toBeDefined()
      expect(body.data.me.role).toBe('ADMIN')
    })

    it('users query is accessible by admin', async () => {
      const token = server.jwt.sign({ id: 1, email: 'admin@test.com', role: 'ADMIN' })
      
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `{ users { id email role } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.users).toBeDefined()
      expect(body.data.users).toHaveLength(1)
    })

    it('users query is blocked for staff', async () => {
      const token = server.jwt.sign({ id: 2, email: 'staff@test.com', role: 'STAFF' })
      
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `{ users { id email role } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeNull()
      expect(body.errors).toBeDefined()
      expect(body.errors[0].message).toBe('Insufficient permissions')
    })

    it('allNews is accessible by staff', async () => {
      const token = server.jwt.sign({ id: 2, email: 'staff@test.com', role: 'STAFF' })
      
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `{ allNews { id title } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.allNews).toBeDefined()
    })
  })

  describe('Mutation access control', () => {
    it('deleteUser is accessible by admin', async () => {
      const token = server.jwt.sign({ id: 1, email: 'admin@test.com', role: 'ADMIN' })
      
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `mutation { deleteUser(id: "1") }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.deleteUser).toBe(true)
    })

    it('deleteUser is blocked for staff', async () => {
      const token = server.jwt.sign({ id: 2, email: 'staff@test.com', role: 'STAFF' })
      
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `mutation { deleteUser(id: "1") }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeNull()
      expect(body.errors).toBeDefined()
      expect(body.errors[0].message).toBe('Insufficient permissions')
    })

    it('deleteNews is accessible by staff', async () => {
      const token = server.jwt.sign({ id: 2, email: 'staff@test.com', role: 'STAFF' })
      
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `mutation { deleteNews(id: "1") }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.deleteNews).toBe(true)
    })
  })
})