import Database from 'better-sqlite3'

import { MigrationManager } from '../../../database/migrations.ts'
import { config } from '../config.js'

console.log('[CFS DB] Opening database at:', config.database.path)

// Create and export database instance
const db = new Database(config.database.path)

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL')

// Apply all pending migrations synchronously (blocks until complete)
const migrationManager = new MigrationManager(db)
migrationManager.migrateToLatestSync()
console.log('[CFS DB] Migrations complete')

// Backwards-compatible hot migration for existing DBs.
// Note: This is now redundant for fresh DBs (migration v3 handles is_published),
// but kept for any pre-v3 DBs that might have slipped through.
const newsColumns = db.prepare(`PRAGMA table_info(news)`).all() as Array<{ name: string }>
const hasPublishedColumn = newsColumns.some((column) => column.name === 'is_published')
if (!hasPublishedColumn) {
  db.exec(`ALTER TABLE news ADD COLUMN is_published INTEGER NOT NULL DEFAULT 0`)
}

export { db }
export default db