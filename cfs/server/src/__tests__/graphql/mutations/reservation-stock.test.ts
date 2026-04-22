import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import mercurius from 'mercurius'
import { makeExecutableSchema } from '@graphql-tools/schema'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const TEST_DB_PATH = path.join(__dirname, 'test-reservation-stock.db')

describe('Reservation Stock Management', () => {
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
      
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    // Product with stock = 10
    db.prepare(`INSERT INTO products (name, description, price, stock, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'Test Product', 'Description', 100.00, 10, null, now, now
    )
    // Product with stock = 5
    db.prepare(`INSERT INTO products (name, description, price, stock, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      'Limited Product', 'Description', 50.00, 5, null, now, now
    )

    // Create staff user for auth
    db.prepare(`INSERT INTO users (email, password, role, created_at) VALUES (?, ?, ?, ?)`).run(
      'staff@test.com', 'hashed_password', 'staff', now
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
      
      type User {
        id: ID!
        email: String!
        role: String!
        createdAt: String!
      }
      
      type Query {
        products: [Product!]!
        reservation(id: ID!): Reservation
      }
      
      type Mutation {
        updateReservationStatus(id: ID!, status: ReservationStatus!): Reservation!
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
        },
        reservation: (_: any, args: { id: string }) => {
          const row = db.prepare(`
            SELECT r.*, p.name as product_name, p.description as product_description, 
                   p.price as product_price, p.stock as product_stock, p.image_url as product_image_url,
                   p.created_at as product_created_at, p.updated_at as product_updated_at
            FROM reservations r
            LEFT JOIN products p ON r.product_id = p.id
            WHERE r.id = ?
          `).get(args.id) as any
          if (!row) return null
          return {
            id: row.id.toString(),
            productId: row.product_id.toString(),
            quantity: row.quantity,
            name: row.name,
            email: row.email,
            phone: row.phone,
            notes: row.notes,
            status: row.status.toUpperCase(),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            product: {
              id: row.product_id.toString(),
              name: row.product_name,
              description: row.product_description,
              price: row.product_price,
              stock: row.product_stock,
              imageUrl: row.product_image_url,
              createdAt: row.product_created_at,
              updatedAt: row.product_updated_at
            }
          }
        }
      },
      Mutation: {
        updateReservationStatus: (_: any, args: { id: string; status: string }, ctx: any) => {
          // Mock auth - in real app would check JWT
          const existing = db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(args.id) as any
          if (!existing) {
            throw new Error('Reservation not found')
          }
          
          const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
          if (!validStatuses.includes(args.status.toUpperCase())) {
            throw new Error('Invalid status')
          }
          
          const prevStatus = existing.status
          const newStatus = args.status.toLowerCase()
          const quantity = existing.quantity
          const productId = existing.product_id
          
          // Update reservation status
          const now = new Date().toISOString()
          db.prepare(`UPDATE reservations SET status = ?, updated_at = ? WHERE id = ?`)
            .run(newStatus, now, args.id)
          
          // FR-032: Stock adjustment logic
          // When status changes to CONFIRMED: decrease product stock by reservation quantity
          if (newStatus === 'confirmed' && prevStatus !== 'confirmed') {
            db.prepare(`UPDATE products SET stock = stock - ? WHERE id = ?`)
              .run(quantity, productId)
          }
          
          // When status changes to CANCELLED (and was previously CONFIRMED): restore product stock
          if (newStatus === 'cancelled' && prevStatus === 'confirmed') {
            db.prepare(`UPDATE products SET stock = stock + ? WHERE id = ?`)
              .run(quantity, productId)
          }
          
          // Get updated reservation with product
          const row = db.prepare(`
            SELECT r.*, p.name as product_name, p.description as product_description, 
                   p.price as product_price, p.stock as product_stock, p.image_url as product_image_url,
                   p.created_at as product_created_at, p.updated_at as product_updated_at
            FROM reservations r
            LEFT JOIN products p ON r.product_id = p.id
            WHERE r.id = ?
          `).get(args.id) as any
          
          return {
            id: row.id.toString(),
            productId: row.product_id.toString(),
            quantity: row.quantity,
            name: row.name,
            email: row.email,
            phone: row.phone,
            notes: row.notes,
            status: row.status.toUpperCase(),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            product: {
              id: row.product_id.toString(),
              name: row.product_name,
              description: row.product_description,
              price: row.product_price,
              stock: row.product_stock,
              imageUrl: row.product_image_url,
              createdAt: row.product_created_at,
              updatedAt: row.product_updated_at
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

  beforeEach(() => {
    // Reset product stock to known state
    db.prepare(`UPDATE products SET stock = 10, updated_at = ? WHERE id = 1`).run(new Date().toISOString())
    db.prepare(`UPDATE products SET stock = 5, updated_at = ? WHERE id = 2`).run(new Date().toISOString())
    
    // Clear reservations and reset autoincrement
    db.prepare(`DELETE FROM reservations`).run()
    db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'reservations'`).run()
  })

  it('confirming reservation decreases product stock', async () => {
    // Create a pending reservation
    const now = new Date().toISOString()
    const result = db.prepare(`
      INSERT INTO reservations (product_id, quantity, name, email, phone, notes, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(1, 3, 'Test Customer', 'test@example.com', '123456789', null, now, now)
    const reservationId = result.lastInsertRowid
    
    // Initial product stock is 10
    const productBefore = db.prepare(`SELECT stock FROM products WHERE id = 1`).get() as any
    expect(productBefore.stock).toBe(10)
    
    // Confirm the reservation
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { updateReservationStatus(id: "${reservationId}", status: CONFIRMED) { id status product { id stock } quantity } }`
      })
    })
    
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data).toBeDefined()
    expect(body.data.updateReservationStatus.status).toBe('CONFIRMED')
    
    // Stock should be decreased by 3 (reservation quantity)
    const productAfter = db.prepare(`SELECT stock FROM products WHERE id = 1`).get() as any
    expect(productAfter.stock).toBe(7)
  })

  it('cancelling confirmed reservation restores stock', async () => {
    // Create a pending reservation first, then confirm it through the mutation
    const now = new Date().toISOString()
    const insertResult = db.prepare(`
      INSERT INTO reservations (product_id, quantity, name, email, phone, notes, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(1, 2, 'Test Customer', 'test@example.com', '123456789', null, now, now)
    const reservationId = insertResult.lastInsertRowid
    
    // First, confirm the reservation (this should decrease stock)
    await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { updateReservationStatus(id: "${reservationId}", status: CONFIRMED) { id status } }`
      })
    })
    
    // Stock should now be 8 (started at 10, decreased by 2)
    const productBefore = db.prepare(`SELECT stock FROM products WHERE id = 1`).get() as any
    expect(productBefore.stock).toBe(8)
    
    // Now cancel the reservation
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { updateReservationStatus(id: "${reservationId}", status: CANCELLED) { id status product { id stock } quantity } }`
      })
    })
    
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data).toBeDefined()
    expect(body.data.updateReservationStatus.status).toBe('CANCELLED')
    
    // Stock should be restored by 2 (reservation quantity)
    const productAfter = db.prepare(`SELECT stock FROM products WHERE id = 1`).get() as any
    expect(productAfter.stock).toBe(10)
  })

  it('cancelling pending reservation does NOT restore stock', async () => {
    // Create a pending reservation (never confirmed, stock never decreased)
    const now = new Date().toISOString()
    const result = db.prepare(`
      INSERT INTO reservations (product_id, quantity, name, email, phone, notes, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(1, 4, 'Test Customer', 'test@example.com', '123456789', null, now, now)
    const reservationId = result.lastInsertRowid
    
    // Stock should still be 10 (never decreased for pending reservation)
    const productBefore = db.prepare(`SELECT stock FROM products WHERE id = 1`).get() as any
    expect(productBefore.stock).toBe(10)
    
    // Cancel the reservation
    const response = await server.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `mutation { updateReservationStatus(id: "${reservationId}", status: CANCELLED) { id status product { id stock } quantity } }`
      })
    })
    
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.data).toBeDefined()
    expect(body.data.updateReservationStatus.status).toBe('CANCELLED')
    
    // Stock should still be 10 (was never decreased since it was pending)
    const productAfter = db.prepare(`SELECT stock FROM products WHERE id = 1`).get() as any
    expect(productAfter.stock).toBe(10)
  })
})