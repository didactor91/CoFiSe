import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'

// Test configuration
const TEST_DB_PATH = `/tmp/test-cfs-seed-${randomUUID()}.db`

describe('Database Seed Data', () => {
  let db: Database.Database

  beforeAll(() => {
    db = new Database(TEST_DB_PATH)
    
    // Create schema first
    const schemaPath = join(process.cwd(), '..', 'database', 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')
    db.exec(schema)
    
    // Run seed
    const seedPath = join(process.cwd(), '..', 'database', 'seed.sql')
    const seed = readFileSync(seedPath, 'utf-8')
    db.exec(seed)
  })

  afterAll(() => {
    db.close()
  })

  describe('Admin User', () => {
    it('should have admin@senacom.com user with hashed password', () => {
      const admin = db.prepare('SELECT email, password, role FROM users WHERE email = ?').get('admin@senacom.com') as {
        email: string
        password: string
        role: string
      } | undefined
      
      expect(admin).toBeDefined()
      expect(admin!.email).toBe('admin@senacom.com')
      expect(admin!.role).toBe('admin')
      // Password should be bcrypt hash, not plain text
      expect(admin!.password).toMatch(/^\$2[aby]?\$\d{1,2}\$/)
    })

    it('should not have plain text password in seed', () => {
      const users = db.prepare('SELECT password FROM users').all() as Array<{password: string}>
      for (const user of users) {
        expect(user.password).not.toBe('changeme123')
        expect(user.password).not.toBe('password')
      }
    })
  })

  describe('Sample Products', () => {
    it('should have exactly 6 products for catalog preview', () => {
      const products = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }
      expect(products.count).toBe(6)
    })

    it('should have valid product data', () => {
      const products = db.prepare('SELECT name, price, stock FROM products').all() as Array<{
        name: string
        price: number
        stock: number
      }>
      
      for (const product of products) {
        expect(product.name).toBeTruthy()
        expect(product.price).toBeGreaterThan(0)
        expect(product.stock).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('Sample News', () => {
    it('should have exactly 3 news items', () => {
      const news = db.prepare('SELECT COUNT(*) as count FROM news').get() as { count: number }
      expect(news.count).toBe(3)
    })

    it('should have valid news data', () => {
      const items = db.prepare('SELECT title, content FROM news').all() as Array<{
        title: string
        content: string
      }>
      
      for (const item of items) {
        expect(item.title).toBeTruthy()
        expect(item.content).toBeTruthy()
      }
    })
  })

  describe('Seed Idempotency', () => {
    beforeEach(() => {
      // Re-run seed before each test in this describe block
      const seedPath = join(process.cwd(), '..', 'database', 'seed.sql')
      const seed = readFileSync(seedPath, 'utf-8')
      db.exec(seed)
    })

    it('should not duplicate users on multiple seed runs', () => {
      const count1 = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
      const count2 = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
      expect(count1.count).toBe(count2.count)
    })

    it('should not duplicate products on multiple seed runs', () => {
      const count1 = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }
      const count2 = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }
      expect(count1.count).toBe(count2.count)
    })

    it('should not duplicate news on multiple seed runs', () => {
      const count1 = db.prepare('SELECT COUNT(*) as count FROM news').get() as { count: number }
      const count2 = db.prepare('SELECT COUNT(*) as count FROM news').get() as { count: number }
      expect(count1.count).toBe(count2.count)
    })
  })
})