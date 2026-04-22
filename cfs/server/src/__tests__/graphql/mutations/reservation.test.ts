import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import mercurius from 'mercurius'
import { makeExecutableSchema } from '@graphql-tools/schema'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const TEST_DB_PATH = path.join(__dirname, 'test-reservations.db')

describe('Reservation Mutations', () => {
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
        description TEXT,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER REFERENCES products(id),
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
    // Product with stock
    db.prepare(`INSERT INTO products (name, description, price, stock, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'Product 1', 'Description 1', 10.00, 5, null, now, now
    )
    // Product with 0 stock
    db.prepare(`INSERT INTO products (name, description, price, stock, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'Out of Stock', 'Description 2', 20.00, 0, null, now, now
    )
    // Product with limited stock
    db.prepare(`INSERT INTO products (name, description, price, stock, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'Limited Stock', 'Description 3', 30.00, 2, null, now, now
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
      
      type Reservation {
        id: ID!
        product: Product!
        productId: ID!
        quantity: Int!
        name: String!
        email: String!
        phone: String!
        notes: String
        status: ReservationStatus!
        createdAt: String!
        updatedAt: String!
      }
      
      enum ReservationStatus {
        PENDING
        CONFIRMED
        CANCELLED
        COMPLETED
      }
      
      type Query {
        products: [Product!]!
      }
      
      type Mutation {
        createReservation(input: CreateReservationInput!): Reservation!
      }
      
      input CreateReservationInput {
        productId: ID!
        quantity: Int!
        name: String!
        email: String!
        phone: String!
        notes: String
      }
    `

    const resolvers = {
      Query: {
        products: () => {
          const products = db.prepare(`SELECT * FROM products`).all()
          return products.map((p: any) => ({
            id: p.id, name: p.name, description: p.description,
            price: p.price, stock: p.stock, imageUrl: p.image_url,
            createdAt: p.created_at, updatedAt: p.updated_at
          }))
        }
      },
      Mutation: {
        createReservation: async (_: any, args: { input: any }) => {
          const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.input.productId) as any
          if (!product) {
            throw new Error('Product not found')
          }
          if (product.stock === 0) {
            throw new Error('Product is out of stock')
          }
          if (args.input.quantity > product.stock) {
            throw new Error('Requested quantity exceeds available stock')
          }
          const now = new Date().toISOString()
          const result = db.prepare(`
            INSERT INTO reservations (product_id, quantity, name, email, phone, notes, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
          `).run(args.input.productId, args.input.quantity, args.input.name, args.input.email, args.input.phone, args.input.notes || null, now, now)
          
          return {
            id: result.lastInsertRowid.toString(),
            productId: args.input.productId,
            quantity: args.input.quantity,
            name: args.input.name,
            email: args.input.email,
            phone: args.input.phone,
            notes: args.input.notes,
            status: 'PENDING',
            createdAt: now,
            updatedAt: now,
            product: {
              id: product.id,
              name: product.name,
              description: product.description,
              price: product.price,
              stock: product.stock,
              imageUrl: product.image_url,
              createdAt: product.created_at,
              updatedAt: product.updated_at
            }
          }
        }
      }
    }

    const testSchema = makeExecutableSchema({ typeDefs, resolvers })

    server = Fastify({ logger: false })
    await server.register(mercurius, { schema: testSchema, resolvers })
    await server.ready()
  })

  afterAll(async () => {
    await server.close()
    db.close()
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
  })

  it('createReservation creates with pending status', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { createReservation(input: { productId: "1", quantity: 2, name: "John Doe", email: "john@test.com", phone: "123456789" }) { id status name email quantity } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data.createReservation).toBeDefined()
    expect(body.data.createReservation.status).toBe('PENDING')
    expect(body.data.createReservation.name).toBe('John Doe')
    expect(body.data.createReservation.email).toBe('john@test.com')
    expect(body.data.createReservation.quantity).toBe(2)
  })

  it('createReservation fails if product has 0 stock', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { createReservation(input: { productId: "2", quantity: 1, name: "Jane Doe", email: "jane@test.com", phone: "987654321" }) { id status } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data).toBeNull()
    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toBe('Product is out of stock')
  })

  it('createReservation fails if quantity exceeds stock', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { createReservation(input: { productId: "3", quantity: 10, name: "Bob Smith", email: "bob@test.com", phone: "555555555" }) { id status } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data).toBeNull()
    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toBe('Requested quantity exceeds available stock')
  })

  it('createReservation fails if product does not exist', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { createReservation(input: { productId: "999", quantity: 1, name: "No One", email: "noone@test.com", phone: "000000000" }) { id status } }`
      })
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data).toBeNull()
    expect(body.errors).toBeDefined()
    expect(body.errors[0].message).toBe('Product not found')
  })
})