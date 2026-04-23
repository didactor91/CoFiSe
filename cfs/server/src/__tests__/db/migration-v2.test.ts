import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Test configuration - use in-memory database for isolation
const TEST_DB_PATH = `:memory:`
const TEST_SESSION_ID = 'test-session-123'

// Compute absolute path to database folder
const __testDir = dirname(fileURLToPath(import.meta.url))
const DB_DIR = join(__testDir, '..', '..', '..', '..', 'database')
const SCHEMA_PATH = join(DB_DIR, 'schema.sql')
const MIGRATIONS_PATH = join(DB_DIR, 'migrations.ts')

describe('Migration v2', () => {
  let db: Database.Database

  beforeAll(() => {
    // Create in-memory database and apply base schema first
    db = new Database(TEST_DB_PATH)
    const schema = readFileSync(SCHEMA_PATH, 'utf-8')
    db.exec(schema)
  })

  afterAll(() => {
    db.close()
  })

  describe('UP migration (1.9 RED - applies cleanly on fresh DB)', () => {
    beforeEach(() => {
      // Reset database to fresh state before each test
      db.exec(`
        DROP TABLE IF EXISTS reservation_items;
        DROP TABLE IF EXISTS verification_codes;
        DROP TABLE IF EXISTS cart_items;
        DROP TABLE IF EXISTS carts;
        DROP TABLE IF EXISTS option_values;
        DROP TABLE IF EXISTS product_options;
        DROP TABLE IF EXISTS schema_migrations;
      `)
      // Re-initialize migrations table
      db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version INTEGER UNIQUE NOT NULL,
          name TEXT NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
    })

    async function getMigrationManager() {
      const mod = await import(MIGRATIONS_PATH)
      return new mod.MigrationManager(db)
    }

    it('should apply migration v2 and create all new tables', async () => {
      const MigrationManager = (await import(MIGRATIONS_PATH)).MigrationManager
      const migrationManager = new MigrationManager(db)

      // Run migration v2
      await migrationManager.up(2)

      // Verify product_options table exists with correct schema
      const productOptionsTable = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='product_options'"
      ).get()
      expect(productOptionsTable).toBeDefined()

      const productOptionsColumns = db.prepare("PRAGMA table_info(product_options)").all() as Array<{
        name: string
        type: string
        notnull: number
        pk: number
      }>
      const productOptionsColumnNames = productOptionsColumns.map(c => c.name)
      expect(productOptionsColumnNames).toContain('id')
      expect(productOptionsColumnNames).toContain('product_id')
      expect(productOptionsColumnNames).toContain('name')
      expect(productOptionsColumnNames).toContain('type')
      expect(productOptionsColumnNames).toContain('required')
      expect(productOptionsColumnNames).toContain('position')
    })

    it('should create option_values table with correct schema', async () => {
      const MigrationManager = (await import(MIGRATIONS_PATH)).MigrationManager
      const migrationManager = new MigrationManager(db)

      await migrationManager.up(2)

      const optionValuesTable = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='option_values'"
      ).get()
      expect(optionValuesTable).toBeDefined()

      const columns = db.prepare("PRAGMA table_info(option_values)").all() as Array<{name: string}>
      const columnNames = columns.map(c => c.name)
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('option_id')
      expect(columnNames).toContain('value')
      expect(columnNames).toContain('stock')
      expect(columnNames).toContain('position')
    })

    it('should create carts table with UNIQUE session_id', async () => {
      const MigrationManager = (await import(MIGRATIONS_PATH)).MigrationManager
      const migrationManager = new MigrationManager(db)

      await migrationManager.up(2)

      const cartsTable = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='carts'"
      ).get()
      expect(cartsTable).toBeDefined()

      // Verify UNIQUE constraint on session_id
      const cart1 = db.prepare('INSERT INTO carts (session_id) VALUES (?)').run(TEST_SESSION_ID)
      expect(cart1.changes).toBe(1)

      expect(() => {
        db.prepare('INSERT INTO carts (session_id) VALUES (?)').run(TEST_SESSION_ID)
      }).toThrow()
    })

    it('should create cart_items table with UNIQUE constraint', async () => {
      const MigrationManager = (await import(MIGRATIONS_PATH)).MigrationManager
      const migrationManager = new MigrationManager(db)

      await migrationManager.up(2)

      // First create a cart and product
      const cart = db.prepare('INSERT INTO carts (session_id) VALUES (?)').run('cart-session')
      const product = db.prepare('INSERT INTO products (name, price) VALUES (?, ?)').run('Test', 10)
      const option = db.prepare('INSERT INTO product_options (product_id, name, type) VALUES (?, ?, ?)').run(product.lastInsertRowid, 'Size', 'SIZE')
      const optionValue = db.prepare('INSERT INTO option_values (option_id, value) VALUES (?, ?)').run(option.lastInsertRowid, 'M')

      // Insert first cart item
      const item1 = db.prepare(
        'INSERT INTO cart_items (cart_id, product_id, option_value_id, quantity) VALUES (?, ?, ?, ?)'
      ).run(cart.lastInsertRowid, product.lastInsertRowid, optionValue.lastInsertRowid, 1)
      expect(item1.changes).toBe(1)

      // Second insert with same cart_id, product_id, option_value_id should fail
      expect(() => {
        db.prepare(
          'INSERT INTO cart_items (cart_id, product_id, option_value_id, quantity) VALUES (?, ?, ?, ?)'
        ).run(cart.lastInsertRowid, product.lastInsertRowid, optionValue.lastInsertRowid, 2)
      }).toThrow()
    })

    it('should create verification_codes table', async () => {
      const MigrationManager = (await import(MIGRATIONS_PATH)).MigrationManager
      const migrationManager = new MigrationManager(db)

      await migrationManager.up(2)

      const table = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='verification_codes'"
      ).get()
      expect(table).toBeDefined()

      const columns = db.prepare("PRAGMA table_info(verification_codes)").all() as Array<{name: string}>
      const columnNames = columns.map(c => c.name)
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('reservation_id')
      expect(columnNames).toContain('code')
      expect(columnNames).toContain('expires_at')
      expect(columnNames).toContain('used')
      expect(columnNames).toContain('attempts')
    })

    it('should create reservation_items table', async () => {
      const MigrationManager = (await import(MIGRATIONS_PATH)).MigrationManager
      const migrationManager = new MigrationManager(db)

      await migrationManager.up(2)

      const table = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='reservation_items'"
      ).get()
      expect(table).toBeDefined()

      const columns = db.prepare("PRAGMA table_info(reservation_items)").all() as Array<{name: string}>
      const columnNames = columns.map(c => c.name)
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('reservation_id')
      expect(columnNames).toContain('product_id')
      expect(columnNames).toContain('option_value_id')
      expect(columnNames).toContain('quantity')
      expect(columnNames).toContain('unit_price')
    })

    it('should add new columns to reservations table (cart_id, verified_at, ip_address)', async () => {
      const MigrationManager = (await import(MIGRATIONS_PATH)).MigrationManager
      const migrationManager = new MigrationManager(db)

      await migrationManager.up(2)

      const columns = db.prepare("PRAGMA table_info(reservations)").all() as Array<{name: string}>
      const columnNames = columns.map(c => c.name)
      expect(columnNames).toContain('cart_id')
      expect(columnNames).toContain('verified_at')
      expect(columnNames).toContain('ip_address')
    })

    it('should create all required indexes', async () => {
      const MigrationManager = (await import(MIGRATIONS_PATH)).MigrationManager
      const migrationManager = new MigrationManager(db)

      await migrationManager.up(2)

      const indexes = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'"
      ).all() as Array<{name: string}>

      const indexNames = indexes.map(i => i.name)
      expect(indexNames).toContain('idx_product_options_product')
      expect(indexNames).toContain('idx_option_values_option')
      expect(indexNames).toContain('idx_carts_session')
      expect(indexNames).toContain('idx_cart_items_cart')
      expect(indexNames).toContain('idx_verification_codes_reservation')
      expect(indexNames).toContain('idx_reservation_items_reservation')
      expect(indexNames).toContain('idx_reservations_ip_created')
    })

    it('should be idempotent - applying twice does not error', async () => {
      const MigrationManager = (await import(MIGRATIONS_PATH)).MigrationManager
      const migrationManager = new MigrationManager(db)

      await migrationManager.up(2)

      // Apply again - should not throw
      await migrationManager.up(2)

      // Verify all tables still exist
      const tables = ['product_options', 'option_values', 'carts', 'cart_items', 'verification_codes', 'reservation_items']
      for (const tableName of tables) {
        const table = db.prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`
        ).get()
        expect(table).toBeDefined()
      }
    })
  })

  describe('DOWN migration (1.11 REFACTOR - rollback)', () => {
    beforeEach(() => {
      db.exec(`
        DROP TABLE IF EXISTS reservation_items;
        DROP TABLE IF EXISTS verification_codes;
        DROP TABLE IF EXISTS cart_items;
        DROP TABLE IF EXISTS carts;
        DROP TABLE IF EXISTS option_values;
        DROP TABLE IF EXISTS product_options;
        DROP TABLE IF EXISTS schema_migrations;
      `)
      db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version INTEGER UNIQUE NOT NULL,
          name TEXT NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
    })

    it('should rollback migration v2 and drop all new tables', async () => {
      const MigrationManager = (await import(MIGRATIONS_PATH)).MigrationManager
      const migrationManager = new MigrationManager(db)

      // First apply
      await migrationManager.up(2)

      // Verify tables exist
      const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='product_options'").get()
      expect(table).toBeDefined()

      // Rollback
      await migrationManager.down(2)

      // Verify product_options table is dropped
      const droppedTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='product_options'").get()
      expect(droppedTable).toBeUndefined()

      // Verify all other new tables are dropped
      const otherTables = ['option_values', 'carts', 'cart_items', 'verification_codes', 'reservation_items']
      for (const t of otherTables) {
        const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${t}'`).get()
        expect(result).toBeUndefined()
      }
    })

    it('should remove new columns from reservations table on rollback', async () => {
      const MigrationManager = (await import(MIGRATIONS_PATH)).MigrationManager
      const migrationManager = new MigrationManager(db)

      await migrationManager.up(2)
      await migrationManager.down(2)

      const columns = db.prepare("PRAGMA table_info(reservations)").all() as Array<{name: string}>
      const columnNames = columns.map(c => c.name)
      expect(columnNames).not.toContain('cart_id')
      expect(columnNames).not.toContain('verified_at')
      expect(columnNames).not.toContain('ip_address')
    })

    it('should remove indexes on rollback', async () => {
      const MigrationManager = (await import(MIGRATIONS_PATH)).MigrationManager
      const migrationManager = new MigrationManager(db)

      await migrationManager.up(2)
      await migrationManager.down(2)

      const indexes = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'"
      ).all() as Array<{name: string}>

      const indexNames = indexes.map(i => i.name)
      expect(indexNames).not.toContain('idx_product_options_product')
      expect(indexNames).not.toContain('idx_option_values_option')
      expect(indexNames).not.toContain('idx_carts_session')
      expect(indexNames).not.toContain('idx_cart_items_cart')
      expect(indexNames).not.toContain('idx_verification_codes_reservation')
      expect(indexNames).not.toContain('idx_reservation_items_reservation')
      expect(indexNames).not.toContain('idx_reservations_ip_created')
    })
  })
})