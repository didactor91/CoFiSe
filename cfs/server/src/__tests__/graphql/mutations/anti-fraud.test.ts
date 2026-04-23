import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import mercurius from 'mercurius'
import { makeExecutableSchema } from '@graphql-tools/schema'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const TEST_DB_PATH = path.join(__dirname, 'test-anti-fraud.db')

describe('Anti-Fraud Mutation Tests', () => {
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
        status TEXT DEFAULT 'pending_unverified',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        verified_at DATETIME,
        cart_id INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reservation_id INTEGER REFERENCES reservations(id),
        code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        attempts INTEGER DEFAULT 0
      );
    `)

    const now = new Date().toISOString()
    db.prepare(`INSERT INTO products (name, description, price, stock, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'Product 1', 'Description 1', 10.00, 5, now, now
    )

    const typeDefs = `
      type Product {
        id: ID!
        name: String!
        description: String!
        price: Float!
        stock: Int!
      }
      
      type Reservation {
        id: ID!
        product: Product!
        quantity: Int!
        name: String!
        email: String!
        phone: String!
        notes: String
        status: String!
      }
      
      type VerificationResult {
        success: Boolean!
        message: String!
        reservationId: ID
      }
      
      type Query {
        products: [Product!]!
      }
      
      type Mutation {
        submitCartForVerification(input: CheckoutInput!): VerificationResult!
        verifyReservationCode(reservationId: ID!, code: String!): VerificationResult!
      }
      
      input CheckoutInput {
        name: String!
        email: String!
        phone: String!
        notes: String
        honeypot: String
        formRenderTime: Float!
      }
    `

    // Simple implementation for testing
    const resolvers = {
      Query: {
        products: () => {
          return db.prepare(`SELECT * FROM products`).all().map((p: any) => ({
            id: p.id.toString(),
            name: p.name,
            description: p.description,
            price: p.price,
            stock: p.stock
          }))
        }
      },
      Mutation: {
        submitCartForVerification: async (_: any, args: { input: any }) => {
          const { name, email, phone, honeypot, formRenderTime } = args.input
          
          // Honeypot check
          if (honeypot && honeypot.trim().length > 0) {
            return {
              success: false,
              message: 'Por favor, completa el formulario correctamente',
              reservationId: null
            }
          }
          
          // Timing check
          if (formRenderTime && (Date.now() - formRenderTime) < 3000) {
            return {
              success: false,
              message: 'Por favor, revisa el formulario antes de enviar',
              reservationId: null
            }
          }
          
          // Rate limit check (would need IP, simplified for this test)
          // For testing, we check if this email/IP combo has 3+ recent reservations
          const recentCount = (db.prepare(`
            SELECT COUNT(*) as count FROM reservations 
            WHERE email = ? AND datetime(created_at) > datetime('now', '-1 hour')
          `).get(email) as any).count
          
          if (recentCount >= 3) {
            return {
              success: false,
              message: 'Algo salió mal, por favor intenta más tarde',
              reservationId: null
            }
          }
          
          // Create reservation
          const result = db.prepare(`
            INSERT INTO reservations (product_id, quantity, name, email, phone, notes, status, created_at, updated_at)
            VALUES (1, 1, ?, ?, ?, ?, 'pending_unverified', ?, ?)
          `).run(name, email, phone, args.input.notes || null, now, now)
          
          const reservationId = result.lastInsertRowid.toString()
          
          // Generate verification code
          const code = Math.floor(1000 + Math.random() * 9000).toString()
          const expiresAt = new Date(Date.now() + 10 * 60000).toISOString()
          
          db.prepare(`
            INSERT INTO verification_codes (reservation_id, code, expires_at, used, attempts)
            VALUES (?, ?, ?, 0, 0)
          `).run(reservationId, code, expiresAt)
          
          return {
            success: true,
            message: 'Verification code generated',
            reservationId
          }
        },
        verifyReservationCode: async (_: any, args: { reservationId: string; code: string }) => {
          const verification = db.prepare(`
            SELECT vc.*, r.status as reservation_status 
            FROM verification_codes vc
            JOIN reservations r ON vc.reservation_id = r.id
            WHERE vc.reservation_id = ?
          `).get(args.reservationId) as any
          
          if (!verification) {
            return {
              success: false,
              message: 'Código inválido',
              reservationId: args.reservationId
            }
          }
          
          if (verification.used) {
            return {
              success: false,
              message: 'Código ya utilizado',
              reservationId: args.reservationId
            }
          }
          
          if (new Date(verification.expires_at).getTime() < Date.now()) {
            return {
              success: false,
              message: 'Código expirado',
              reservationId: args.reservationId
            }
          }
          
          if (verification.attempts >= 3) {
            // Cancel reservation
            db.prepare(`UPDATE reservations SET status = 'cancelled' WHERE id = ?`).run(args.reservationId)
            return {
              success: false,
              message: 'Ha ocurrido un error, por favor inicia el proceso de nuevo',
              reservationId: args.reservationId
            }
          }
          
          if (verification.code !== args.code) {
            // Increment attempts
            db.prepare(`UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?`).run(verification.id)
            const remaining = 3 - verification.attempts - 1
            return {
              success: false,
              message: `Código incorrecto. ${remaining} intentos restantes`,
              reservationId: args.reservationId
            }
          }
          
          // Success
          db.prepare(`UPDATE verification_codes SET used = 1 WHERE id = ?`).run(verification.id)
          db.prepare(`UPDATE reservations SET status = 'pending', verified_at = ? WHERE id = ?`).run(now, args.reservationId)
          
          return {
            success: true,
            message: 'Verificación exitosa',
            reservationId: args.reservationId
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

  describe('submitCartForVerification', () => {
    it('rejects when honeypot is filled', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { submitCartForVerification(input: { name: "John", email: "john@test.com", phone: "123", honeypot: "http://spam.com", formRenderTime: 5000 }) { success message } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.submitCartForVerification.success).toBe(false)
      expect(body.data.submitCartForVerification.message).toBe('Por favor, completa el formulario correctamente')
    })

    it('rejects fast form submission (< 3 seconds)', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { submitCartForVerification(input: { name: "John", email: "fast@test.com", phone: "123", formRenderTime: ${Date.now()} }) { success message } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.submitCartForVerification.success).toBe(false)
      expect(body.data.submitCartForVerification.message).toBe('Por favor, revisa el formulario antes de enviar')
    })

    it('accepts valid submission with normal timing', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { submitCartForVerification(input: { name: "John", email: "normal@test.com", phone: "123", formRenderTime: ${Date.now() - 5000} }) { success reservationId } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.submitCartForVerification.success).toBe(true)
      expect(body.data.submitCartForVerification.reservationId).toBeDefined()
    })
  })

  describe('verifyReservationCode', () => {
    it('rejects wrong code and increments attempts', async () => {
      // First create a reservation
      const createResponse = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { submitCartForVerification(input: { name: "Jane", email: "jane@test.com", phone: "456", formRenderTime: 5000 }) { success reservationId } }`
        })
      })
      
      const createBody = JSON.parse(createResponse.body)
      if (!createBody.data?.submitCartForVerification?.reservationId) {
        console.log('Create failed:', JSON.stringify(createBody))
      }
      const reservationId = createBody.data.submitCartForVerification.reservationId
      
      // Try wrong code
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { verifyReservationCode(reservationId: "${reservationId}", code: "0000") { success message } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      if (!body.data?.verifyReservationCode) {
        console.log('Verify failed:', JSON.stringify(body))
      }
      expect(body.data?.verifyReservationCode?.success).toBe(false)
      expect(body.data?.verifyReservationCode?.message).toContain('incorrecto')
    })

    it('cancels reservation after 3 failed attempts', async () => {
      // Create fresh reservation
      const createResponse = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { submitCartForVerification(input: { name: "Bob", email: "bob@test.com", phone: "789", formRenderTime: 5000 }) { success reservationId } }`
        })
      })
      
      const createBody = JSON.parse(createResponse.body)
      if (!createBody.data?.submitCartForVerification?.reservationId) {
        console.log('Create failed:', JSON.stringify(createBody))
      }
      const reservationId = createBody.data.submitCartForVerification.reservationId
      
      // Try wrong code 3 times
      for (let i = 0; i < 3; i++) {
        const res = await server.inject({
          method: 'POST',
          url: '/graphql',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query: `mutation { verifyReservationCode(reservationId: "${reservationId}", code: "0000") { success } }`
          })
        })
        console.log(`Attempt ${i+1}:`, JSON.parse(res.body))
      }
      
      // 4th attempt should fail due to cancellation
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { verifyReservationCode(reservationId: "${reservationId}", code: "0000") { success message } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      if (!body.data?.verifyReservationCode) {
        console.log('Verify after 3 failures failed:', JSON.stringify(body))
      }
      expect(body.data?.verifyReservationCode?.success).toBe(false)
      expect(body.data?.verifyReservationCode?.message).toContain('proceso')
    })
  })
})
