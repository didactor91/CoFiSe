import Database from 'better-sqlite3'
import path from 'path'

// Database path from environment or default
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'database', 'senocom.db')

// Create and export database instance
const db = new Database(DB_PATH)

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL')

export { db }
export default db