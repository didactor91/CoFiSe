-- CFS Landing Database Schema
-- SQLite database for Comisión de Fiestas de Seno

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Users table (admin and staff)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'staff')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- News table (announcements and updates)
CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products table (catalog items)
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    limited_stock INTEGER DEFAULT 1,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
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

-- Events table (community events)
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Product Options (single selector per product: SIZE or COLOR)
CREATE TABLE IF NOT EXISTS product_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('SIZE', 'COLOR')),
    required INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Option Values with stock (NULL = infinite)
CREATE TABLE IF NOT EXISTS option_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    option_id INTEGER REFERENCES product_options(id),
    value TEXT NOT NULL,
    stock INTEGER,
    position INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_product_id ON reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_product_options_product ON product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_option_values_option ON option_values(option_id);
CREATE INDEX IF NOT EXISTS idx_carts_session ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_reservation ON verification_codes(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation ON reservation_items(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservations_ip_created ON reservations(ip_address, created_at);