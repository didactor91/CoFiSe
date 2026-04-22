import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'

// Test configuration
const TEST_DB_PATH = `/tmp/test-cfs-${randomUUID()}.db`
const SCHEMA_PATH = join(process.cwd(), '..', 'database', 'schema.sql')

describe('Database Initialization', () => {
  let db: Database.Database

  beforeAll(() => {
    db = new Database(TEST_DB_PATH)
    // Apply schema from schema.sql
    const schema = readFileSync(SCHEMA_PATH, 'utf-8')
    db.exec(schema)
  })

  afterAll(() => {
    db.close()
  })

  describe('Schema Creation', () => {
    it('should create users table with correct schema', () => {
      // Check that users table exists
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get()
      expect(tables).toBeDefined()
      
      // Check column structure
      const columns = db.prepare("PRAGMA table_info(users)").all() as Array<{name: string, type: string, notnull: number, pk: number}>
      expect(columns.length).toBe(5)
      
      const columnNames = columns.map(c => c.name)
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('email')
      expect(columnNames).toContain('password')
      expect(columnNames).toContain('role')
      expect(columnNames).toContain('created_at')
    })

    it('should create news table with correct schema', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='news'").get()
      expect(tables).toBeDefined()
      
      const columns = db.prepare("PRAGMA table_info(news)").all() as Array<{name: string, type: string}>
      expect(columns.length).toBe(6)
      
      const columnNames = columns.map(c => c.name)
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('title')
      expect(columnNames).toContain('content')
      expect(columnNames).toContain('image_url')
      expect(columnNames).toContain('created_at')
      expect(columnNames).toContain('updated_at')
    })

    it('should create products table with correct schema', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'").get()
      expect(tables).toBeDefined()
      
      const columns = db.prepare("PRAGMA table_info(products)").all() as Array<{name: string, type: string}>
      expect(columns.length).toBe(8)
      
      const columnNames = columns.map(c => c.name)
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('name')
      expect(columnNames).toContain('description')
      expect(columnNames).toContain('price')
      expect(columnNames).toContain('stock')
      expect(columnNames).toContain('image_url')
      expect(columnNames).toContain('created_at')
      expect(columnNames).toContain('updated_at')
    })

    it('should create reservations table with correct schema', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='reservations'").get()
      expect(tables).toBeDefined()
      
      const columns = db.prepare("PRAGMA table_info(reservations)").all() as Array<{name: string, type: string}>
      expect(columns.length).toBe(10)
      
      const columnNames = columns.map(c => c.name)
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('product_id')
      expect(columnNames).toContain('quantity')
      expect(columnNames).toContain('name')
      expect(columnNames).toContain('email')
      expect(columnNames).toContain('phone')
      expect(columnNames).toContain('notes')
      expect(columnNames).toContain('status')
      expect(columnNames).toContain('created_at')
      expect(columnNames).toContain('updated_at')
    })

    it('should enforce unique constraint on users.email', () => {
      const user1 = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(
        'test@example.com', 'hash1', 'staff'
      )
      expect(user1.changes).toBe(1)
      
      // Second insert with same email should fail
      expect(() => {
        db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(
          'test@example.com', 'hash2', 'admin'
        )
      }).toThrow()
    })

    it('should enforce foreign key constraint on reservations.product_id', () => {
      // Insert a product first
      const product = db.prepare('INSERT INTO products (name, description, price) VALUES (?, ?, ?)').run(
        'Test Product', 'Description', 99.99
      )
      const productId = product.lastInsertRowid
      
      // Create reservation for existing product - should succeed
      const reservation = db.prepare(
        'INSERT INTO reservations (product_id, quantity, name, email, phone) VALUES (?, ?, ?, ?, ?)'
      ).run(productId, 1, 'Test User', 'test@test.com', '123456789')
      expect(reservation.changes).toBe(1)
      
      // Create reservation for non-existent product - should fail
      expect(() => {
        db.prepare(
          'INSERT INTO reservations (product_id, quantity, name, email, phone) VALUES (?, ?, ?, ?, ?)'
        ).run(999999, 1, 'Test User', 'test@test.com', '123456789')
      }).toThrow()
    })
  })

  describe('Default Values', () => {
    it('should set default status to pending for reservations', () => {
      const product = db.prepare('INSERT INTO products (name, description, price) VALUES (?, ?, ?)').run(
        'Test Product', 'Description', 99.99
      )
      
      const reservation = db.prepare(
        'INSERT INTO reservations (product_id, quantity, name, email, phone) VALUES (?, ?, ?, ?, ?)'
      ).run(product.lastInsertRowid, 1, 'Test User', 'test@test.com', '123456789')
      
      const result = db.prepare('SELECT status FROM reservations WHERE id = ?').get(reservation.lastInsertRowid) as { status: string }
      expect(result.status).toBe('pending')
    })

    it('should set default stock to 0 for products', () => {
      const product = db.prepare('INSERT INTO products (name, description, price) VALUES (?, ?, ?)').run(
        'Test Product', 'Description', 99.99
      )
      
      const result = db.prepare('SELECT stock FROM products WHERE id = ?').get(product.lastInsertRowid) as { stock: number }
      expect(result.stock).toBe(0)
    })
  })
})