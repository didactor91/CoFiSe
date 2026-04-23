import Database from 'better-sqlite3'
import { config } from '../config.js'

console.log('[CFS DB] Opening database at:', config.database.path)

// Create and export database instance
const db = new Database(config.database.path)

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL')

export { db }
export default db