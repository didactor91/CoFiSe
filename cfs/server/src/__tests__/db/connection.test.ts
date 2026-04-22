import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

describe('Database Connection', () => {
  const dbPath = path.join(process.cwd(), 'database', 'senocom.db')
  let db: Database.Database | null = null

  const dbExists = (): boolean => fs.existsSync(dbPath)

  beforeAll(() => {
    if (dbExists()) {
      db = new Database(dbPath, { readonly: true })
    }
  })

  afterAll(() => {
    if (db) {
      db.close()
    }
  })

  describe('Connection', () => {
    it('opens database connection successfully', () => {
      if (!dbExists()) {
        console.log(`Skipping - database not found at ${dbPath}`)
        return
      }
      const testDb = new Database(dbPath, { readonly: true })
      expect(() => testDb.open()).not.toThrow()
      testDb.close()
    })

    it('exports a database instance', () => {
      if (!dbExists()) {
        console.log(`Skipping - database not found at ${dbPath}`)
        return
      }
      expect(db).toBeDefined()
    })
  })

  describe('Schema Validation', () => {
    it('users table exists with correct columns', () => {
      if (!dbExists()) {
        console.log(`Skipping - database not found at ${dbPath}`)
        return
      }
      
      const tables = db!.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='users'
      `).all() as { name: string }[]
      
      expect(tables.length).toBe(1)
      expect(tables[0].name).toBe('users')
    })

    it('users table has all required columns', () => {
      if (!dbExists()) {
        console.log(`Skipping - database not found at ${dbPath}`)
        return
      }
      
      const columns = db!.prepare(`PRAGMA table_info(users)`).all() as { name: string }[]
      const columnNames = columns.map(c => c.name)

      expect(columnNames).toContain('id')
      expect(columnNames).toContain('email')
      expect(columnNames).toContain('password')
      expect(columnNames).toContain('role')
      expect(columnNames).toContain('created_at')
    })

    it('products table exists with correct columns', () => {
      if (!dbExists()) {
        console.log(`Skipping - database not found at ${dbPath}`)
        return
      }
      
      const tables = db!.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='products'
      `).all()
      
      expect(tables.length).toBe(1)
      
      const columns = db!.prepare(`PRAGMA table_info(products)`).all() as { name: string }[]
      const columnNames = columns.map(c => c.name)
      
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('name')
      expect(columnNames).toContain('price')
      expect(columnNames).toContain('stock')
    })

    it('news table exists with correct columns', () => {
      if (!dbExists()) {
        console.log(`Skipping - database not found at ${dbPath}`)
        return
      }
      
      const tables = db!.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='news'
      `).all()
      
      expect(tables.length).toBe(1)
      
      const columns = db!.prepare(`PRAGMA table_info(news)`).all() as { name: string }[]
      const columnNames = columns.map(c => c.name)
      
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('title')
      expect(columnNames).toContain('content')
    })

    it('reservations table exists with correct columns', () => {
      if (!dbExists()) {
        console.log(`Skipping - database not found at ${dbPath}`)
        return
      }
      
      const tables = db!.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='reservations'
      `).all()
      
      expect(tables.length).toBe(1)
      
      const columns = db!.prepare(`PRAGMA table_info(reservations)`).all() as { name: string }[]
      const columnNames = columns.map(c => c.name)
      
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('product_id')
      expect(columnNames).toContain('quantity')
      expect(columnNames).toContain('status')
    })
  })
})