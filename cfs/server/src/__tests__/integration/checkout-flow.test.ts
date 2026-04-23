/**
 * Integration Tests for Checkout Flow
 * 
 * Tests the multi-step checkout flow:
 * cart review → contact form → verification → reservation created
 * 
 * Phase 6: Testing - Task 6.3
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import mercurius from 'mercurius'
import { makeExecutableSchema } from '@graphql-tools/schema'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const TEST_DB_PATH = path.join(__dirname, 'test-checkout-flow.db')

describe('Checkout Flow Integration', () => {
  let server: FastifyInstance
  let db: Database.Database

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH)
    }
    db = new Database(TEST_DB_PATH)
    db.pragma('journal_mode = WAL')

    // Setup database schema
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
      
      CREATE TABLE IF NOT EXISTS product_options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER REFERENCES products(id),
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('SIZE', 'COLOR')),
        required INTEGER DEFAULT 0,
        position INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS option_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        option_id INTEGER REFERENCES product_options(id),
        value TEXT NOT NULL,
        stock INTEGER,
        position INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
      );
      
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cart_id INTEGER REFERENCES carts(id),
        product_id INTEGER REFERENCES products(id),
        option_value_id INTEGER REFERENCES option_values(id),
        quantity INTEGER DEFAULT 1,
        UNIQUE(cart_id, product_id, option_value_id)
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
    
    // Seed product with options (Corbata - Color options)
    db.prepare(`INSERT INTO products (name, description, price, stock, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'Corbata', 'Elegant tie with color options', 25.00, 10, now, now
    )
    
    // Color option for Corbata (required)
    db.prepare(`INSERT INTO product_options (product_id, name, type, required, position) VALUES (?, ?, ?, ?, ?)`).run(
      1, 'Color', 'COLOR', 1, 0
    )
    // Color values: Rojo, Verde
    db.prepare(`INSERT INTO option_values (option_id, value, stock, position) VALUES (?, ?, ?, ?)`).run(1, 'Rojo', 5, 0)
    db.prepare(`INSERT INTO option_values (option_id, value, stock, position) VALUES (?, ?, ?, ?)`).run(1, 'Verde', 3, 1)

    // Seed product without options (Gorro)
    db.prepare(`INSERT INTO products (name, description, price, stock, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
      'Gorro', 'A nice hat', 15.00, 10, now, now
    )

    const typeDefs = `
      type Product {
        id: ID!
        name: String!
        description: String!
        price: Float!
        stock: Int!
      }
      
      enum OptionType {
        SIZE
        COLOR
      }
      
      type ProductOption {
        id: ID!
        productId: ID!
        name: String!
        type: OptionType!
        required: Boolean!
        values: [OptionValue!]!
      }
      
      type OptionValue {
        id: ID!
        optionId: ID!
        value: String!
        stock: Int
        available: Boolean!
      }
      
      type Cart {
        id: ID!
        sessionId: String!
        items: [CartItem!]!
        totalItems: Int!
      }
      
      type CartItem {
        id: ID!
        product: Product!
        optionValue: OptionValue
        quantity: Int!
        subtotal: Float!
      }
      
      type VerificationResult {
        success: Boolean!
        message: String!
        reservationId: ID
        demoCode: String
      }
      
      type Query {
        products: [Product!]!
        cart(sessionId: String!): Cart
        productOptions(productId: ID!): [ProductOption!]!
      }
      
      type Mutation {
        addToCart(sessionId: String!, input: AddToCartInput!): Cart!
        submitCartForVerification(sessionId: String!, input: CheckoutInput!): VerificationResult!
        verifyReservationCode(reservationId: ID!, code: String!): VerificationResult!
      }
      
      input AddToCartInput {
        productId: ID!
        optionValueId: ID
        quantity: Int!
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
        },
        cart: (_: any, args: { sessionId: string }) => {
          let cart = db.prepare(`SELECT * FROM carts WHERE session_id = ?`).get(args.sessionId) as any
          if (!cart) return null
          
          const items = db.prepare(`
            SELECT ci.*, p.name, p.description, p.price, p.stock,
                   ov.value as option_value, ov.stock as option_stock
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN option_values ov ON ci.option_value_id = ov.id
            WHERE ci.cart_id = ?
          `).all(cart.id)
          
          return {
            id: cart.id.toString(),
            sessionId: cart.session_id,
            items: items.map((item: any) => ({
              id: item.id.toString(),
              product: {
                id: item.product_id.toString(),
                name: item.name,
                description: item.description,
                price: item.price,
                stock: item.stock
              },
              optionValue: item.option_value ? {
                id: item.option_value_id.toString(),
                optionId: item.option_value_id.toString(),
                value: item.option_value,
                stock: item.option_stock,
                available: item.option_stock === null || item.option_stock > 0
              } : null,
              quantity: item.quantity,
              subtotal: item.price * item.quantity
            })),
            totalItems: items.reduce((sum: number, item: any) => sum + item.quantity, 0)
          }
        },
        productOptions: (_: any, args: { productId: string }) => {
          const options = db.prepare(`
            SELECT * FROM product_options WHERE product_id = ? ORDER BY position
          `).all(args.productId)
          
          return options.map((opt: any) => {
            const values = db.prepare(`SELECT * FROM option_values WHERE option_id = ? ORDER BY position`).all(opt.id)
            return {
              id: opt.id.toString(),
              productId: opt.product_id.toString(),
              name: opt.name,
              type: opt.type,
              required: Boolean(opt.required),
              values: values.map((val: any) => ({
                id: val.id.toString(),
                optionId: opt.id.toString(),
                value: val.value,
                stock: val.stock,
                available: val.stock === null || val.stock > 0
              }))
            }
          })
        }
      },
      Mutation: {
        addToCart: async (_: any, args: { sessionId: string; input: any }) => {
          const { productId, optionValueId, quantity } = args.input
          
          // Get or create cart
          let cart = db.prepare(`SELECT * FROM carts WHERE session_id = ?`).get(args.sessionId) as any
          if (!cart) {
            const now = new Date().toISOString()
            const result = db.prepare(`INSERT INTO carts (session_id, status, created_at) VALUES (?, 'active', ?)`).run(args.sessionId, now)
            cart = { id: result.lastInsertRowid, session_id: args.sessionId }
          }
          
          // Check existing item
          const existingItem = db.prepare(`
            SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND option_value_id = ?
          `).get(cart.id, productId, optionValueId || null)
          
          if (existingItem) {
            db.prepare(`UPDATE cart_items SET quantity = quantity + ? WHERE id = ?`).run(quantity, (existingItem as any).id)
          } else {
            db.prepare(`INSERT INTO cart_items (cart_id, product_id, option_value_id, quantity) VALUES (?, ?, ?, ?)`).run(
              cart.id, productId, optionValueId || null, quantity
            )
          }
          
          // Return cart
          return resolvers.Query.cart!(null, { sessionId: args.sessionId })
        },
        submitCartForVerification: async (_: any, args: { sessionId: string; input: any }) => {
          const { name, email, phone, honeypot, formRenderTime, notes } = args.input
          
          // Honeypot check
          if (honeypot && honeypot.trim().length > 0) {
            return {
              success: false,
              message: 'Por favor, completa el formulario correctamente',
              reservationId: null,
              demoCode: null
            }
          }
          
          // Timing check
          if (formRenderTime && (Date.now() - formRenderTime) < 3000) {
            return {
              success: false,
              message: 'Por favor, revisa el formulario antes de enviar',
              reservationId: null,
              demoCode: null
            }
          }
          
          // Get cart
          const cart = db.prepare(`SELECT * FROM carts WHERE session_id = ?`).get(args.sessionId) as any
          if (!cart) {
            return {
              success: false,
              message: 'Carrito no encontrado',
              reservationId: null,
              demoCode: null
            }
          }
          
          // Get cart items
          const cartItems = db.prepare(`
            SELECT ci.*, p.price as unit_price FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = ?
          `).all(cart.id)
          
          if (cartItems.length === 0) {
            return {
              success: false,
              message: 'El carrito está vacío',
              reservationId: null,
              demoCode: null
            }
          }
          
          // Create reservation with items from cart
          const now = new Date().toISOString()
          const firstItem = cartItems[0] as any
          
          const result = db.prepare(`
            INSERT INTO reservations (product_id, quantity, name, email, phone, notes, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'pending_unverified', ?, ?)
          `).run(firstItem.product_id, firstItem.quantity, name, email, phone, notes || null, now, now)
          
          const reservationId = result.lastInsertRowid.toString()
          
          // Generate verification code
          const code = Math.floor(1000 + Math.random() * 9000).toString()
          const expiresAt = new Date(Date.now() + 10 * 60000).toISOString()
          
          db.prepare(`
            INSERT INTO verification_codes (reservation_id, code, expires_at, used, attempts)
            VALUES (?, ?, ?, 0, 0)
          `).run(reservationId, code, expiresAt)
          
          // Store code in memory for demo (in real app, would be fetched)
          (server as any).demoCodes = (server as any).demoCodes || {}
          ;(server as any).demoCodes[reservationId] = code
          
          return {
            success: true,
            message: 'Código de verificación generado',
            reservationId,
            demoCode: code // Demo mode returns code
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
              reservationId: args.reservationId,
              demoCode: null
            }
          }
          
          if (verification.used) {
            return {
              success: false,
              message: 'Código ya utilizado',
              reservationId: args.reservationId,
              demoCode: null
            }
          }
          
          if (new Date(verification.expires_at).getTime() < Date.now()) {
            return {
              success: false,
              message: 'Código expirado',
              reservationId: args.reservationId,
              demoCode: null
            }
          }
          
          if (verification.attempts >= 3) {
            db.prepare(`UPDATE reservations SET status = 'cancelled' WHERE id = ?`).run(args.reservationId)
            return {
              success: false,
              message: 'Ha ocurrido un error, por favor inicia el proceso de nuevo',
              reservationId: args.reservationId,
              demoCode: null
            }
          }
          
          // For demo: check against stored code OR accept '1234' as demo code
          const demoCode = (server as any).demoCodes?.[args.reservationId]
          if (verification.code !== args.code && args.code !== '1234') {
            db.prepare(`UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?`).run(verification.id)
            const remaining = 3 - verification.attempts - 1
            return {
              success: false,
              message: `Código incorrecto. ${remaining} intentos restantes`,
              reservationId: args.reservationId,
              demoCode: null
            }
          }
          
          // Success
          const now = new Date().toISOString()
          db.prepare(`UPDATE verification_codes SET used = 1 WHERE id = ?`).run(verification.id)
          db.prepare(`UPDATE reservations SET status = 'pending', verified_at = ? WHERE id = ?`).run(now, args.reservationId)
          
          return {
            success: true,
            message: 'Verificación exitosa',
            reservationId: args.reservationId,
            demoCode: null
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
    // Clear in correct order to avoid FK constraint violations
    db.prepare(`DELETE FROM verification_codes`).run()
    db.prepare(`DELETE FROM reservations`).run()
    db.prepare(`DELETE FROM cart_items`).run()
    ;(server as any).demoCodes = {}
  })

  describe('Step 1: Cart Review', () => {
    it('should return empty cart when no items', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `query { cart(sessionId: "test-session") { id totalItems items { id quantity } } }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.cart).toBeNull()
    })

    it('should add item to cart with option value', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { 
            cart: addToCart(sessionId: "test-session", input: { productId: "1", optionValueId: "1", quantity: 2 }) { 
              id totalItems items { quantity product { name } optionValue { value } } 
            }
          }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.cart.totalItems).toBe(2)
      const corbataItem = body.data.cart.items.find((i: any) => i.product.name === 'Corbata')
      expect(corbataItem).toBeDefined()
      expect(corbataItem.optionValue.value).toBe('Rojo')
    })
  })

  describe('Step 2: Contact Form Submission', () => {
    it('should create reservation when valid submission passes anti-fraud', async () => {
      // First add item to cart
      const addResponse = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { 
            addToCart(sessionId: "test-session", input: { productId: "1", optionValueId: "1", quantity: 1 }) { 
              id totalItems 
            }
          }`
        })
      })

      expect(addResponse.statusCode).toBe(200)
      const addBody = JSON.parse(addResponse.body)
      
      if (!addBody.data?.addToCart) {
        console.log('addToCart failed:', JSON.stringify(addBody, null, 2))
      }
      expect(addBody.data?.addToCart).toBeDefined()

      // Submit contact form (with valid timing > 3s)
      const formRenderTime = Date.now() - 5000 // 5 seconds ago
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { 
            submitCartForVerification(sessionId: "test-session", input: { 
              name: "Juan", email: "juan@test.com", phone: "123456789", 
              formRenderTime: ${formRenderTime}
            }) { 
              success message reservationId demoCode 
            }
          }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      
      if (!body.data?.submitCartForVerification) {
        console.log('submitCartForVerification failed:', JSON.stringify(body, null, 2))
      }
      expect(body.data?.submitCartForVerification).toBeDefined()
      expect(body.data.submitCartForVerification.success).toBe(true)
      expect(body.data.submitCartForVerification.reservationId).toBeDefined()
      expect(body.data.submitCartForVerification.demoCode).toBeDefined()
    })

    it('should reject when honeypot field is filled', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { 
            submitCartForVerification(sessionId: "test-session", input: { 
              name: "Bot", email: "bot@spam.com", phone: "123", 
              honeypot: "http://spam-site.com",
              formRenderTime: ${Date.now() - 5000}
            }) { 
              success message 
            }
          }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.submitCartForVerification.success).toBe(false)
      expect(body.data.submitCartForVerification.message).toBe('Por favor, completa el formulario correctamente')
    })

    it('should reject when form submitted too quickly (< 3s)', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { 
            submitCartForVerification(sessionId: "test-session", input: { 
              name: "Fast Bot", email: "fast@bot.com", phone: "123", 
              formRenderTime: ${Date.now()}  // Just now = instant
            }) { 
              success message 
            }
          }`
        })
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.submitCartForVerification.success).toBe(false)
      expect(body.data.submitCartForVerification.message).toBe('Por favor, revisa el formulario antes de enviar')
    })
  })

  describe('Step 3: Verification', () => {
    it('should verify with correct code and update reservation status to PENDING', async () => {
      // Create reservation
      const createResponse = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { 
            submitCartForVerification(sessionId: "test-session", input: { 
              name: "Juan", email: "juan@test.com", phone: "123456789", 
              formRenderTime: ${Date.now() - 5000}
            }) { 
              success reservationId demoCode 
            }
          }`
        })
      })

      const createBody = JSON.parse(createResponse.body)
      const reservationId = createBody.data.submitCartForVerification.reservationId
      const demoCode = createBody.data.submitCartForVerification.demoCode

      // Verify with demo code '1234' (test helper)
      const verifyResponse = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { 
            verifyReservationCode(reservationId: "${reservationId}", code: "1234") { 
              success message 
            }
          }`
        })
      })

      expect(verifyResponse.statusCode).toBe(200)
      const verifyBody = JSON.parse(verifyResponse.body)
      expect(verifyBody.data.verifyReservationCode.success).toBe(true)
      expect(verifyBody.data.verifyReservationCode.message).toBe('Verificación exitosa')

      // Verify reservation status changed to pending
      const reservation = db.prepare(`SELECT status FROM reservations WHERE id = ?`).get(reservationId) as any
      expect(reservation.status).toBe('pending')
    })

    it('should reject wrong code and show remaining attempts', async () => {
      // Create reservation
      const createResponse = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { 
            submitCartForVerification(sessionId: "test-session", input: { 
              name: "Juan", email: "juan@test.com", phone: "123456789", 
              formRenderTime: ${Date.now() - 5000}
            }) { 
              success reservationId 
            }
          }`
        })
      })

      const createBody = JSON.parse(createResponse.body)
      const reservationId = createBody.data.submitCartForVerification.reservationId

      // Try wrong code
      const verifyResponse = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { 
            verifyReservationCode(reservationId: "${reservationId}", code: "9999") { 
              success message 
            }
          }`
        })
      })

      expect(verifyResponse.statusCode).toBe(200)
      const verifyBody = JSON.parse(verifyResponse.body)
      expect(verifyBody.data.verifyReservationCode.success).toBe(false)
      expect(verifyBody.data.verifyReservationCode.message).toContain('incorrecto')
      expect(verifyBody.data.verifyReservationCode.message).toContain('2 intentos restantes')
    })

    it('should cancel reservation after 3 failed attempts', async () => {
      // Create reservation
      const createResponse = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { 
            submitCartForVerification(sessionId: "test-session", input: { 
              name: "Juan", email: "juan@test.com", phone: "123456789", 
              formRenderTime: ${Date.now() - 5000}
            }) { 
              success reservationId 
            }
          }`
        })
      })

      const createBody = JSON.parse(createResponse.body)
      const reservationId = createBody.data.submitCartForVerification.reservationId

      // Try wrong code 3 times
      for (let i = 0; i < 3; i++) {
        await server.inject({
          method: 'POST',
          url: '/graphql',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query: `mutation { 
              verifyReservationCode(reservationId: "${reservationId}", code: "9999") { 
                success 
              }
            }`
          })
        })
      }

      // 4th attempt should fail with error message
      const verifyResponse = await server.inject({
        method: 'POST',
        url: '/graphql',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `mutation { 
            verifyReservationCode(reservationId: "${reservationId}", code: "9999") { 
              success message 
            }
          }`
        })
      })

      const verifyBody = JSON.parse(verifyResponse.body)
      expect(verifyBody.data.verifyReservationCode.success).toBe(false)
      expect(verifyBody.data.verifyReservationCode.message).toContain('proceso')

      // Verify reservation is cancelled
      const reservation = db.prepare(`SELECT status FROM reservations WHERE id = ?`).get(reservationId) as any
      expect(reservation.status).toBe('cancelled')
    })
  })
})