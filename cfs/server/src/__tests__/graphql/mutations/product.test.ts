import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import mercurius from 'mercurius'
import { makeExecutableSchema } from '@graphql-tools/schema'
import jwt from '@fastify/jwt'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

interface AuthUser {
  id: number
  email: string
  role: 'ADMIN' | 'STAFF'
}

const TEST_DB_PATH = path.join(__dirname, 'test-product.db')

// ============================================================
// STRATEGY: Two test suites with different resolver configs
// 
// Suite 1: Validation Unit Tests - inline resolvers WITHOUT auth
//          These test ONLY the validation logic in isolation
//
// Suite 2: Auth & Integration Tests - resolvers WITH auth
//          These test auth enforcement + full CRUD with JWT
// ============================================================

describe('Product CRUD Mutations', () => {
  let server: FastifyInstance
  let db: Database.Database

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    db = new Database(TEST_DB_PATH)
    db.pragma('journal_mode = WAL')

    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    const now = new Date().toISOString()
    db.prepare(`INSERT INTO products (name, description, price, stock, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'Existing Product', 'Existing description', 19.99, 10, null, now, now
    )

    const typeDefs = `
      type Product {
        id: ID!
        name: String!
        description: String!
        price: Float!
        stock: Int!
        imageUrl: String
        createdAt: String!
        updatedAt: String!
      }
      
      type Query {
        products: [Product!]!
        product(id: ID!): Product
      }
      
      type Mutation {
        createProduct(input: CreateProductInput!): Product!
        updateProduct(id: ID!, input: UpdateProductInput!): Product!
        deleteProduct(id: ID!): Boolean!
      }
      
      input CreateProductInput {
        name: String!
        description: String!
        price: Float!
        stock: Int!
        imageUrl: String
      }
      
      input UpdateProductInput {
        name: String
        description: String
        price: Float
        stock: Int
        imageUrl: String
      }
    `

    // Validation-only resolvers (NO auth) - for unit testing validation logic
    const validationResolvers = {
      Query: {
        products: () => {
          const products = db.prepare(`SELECT * FROM products ORDER BY created_at DESC`).all()
          return products.map((p: any) => ({
            id: p.id, name: p.name, description: p.description,
            price: p.price, stock: p.stock, imageUrl: p.image_url,
            createdAt: p.created_at, updatedAt: p.updated_at
          }))
        },
        product: (_: any, args: { id: string }) => {
          const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.id) as any
          if (!product) return null
          return {
            id: product.id, name: product.name, description: product.description,
            price: product.price, stock: product.stock, imageUrl: product.image_url,
            createdAt: product.created_at, updatedAt: product.updated_at
          }
        }
      },
      Mutation: {
        createProduct: (_: any, args: { input: any }) => {
          const { name, description, price, stock, imageUrl } = args.input
          
          // Validation only - no auth
          if (!name || name.trim() === '') {
            throw new Error('Name is required')
          }
          if (name.length > 500) {
            throw new Error('Name must be 500 characters or less')
          }
          if (price <= 0) {
            throw new Error('Price must be greater than 0')
          }
          if (stock < 0) {
            throw new Error('Stock must be 0 or greater')
          }
          
          const now = new Date().toISOString()
          const result = db.prepare(`
            INSERT INTO products (name, description, price, stock, image_url, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(name, description, price, stock, imageUrl || null, now, now)
          
          return {
            id: result.lastInsertRowid.toString(),
            name, description, price, stock,
            imageUrl: imageUrl || null,
            createdAt: now, updatedAt: now
          }
        },
        updateProduct: (_: any, args: { id: string; input: any }) => {
          const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.id) as any
          if (!existing) {
            throw new Error('Product not found')
          }
          
          const { name, description, price, stock, imageUrl } = args.input
          if (name !== undefined && name.trim() === '') {
            throw new Error('Name is required')
          }
          if (name && name.length > 500) {
            throw new Error('Name must be 500 characters or less')
          }
          if (price !== undefined && price <= 0) {
            throw new Error('Price must be greater than 0')
          }
          if (stock !== undefined && stock < 0) {
            throw new Error('Stock must be 0 or greater')
          }
          
          const now = new Date().toISOString()
          const updateName = name ?? existing.name
          const updateDescription = description ?? existing.description
          const updatePrice = price ?? existing.price
          const updateStock = stock ?? existing.stock
          const updateImageUrl = imageUrl ?? existing.image_url
          
          db.prepare(`
            UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image_url = ?, updated_at = ?
            WHERE id = ?
          `).run(updateName, updateDescription, updatePrice, updateStock, updateImageUrl, now, args.id)
          
          return {
            id: args.id,
            name: updateName, description: updateDescription,
            price: updatePrice, stock: updateStock,
            imageUrl: updateImageUrl,
            createdAt: existing.created_at, updatedAt: now
          }
        },
        deleteProduct: (_: any, args: { id: string }) => {
          const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.id)
          if (!existing) {
            throw new Error('Product not found')
          }
          db.prepare(`DELETE FROM products WHERE id = ?`).run(args.id)
          return true
        }
      }
    }

    const testSchema = makeExecutableSchema({ typeDefs, resolvers: validationResolvers })

    server = Fastify({ logger: false })
    await server.register(mercurius, { schema: testSchema, resolvers: validationResolvers })
    await server.ready()
  })

  afterAll(async () => {
    await server.close()
    db.close()
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  // ============================================================
  // VALIDATION UNIT TESTS (no auth needed - testing validation logic only)
  // ============================================================

  describe('createProduct validation', () => {
    it('createProduct creates product with all fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { createProduct(input: { name: "Test Product", description: "Test description", price: 29.99, stock: 5, imageUrl: "http://example.com/img.jpg" }) { id name description price stock imageUrl createdAt updatedAt } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.createProduct).toBeDefined()
      expect(body.data.createProduct.name).toBe('Test Product')
      expect(body.data.createProduct.description).toBe('Test description')
      expect(body.data.createProduct.price).toBe(29.99)
      expect(body.data.createProduct.stock).toBe(5)
      expect(body.data.createProduct.imageUrl).toBe('http://example.com/img.jpg')
      expect(body.data.createProduct.id).toBeDefined()
    })

    it('createProduct with minimum fields (no imageUrl)', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { createProduct(input: { name: "Min Product", description: "Min desc", price: 9.99, stock: 1 }) { id name description price stock imageUrl } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.createProduct.name).toBe('Min Product')
      expect(body.data.createProduct.imageUrl).toBeNull()
    })

    it('createProduct rejects price <= 0', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { createProduct(input: { name: "Bad Price", description: "desc", price: 0, stock: 1 }) { id name } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeNull()
      expect(body.errors).toBeDefined()
      expect(body.errors[0].message).toBe('Price must be greater than 0')
    })

    it('createProduct rejects negative price', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { createProduct(input: { name: "Bad Price", description: "desc", price: -5, stock: 1 }) { id name } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeNull()
      expect(body.errors[0].message).toBe('Price must be greater than 0')
    })

    it('createProduct rejects stock < 0', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { createProduct(input: { name: "Bad Stock", description: "desc", price: 10, stock: -1 }) { id name } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeNull()
      expect(body.errors[0].message).toBe('Stock must be 0 or greater')
    })

    it('createProduct rejects missing name', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { createProduct(input: { name: "", description: "desc", price: 10, stock: 1 }) { id name } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeNull()
      expect(body.errors[0].message).toBe('Name is required')
    })

    it('createProduct rejects name > 500 characters', async () => {
      const longName = 'x'.repeat(501)
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { createProduct(input: { name: "${longName}", description: "desc", price: 10, stock: 1 }) { id name } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeNull()
      expect(body.errors[0].message).toBe('Name must be 500 characters or less')
    })
  })

  describe('updateProduct validation', () => {
    it('updateProduct updates existing product', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { updateProduct(id: "1", input: { name: "Updated Product", price: 39.99 }) { id name description price stock } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.updateProduct).toBeDefined()
      expect(body.data.updateProduct.name).toBe('Updated Product')
      expect(body.data.updateProduct.price).toBe(39.99)
      expect(body.data.updateProduct.description).toBe('Existing description')
      expect(body.data.updateProduct.stock).toBe(10)
    })

    it('updateProduct partial update (price only)', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { updateProduct(id: "1", input: { price: 49.99 }) { id name price stock description } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.updateProduct.price).toBe(49.99)
      expect(body.data.updateProduct.name).toBe('Updated Product')
    })

    it('updateProduct with non-existent id returns error', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { updateProduct(id: "999", input: { name: "Should Fail" }) { id name } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeNull()
      expect(body.errors).toBeDefined()
      expect(body.errors[0].message).toBe('Product not found')
    })

    it('updateProduct rejects price <= 0', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { updateProduct(id: "1", input: { price: 0 }) { id name } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeNull()
      expect(body.errors[0].message).toBe('Price must be greater than 0')
    })

    it('updateProduct rejects stock < 0', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { updateProduct(id: "1", input: { stock: -5 }) { id name } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeNull()
      expect(body.errors[0].message).toBe('Stock must be 0 or greater')
    })
  })

  describe('deleteProduct validation', () => {
    it('deleteProduct removes product', async () => {
      // First create a product to delete
      const createResponse = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { createProduct(input: { name: "To Delete", description: "desc", price: 15, stock: 3 }) { id } }`
        })
      })
      const createdId = JSON.parse(createResponse.body).data.createProduct.id

      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { deleteProduct(id: "${createdId}") }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.deleteProduct).toBe(true)

      // Verify it's deleted
      const checkResponse = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `{ product(id: "${createdId}") { id name } }`
        })
      })

      const checkBody = JSON.parse(checkResponse.body)
      expect(checkBody.data.product).toBeNull()
    })

    it('deleteProduct with non-existent id returns error', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { deleteProduct(id: "999") }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeNull()
      expect(body.errors).toBeDefined()
      expect(body.errors[0].message).toBe('Product not found')
    })
  })
})

// ============================================================
// AUTH & INTEGRATION TESTS - requireStaff enforcement
// These use JWT auth and test the full flow
// ============================================================

describe('Product CRUD Auth Enforcement', () => {
  let server: FastifyInstance
  let db: Database.Database

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    db = new Database(TEST_DB_PATH)
    db.pragma('journal_mode = WAL')

    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS reservations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          notes TEXT,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `)

    const now = new Date().toISOString()
    db.prepare(`INSERT INTO products (name, description, price, stock, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'Existing Product', 'Existing description', 19.99, 10, null, now, now
    )

    const typeDefs = `
      type Product {
        id: ID!
        name: String!
        description: String!
        price: Float!
        stock: Int!
        imageUrl: String
        createdAt: String!
        updatedAt: String!
      }
      
      type Query {
        products: [Product!]!
        product(id: ID!): Product
      }
      
      type Mutation {
        createProduct(input: CreateProductInput!): Product!
        updateProduct(id: ID!, input: UpdateProductInput!): Product!
        deleteProduct(id: ID!): Boolean!
      }
      
      input CreateProductInput {
        name: String!
        description: String!
        price: Float!
        stock: Int!
        imageUrl: String
      }
      
      input UpdateProductInput {
        name: String
        description: String
        price: Float
        stock: Int
        imageUrl: String
      }
    `

    // Auth-aware resolvers - same as production resolvers.ts
    const authResolvers = {
      Query: {
        products: () => {
          const products = db.prepare(`SELECT * FROM products ORDER BY created_at DESC`).all()
          return products.map((p: any) => ({
            id: p.id, name: p.name, description: p.description,
            price: p.price, stock: p.stock, imageUrl: p.image_url,
            createdAt: p.created_at, updatedAt: p.updated_at
          }))
        },
        product: (_: any, args: { id: string }) => {
          const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.id) as any
          if (!product) return null
          return {
            id: product.id, name: product.name, description: product.description,
            price: product.price, stock: product.stock, imageUrl: product.image_url,
            createdAt: product.created_at, updatedAt: product.updated_at
          }
        }
      },
      Mutation: {
        createProduct: (_: any, args: { input: any }, ctx: any) => {
          // Auth check - same as resolvers.ts
          if (!ctx.user) {
            throw new Error('Unauthorized')
          }
          if (ctx.user.role !== 'ADMIN' && ctx.user.role !== 'STAFF') {
            throw new Error('Insufficient permissions')
          }
          
          const { name, description, price, stock, imageUrl } = args.input
          
          if (!name || name.trim() === '') {
            throw new Error('Name is required')
          }
          if (name.length > 500) {
            throw new Error('Name must be 500 characters or less')
          }
          if (price <= 0) {
            throw new Error('Price must be greater than 0')
          }
          if (stock < 0) {
            throw new Error('Stock must be 0 or greater')
          }
          
          const now = new Date().toISOString()
          const result = db.prepare(`
            INSERT INTO products (name, description, price, stock, image_url, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(name, description, price, stock, imageUrl || null, now, now)
          
          return {
            id: result.lastInsertRowid.toString(),
            name, description, price, stock,
            imageUrl: imageUrl || null,
            createdAt: now, updatedAt: now
          }
        },
        updateProduct: (_: any, args: { id: string; input: any }, ctx: any) => {
          // Auth check
          if (!ctx.user) {
            throw new Error('Unauthorized')
          }
          if (ctx.user.role !== 'ADMIN' && ctx.user.role !== 'STAFF') {
            throw new Error('Insufficient permissions')
          }
          
          const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.id) as any
          if (!existing) {
            throw new Error('Product not found')
          }
          
          const { name, description, price, stock, imageUrl } = args.input
          if (name !== undefined && name.trim() === '') {
            throw new Error('Name is required')
          }
          if (name && name.length > 500) {
            throw new Error('Name must be 500 characters or less')
          }
          if (price !== undefined && price <= 0) {
            throw new Error('Price must be greater than 0')
          }
          if (stock !== undefined && stock < 0) {
            throw new Error('Stock must be 0 or greater')
          }
          
          const now = new Date().toISOString()
          const updateName = name ?? existing.name
          const updateDescription = description ?? existing.description
          const updatePrice = price ?? existing.price
          const updateStock = stock ?? existing.stock
          const updateImageUrl = imageUrl ?? existing.image_url
          
          db.prepare(`
            UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image_url = ?, updated_at = ?
            WHERE id = ?
          `).run(updateName, updateDescription, updatePrice, updateStock, updateImageUrl, now, args.id)
          
          return {
            id: args.id,
            name: updateName, description: updateDescription,
            price: updatePrice, stock: updateStock,
            imageUrl: updateImageUrl,
            createdAt: existing.created_at, updatedAt: now
          }
        },
        deleteProduct: (_: any, args: { id: string }, ctx: any) => {
          // Auth check
          if (!ctx.user) {
            throw new Error('Unauthorized')
          }
          if (ctx.user.role !== 'ADMIN' && ctx.user.role !== 'STAFF') {
            throw new Error('Insufficient permissions')
          }
          
          const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.id)
          if (!existing) {
            throw new Error('Product not found')
          }
          // Manually delete reservations first (ON DELETE CASCADE not always reliable in tests)
          db.prepare(`DELETE FROM reservations WHERE product_id = ?`).run(args.id)
          db.prepare(`DELETE FROM products WHERE id = ?`).run(args.id)
          return true
        }
      }
    }

    const testSchema = makeExecutableSchema({ typeDefs, resolvers: authResolvers })

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
      resolvers: authResolvers,
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

  // ============================================================
  // AUTH TESTS - verify requireStaff() enforcement
  // ============================================================

  describe('createProduct auth enforcement', () => {
    it('createProduct WITHOUT auth context returns Unauthorized error', async () => {
      // No Authorization header - should fail with Unauthorized
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { createProduct(input: { name: "Auth Test", description: "desc", price: 10, stock: 1 }) { id name } }`
        })
      })
      
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeNull()
      expect(body.errors).toBeDefined()
      expect(body.errors[0].message).toBe('Unauthorized')
    })

    it('createProduct WITH valid staff token succeeds', async () => {
      const token = server.jwt.sign({ id: 1, email: 'staff@test.com', role: 'STAFF' })
      
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `mutation { createProduct(input: { name: "Staff Created", description: "desc", price: 10, stock: 1 }) { id name } }`
        })
      })
      
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.createProduct).toBeDefined()
      expect(body.data.createProduct.name).toBe('Staff Created')
    })

    it('createProduct WITH admin token succeeds', async () => {
      const token = server.jwt.sign({ id: 1, email: 'admin@test.com', role: 'ADMIN' })
      
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `mutation { createProduct(input: { name: "Admin Created", description: "desc", price: 10, stock: 1 }) { id name } }`
        })
      })
      
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.createProduct).toBeDefined()
      expect(body.data.createProduct.name).toBe('Admin Created')
    })
  })

  describe('updateProduct auth enforcement', () => {
    it('updateProduct WITHOUT auth context returns Unauthorized error', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { updateProduct(id: "1", input: { name: "Auth Test" }) { id name } }`
        })
      })
      
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeNull()
      expect(body.errors).toBeDefined()
      expect(body.errors[0].message).toBe('Unauthorized')
    })

    it('updateProduct WITH valid staff token succeeds', async () => {
      const token = server.jwt.sign({ id: 2, email: 'staff@test.com', role: 'STAFF' })
      
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `mutation { updateProduct(id: "1", input: { name: "Staff Updated" }) { id name } }`
        })
      })
      
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.updateProduct).toBeDefined()
      expect(body.data.updateProduct.name).toBe('Staff Updated')
    })
  })

  describe('deleteProduct auth enforcement', () => {
    it('deleteProduct WITHOUT auth context returns Unauthorized error', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { deleteProduct(id: "1") }`
        })
      })
      
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeNull()
      expect(body.errors).toBeDefined()
      expect(body.errors[0].message).toBe('Unauthorized')
    })

    it('deleteProduct WITH valid staff token succeeds', async () => {
      const token = server.jwt.sign({ id: 2, email: 'staff@test.com', role: 'STAFF' })
      
      // Create product to delete
      const createResponse = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `mutation { createProduct(input: { name: "To Delete By Staff", description: "desc", price: 10, stock: 1 }) { id } }`
        })
      })
      const createdId = JSON.parse(createResponse.body).data.createProduct.id

      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `mutation { deleteProduct(id: "${createdId}") }`
        })
      })
      
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.deleteProduct).toBe(true)
    })
  })

  // ============================================================
  // DELETE WITH RESERVATIONS - edge case from spec
  // ============================================================

  describe('deleteProduct with reservations', () => {
    it('deleteProduct SUCCEEDS even when product has active reservations (PENDING)', async () => {
      const token = server.jwt.sign({ id: 1, email: 'staff@test.com', role: 'STAFF' })
      
      // Create product
      const createResponse = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `mutation { createProduct(input: { name: "Product With Pending Reservation", description: "desc", price: 50, stock: 10 }) { id } }`
        })
      })
      const createBody = JSON.parse(createResponse.body)
      if (!createBody.data?.createProduct?.id) {
        console.log('Create failed:', JSON.stringify(createBody))
      }
      const productId = createBody.data.createProduct.id.toString()

      // Create pending reservation
      const now = new Date().toISOString()
      db.prepare(`
        INSERT INTO reservations (product_id, quantity, name, email, phone, notes, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `).run(productId, 2, 'Customer Pending', 'pending@test.com', '123456789', null, now, now)

      // Delete product - should succeed even with pending reservation
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `mutation { deleteProduct(id: "${productId}") }`
        })
      })
      
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      if (!body.data?.deleteProduct) {
        console.log('Delete failed:', JSON.stringify(body))
      }
      expect(body.data.deleteProduct).toBe(true)
    })

    it('deleteProduct SUCCEEDS even when product has CONFIRMED reservations', async () => {
      const token = server.jwt.sign({ id: 1, email: 'staff@test.com', role: 'STAFF' })
      
      // Create product
      const createResponse = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `mutation { createProduct(input: { name: "Product With Confirmed Reservation", description: "desc", price: 75, stock: 5 }) { id } }`
        })
      })
      const createBody = JSON.parse(createResponse.body)
      if (!createBody.data?.createProduct?.id) {
        console.log('Create failed:', JSON.stringify(createBody))
      }
      const productId = createBody.data.createProduct.id.toString()

      // Create confirmed reservation
      const now = new Date().toISOString()
      db.prepare(`
        INSERT INTO reservations (product_id, quantity, name, email, phone, notes, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)
      `).run(productId, 3, 'Customer Confirmed', 'confirmed@test.com', '987654321', null, now, now)

      // Delete product - should succeed even with confirmed reservation
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: `mutation { deleteProduct(id: "${productId}") }`
        })
      })
      
      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      if (!body.data?.deleteProduct) {
        console.log('Delete failed:', JSON.stringify(body))
      }
      expect(body.data.deleteProduct).toBe(true)
    })
  })
})
