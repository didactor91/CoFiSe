import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
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
export const migrations: Migration[] = [
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
  },
  {
    version: 2,
    name: 'product_options_cart_anti_fraud',
    up: `
      -- Product Options (single selector per product: SIZE or COLOR)
      CREATE TABLE IF NOT EXISTS product_options (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER REFERENCES products(id),
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('SIZE', 'COLOR')),
          required INTEGER DEFAULT 0,
          position INTEGER DEFAULT 0
      );

      -- Option Values with stock (NULL = infinite)
      CREATE TABLE IF NOT EXISTS option_values (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          option_id INTEGER REFERENCES product_options(id),
          value TEXT NOT NULL,
          stock INTEGER,
          position INTEGER DEFAULT 0
      );

      -- Carts (session-based, anonymous)
      CREATE TABLE IF NOT EXISTS carts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT UNIQUE NOT NULL,
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'submitted', 'expired')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME
      );

      -- Cart Items
      CREATE TABLE IF NOT EXISTS cart_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cart_id INTEGER REFERENCES carts(id),
          product_id INTEGER REFERENCES products(id),
          option_value_id INTEGER REFERENCES option_values(id),
          quantity INTEGER DEFAULT 1,
          UNIQUE(cart_id, product_id, option_value_id)
      );

      -- Verification Codes (4-digit codes for anti-fraud)
      CREATE TABLE IF NOT EXISTS verification_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reservation_id INTEGER REFERENCES reservations(id),
          code TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          used INTEGER DEFAULT 0,
          attempts INTEGER DEFAULT 0
      );

      -- Reservation Items (replaces single product_id reservation)
      CREATE TABLE IF NOT EXISTS reservation_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reservation_id INTEGER REFERENCES reservations(id),
          product_id INTEGER REFERENCES products(id),
          option_value_id INTEGER REFERENCES option_values(id),
          quantity INTEGER NOT NULL,
          unit_price REAL NOT NULL
      );

      -- Add new columns to reservations (SQLite limitation: must recreate table to change CHECK)
      CREATE TABLE IF NOT EXISTS reservations_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER REFERENCES products(id),
          quantity INTEGER NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          notes TEXT,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'pending_unverified', 'confirmed', 'cancelled', 'completed')),
          cart_id INTEGER,
          verified_at DATETIME,
          ip_address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO reservations_new SELECT id, product_id, quantity, name, email, phone, notes, status, NULL, NULL, NULL, created_at, updated_at FROM reservations;
      DROP TABLE reservations;
      ALTER TABLE reservations_new RENAME TO reservations;

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_product_options_product ON product_options(product_id);
      CREATE INDEX IF NOT EXISTS idx_option_values_option ON option_values(option_id);
      CREATE INDEX IF NOT EXISTS idx_carts_session ON carts(session_id);
      CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
      CREATE INDEX IF NOT EXISTS idx_verification_codes_reservation ON verification_codes(reservation_id);
      CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation ON reservation_items(reservation_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_ip_created ON reservations(ip_address, created_at);
    `,
    down: `
      -- Drop new tables
      DROP TABLE IF EXISTS product_options;
      DROP TABLE IF EXISTS option_values;
      DROP TABLE IF EXISTS carts;
      DROP TABLE IF EXISTS cart_items;
      DROP TABLE IF EXISTS verification_codes;
      DROP TABLE IF EXISTS reservation_items;

      -- Restore original reservations table (SQLite limitation: must recreate)
      CREATE TABLE IF NOT EXISTS reservations_original (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER REFERENCES products(id),
          quantity INTEGER NOT NULL,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          notes TEXT,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO reservations_original SELECT id, product_id, quantity, name, email, phone, notes, status, created_at, updated_at FROM reservations;
      DROP TABLE reservations;
      ALTER TABLE reservations_original RENAME TO reservations;

      -- Drop indexes
      DROP INDEX IF EXISTS idx_product_options_product;
      DROP INDEX IF EXISTS idx_option_values_option;
      DROP INDEX IF EXISTS idx_carts_session;
      DROP INDEX IF EXISTS idx_cart_items_cart;
      DROP INDEX IF EXISTS idx_verification_codes_reservation;
      DROP INDEX IF EXISTS idx_reservation_items_reservation;
      DROP INDEX IF EXISTS idx_reservations_ip_created;
    `
  },
  {
    version: 3,
    name: 'news_publish_state',
    up: `
      CREATE TABLE IF NOT EXISTS news_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          image_url TEXT,
          is_published INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO news_new (id, title, content, image_url, created_at, updated_at)
      SELECT id, title, content, image_url, created_at, updated_at FROM news;
      DROP TABLE news;
      ALTER TABLE news_new RENAME TO news;
      CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at);
    `,
    down: `
      CREATE TABLE IF NOT EXISTS news_old (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          image_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO news_old (id, title, content, image_url, created_at, updated_at)
      SELECT id, title, content, image_url, created_at, updated_at FROM news;
      DROP TABLE news;
      ALTER TABLE news_old RENAME TO news;
    `
  },
  {
    version: 4,
    name: 'competition_system',
    up: `
      CREATE TABLE IF NOT EXISTS competitions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          match_type TEXT NOT NULL CHECK(match_type IN ('SINGLE_LEG', 'HOME_AND_AWAY')),
          status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'ACTIVE', 'COMPLETED')),
          participant_count INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS participants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          competition_id INTEGER REFERENCES competitions(id),
          alias TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS matches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          competition_id INTEGER REFERENCES competitions(id),
          round INTEGER NOT NULL,
          position INTEGER NOT NULL,
          participant1_id INTEGER REFERENCES participants(id),
          participant2_id INTEGER REFERENCES participants(id),
          home_score1 INTEGER,
          home_score2 INTEGER,
          away_score1 INTEGER,
          away_score2 INTEGER,
          winner_id INTEGER REFERENCES participants(id),
          status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COMPLETED')),
          is_bye INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_participants_competition ON participants(competition_id);
      CREATE INDEX IF NOT EXISTS idx_matches_competition ON matches(competition_id);
      CREATE INDEX IF NOT EXISTS idx_matches_round_position ON matches(competition_id, round, position);
      CREATE INDEX IF NOT EXISTS idx_matches_winner ON matches(winner_id);
    `,
    down: `
      DROP TABLE IF EXISTS matches;
      DROP TABLE IF EXISTS participants;
      DROP TABLE IF EXISTS competitions;
      DROP INDEX IF EXISTS idx_participants_competition;
      DROP INDEX IF EXISTS idx_matches_competition;
      DROP INDEX IF EXISTS idx_matches_round_position;
      DROP INDEX IF EXISTS idx_matches_winner;
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
   * Apply a specific migration (sync version for module initialization)
   */
  upSync(version: number): void {
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
   * Migrate to latest version (sync version for module initialization)
   */
  migrateToLatestSync(): void {
    const currentVersion = this.getCurrentVersion()
    const latestVersion = Math.max(...migrations.map(m => m.version))
    
    if (currentVersion >= latestVersion) {
      console.log(`Already at latest version (${currentVersion})`)
      return
    }

    console.log(`Migrating from version ${currentVersion} to ${latestVersion}`)
    
    for (let v = currentVersion + 1; v <= latestVersion; v++) {
      this.upSync(v)
    }
    
    console.log('Migration complete')
  }

  /**
   * Reset database (drop all tables and re-run schema)
   */
  async reset(): Promise<void> {
    console.log('Resetting database...')
    
    const transaction = this.db.transaction(() => {
      // Drop all tables (order matters for FK constraints)
      this.db.exec(`
        DROP TABLE IF EXISTS matches;
        DROP TABLE IF EXISTS participants;
        DROP TABLE IF EXISTS competitions;
        DROP TABLE IF EXISTS reservation_items;
        DROP TABLE IF EXISTS verification_codes;
        DROP TABLE IF EXISTS cart_items;
        DROP TABLE IF EXISTS carts;
        DROP TABLE IF EXISTS option_values;
        DROP TABLE IF EXISTS product_options;
        DROP TABLE IF EXISTS events;
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
