import Database from 'better-sqlite3'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Default database path
const DEFAULT_DB_PATH = join(__dirname, '..', 'data', 'cfs.db')

export interface InitOptions {
  dbPath?: string
  schemaPath?: string
  seedPath?: string
  force?: boolean // Force re-initialize even if database exists
}

/**
 * Initialize the database with schema and seed data
 */
export async function initDatabase(options: InitOptions = {}): Promise<Database.Database> {
  const {
    dbPath = DEFAULT_DB_PATH,
    schemaPath = join(__dirname, 'schema.sql'),
    seedPath = join(__dirname, 'seed.sql'),
    force = false
  } = options

  // Ensure data directory exists
  const dataDir = join(dbPath, '..')
  const { mkdirSync } = await import('fs')
  mkdirSync(dataDir, { recursive: true })

  // Check if database already exists
  const dbExists = existsSync(dbPath)
  
  if (dbExists && !force) {
    console.log(`Database already exists at ${dbPath}. Use force=true to re-initialize.`)
  }

  // Open database connection
  const db = new Database(dbPath)
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Run schema
  if (existsSync(schemaPath)) {
    const schema = readFileSync(schemaPath, 'utf-8')
    db.exec(schema)
    console.log('Schema applied successfully')
  } else {
    console.warn(`Schema file not found at ${schemaPath}`)
  }

  // Run seed
  if (existsSync(seedPath)) {
    const seed = readFileSync(seedPath, 'utf-8')
    db.exec(seed)
    console.log('Seed data applied successfully')
  } else {
    console.warn(`Seed file not found at ${seedPath}`)
  }

  return db
}

/**
 * Close database connection safely
 */
export function closeDatabase(db: Database.Database): void {
  if (db) {
    db.close()
  }
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('init.ts')) {
  const dbPath = process.env.DATABASE_PATH || DEFAULT_DB_PATH
  console.log(`Initializing database at ${dbPath}...`)
  
  initDatabase({ dbPath, force: true })
    .then((db) => {
      console.log('Database initialized successfully')
      closeDatabase(db)
      process.exit(0)
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err)
      process.exit(1)
    })
}

export default initDatabase