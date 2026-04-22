import Database from 'better-sqlite3'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface Migration {
  version: number
  name: string
  up: string
  down?: string
}

export interface MigrationRecord {
  id: INTEGER
  version: INTEGER
  name: TEXT
  applied_at: DATETIME
}

// In-memory migration registry (can be extended to store in DB)
const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: readFileSync(join(__dirname, 'schema.sql'), 'utf-8'),
    down: `
      DROP TABLE IF EXISTS reservations;
      DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS news;
      DROP TABLE IF EXISTS users;
    `
  }
]

export class MigrationManager {
  private db: Database.Database
  private tableName = 'schema_migrations'

  constructor(db: Database.Database) {
    this.db = db
    this.ensureMigrationsTable()
  }

  /**
   * Create migrations tracking table if not exists
   */
  private ensureMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  /**
   * Get current database version
   */
  getCurrentVersion(): number {
    const result = this.db.prepare(
      `SELECT MAX(version) as version FROM ${this.tableName}`
    ).get() as { version: number | null } | undefined
    
    return result?.version ?? 0
  }

  /**
   * Get all applied migrations
   */
  getAppliedMigrations(): MigrationRecord[] {
    return this.db.prepare(
      `SELECT * FROM ${this.tableName} ORDER BY version ASC`
    ).all() as MigrationRecord[]
  }

  /**
   * Check if migration is applied
   */
  isApplied(version: number): boolean {
    const result = this.db.prepare(
      `SELECT 1 FROM ${this.tableName} WHERE version = ?`
    ).get(version)
    return !!result
  }

  /**
   * Apply a specific migration
   */
  async up(version: number): Promise<void> {
    const migration = migrations.find(m => m.version === version)
    if (!migration) {
      throw new Error(`Migration version ${version} not found`)
    }

    if (this.isApplied(version)) {
      console.log(`Migration ${version} already applied`)
      return
    }

    console.log(`Applying migration ${version}: ${migration.name}`)
    
    // Execute migration in transaction
    const transaction = this.db.transaction(() => {
      this.db.exec(migration.up)
      this.db.prepare(
        `INSERT INTO ${this.tableName} (version, name) VALUES (?, ?)`
      ).run(version, migration.name)
    })
    
    transaction()
    console.log(`Migration ${version} applied successfully`)
  }

  /**
   * Rollback a specific migration
   */
  async down(version: number): Promise<void> {
    const migration = migrations.find(m => m.version === version)
    if (!migration || !migration.down) {
      throw new Error(`Migration ${version} has no down script`)
    }

    if (!this.isApplied(version)) {
      console.log(`Migration ${version} not applied`)
      return
    }

    console.log(`Rolling back migration ${version}: ${migration.name}`)
    
    const transaction = this.db.transaction(() => {
      this.db.exec(migration.down)
      this.db.prepare(`DELETE FROM ${this.tableName} WHERE version = ?`).run(version)
    })
    
    transaction()
    console.log(`Migration ${version} rolled back successfully`)
  }

  /**
   * Migrate to latest version
   */
  async migrateToLatest(): Promise<void> {
    const currentVersion = this.getCurrentVersion()
    const latestVersion = Math.max(...migrations.map(m => m.version))
    
    if (currentVersion >= latestVersion) {
      console.log(`Already at latest version (${currentVersion})`)
      return
    }

    console.log(`Migrating from version ${currentVersion} to ${latestVersion}`)
    
    for (let v = currentVersion + 1; v <= latestVersion; v++) {
      await this.up(v)
    }
    
    console.log('Migration complete')
  }

  /**
   * Reset database (drop all tables and re-run schema)
   */
  async reset(): Promise<void> {
    console.log('Resetting database...')
    
    const transaction = this.db.transaction(() => {
      // Drop all tables
      this.db.exec(`
        DROP TABLE IF EXISTS reservations;
        DROP TABLE IF EXISTS products;
        DROP TABLE IF EXISTS news;
        DROP TABLE IF EXISTS users;
        DROP TABLE IF EXISTS ${this.tableName};
      `)
      
      // Re-create migrations table
      this.ensureMigrationsTable()
      
      // Re-apply all migrations
      for (const migration of migrations) {
        this.db.exec(migration.up)
        this.db.prepare(
          `INSERT INTO ${this.tableName} (version, name) VALUES (?, ?)`
        ).run(migration.version, migration.name)
      }
    })
    
    transaction()
    console.log('Database reset complete')
  }
}

export default MigrationManager