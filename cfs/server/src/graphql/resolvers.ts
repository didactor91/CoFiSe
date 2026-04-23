import { GraphQLScalarType, Kind } from 'graphql'
import bcrypt from 'bcrypt'
import { db } from '../db/index.js'
import type { AuthUser } from '../auth/middleware.js'
import { hasPermission, hasAnyPermission, type Permission } from '../auth/permissions.js'

// Refresh token payload interface
interface RefreshTokenPayload {
  id: number
  type: 'refresh'
}

// DateTime scalar implementation
const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO-8601 DateTime scalar',
  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString()
    }
    if (typeof value === 'string') {
      return value
    }
    throw new Error('DateTime must be a Date or ISO string')
  },
  parseValue(value: unknown): string {
    if (typeof value === 'string') {
      return value
    }
    throw new Error('DateTime must be an ISO string')
  },
  parseLiteral(ast): string | null {
    if (ast.kind === Kind.STRING) {
      return ast.value
    }
    return null
  }
})

interface Context {
  user?: AuthUser
  reply: any
}

function requireAuth(ctx: Context): AuthUser {
  if (!ctx.user) {
    throw new Error('Unauthorized')
  }
  return ctx.user
}

/**
 * Generic permission check function
 */
function requirePermission(ctx: Context, permission: Permission): AuthUser {
  const user = requireAuth(ctx)
  if (!hasPermission(user.role, permission)) {
    throw new Error('Insufficient permissions')
  }
  return user
}

/**
 * Check if user has ANY of the given permissions
 */
function requireAnyPermission(ctx: Context, permissions: Permission[]): AuthUser {
  const user = requireAuth(ctx)
  if (!hasAnyPermission(user.role, permissions)) {
    throw new Error('Insufficient permissions')
  }
  return user
}

/**
 * Staff role check (ADMIN or STAFF)
 */
function requireStaff(ctx: Context): AuthUser {
  const user = requireAuth(ctx)
  if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
    throw new Error('Insufficient permissions')
  }
  return user
}

/**
 * Admin role check (ADMIN only)
 */
function requireAdmin(ctx: Context): AuthUser {
  const user = requireAuth(ctx)
  if (user.role !== 'ADMIN') {
    throw new Error('Insufficient permissions')
  }
  return user
}

// Helper to convert DB row to News type
function newsFromRow(row: any) {
  return {
    id: row.id.toString(),
    title: row.title,
    content: row.content,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

// Helper to convert DB row to Product type
function productFromRow(row: any) {
  return {
    id: row.id.toString(),
    name: row.name,
    description: row.description,
    price: row.price,
    stock: row.stock,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

// Helper to convert DB row to User type (without password)
function userFromRow(row: any) {
  return {
    id: row.id.toString(),
    email: row.email,
    role: row.role.toUpperCase(),
    createdAt: row.created_at
  }
}

// Helper to convert DB row to Reservation type
function reservationFromRow(row: any, includeProduct = true) {
  const reservation: any = {
    id: row.id.toString(),
    productId: row.product_id.toString(),
    quantity: row.quantity,
    name: row.name,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    status: row.status.toUpperCase(),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    product: undefined
  }
  
  if (includeProduct && row.product_name) {
    reservation.product = {
      id: row.product_id.toString(),
      name: row.product_name,
      description: row.product_description,
      price: row.product_price,
      stock: row.product_stock,
      imageUrl: row.product_image_url,
      createdAt: row.product_created_at,
      updatedAt: row.product_updated_at
    }
  }
  
  return reservation
}

export const resolvers = {
  DateTime: dateTimeScalar,

  Query: {
    // Public queries
    news: () => {
      const rows = db.prepare(`SELECT * FROM news ORDER BY created_at DESC`).all()
      return rows.map(newsFromRow)
    },

    newsItem: (_: any, args: { id: string }) => {
      const row = db.prepare(`SELECT * FROM news WHERE id = ?`).get(args.id)
      return row ? newsFromRow(row) : null
    },

    products: () => {
      const rows = db.prepare(`SELECT * FROM products`).all()
      return rows.map(productFromRow)
    },

    product: (_: any, args: { id: string }) => {
      const row = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.id)
      return row ? productFromRow(row) : null
    },

    // Authenticated queries
    me: (_: any, __: any, ctx: Context) => {
      const user = requireAuth(ctx)
      const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(user.id)
      return row ? userFromRow(row) : null
    },

    // Staff+ queries
    allNews: (_: any, __: any, ctx: Context) => {
      requirePermission(ctx, 'news.read')
      const rows = db.prepare(`SELECT * FROM news ORDER BY created_at DESC`).all()
      return rows.map(newsFromRow)
    },

    reservations: (_: any, args: { status?: string }, ctx: Context) => {
      requirePermission(ctx, 'reservation.read')
      let query = `
        SELECT r.*, p.name as product_name, p.description as product_description, 
               p.price as product_price, p.stock as product_stock, p.image_url as product_image_url,
               p.created_at as product_created_at, p.updated_at as product_updated_at
        FROM reservations r
        LEFT JOIN products p ON r.product_id = p.id
      `
      const params: any[] = []
      if (args.status) {
        query += ` WHERE r.status = ?`
        params.push(args.status.toLowerCase())
      }
      query += ` ORDER BY r.created_at DESC`
      const rows = db.prepare(query).all(...params)
      return rows.map((row: any) => reservationFromRow(row, true))
    },

    reservation: (_: any, args: { id: string }, ctx: Context) => {
      requirePermission(ctx, 'reservation.read')
      const row = db.prepare(`
        SELECT r.*, p.name as product_name, p.description as product_description, 
               p.price as product_price, p.stock as product_stock, p.image_url as product_image_url,
               p.created_at as product_created_at, p.updated_at as product_updated_at
        FROM reservations r
        LEFT JOIN products p ON r.product_id = p.id
        WHERE r.id = ?
      `).get(args.id) as any
      return row ? reservationFromRow(row, true) : null
    },

    // Admin only
    users: (_: any, __: any, ctx: Context) => {
      requirePermission(ctx, 'user.read')
      const rows = db.prepare(`SELECT * FROM users ORDER BY created_at DESC`).all()
      return rows.map(userFromRow)
    }
  },

  Mutation: {
    // Public mutations
    login: async (_: any, args: { email: string; password: string }, ctx: Context) => {
      const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(args.email) as any
      if (!user) {
        throw new Error('Credenciales inválidas')
      }
      const isValid = await bcrypt.compare(args.password, user.password)
      if (!isValid) {
        throw new Error('Credenciales inválidas')
      }
      
      const token = await ctx.reply.jwtSign({ id: user.id, email: user.email, role: user.role.toUpperCase() })
      
      // Generate refresh token (30 day expiry embedded in JWT)
      const refreshToken = await ctx.reply.jwtSign(
        { id: user.id, type: 'refresh' },
        { expiresIn: '30d' }
      )
      
      return {
        token,
        refreshToken,
        user: userFromRow(user)
      }
    },

    refreshToken: async (_: any, args: { refreshToken: string }, ctx: Context) => {
      // Verify refresh token JWT (contains expiry in payload)
      let payload: RefreshTokenPayload
      try {
        payload = await ctx.reply.jwtVerify(args.refreshToken) as RefreshTokenPayload
      } catch (err) {
        throw new Error('Invalid or expired refresh token')
      }
      
      // Ensure this is a refresh token
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type')
      }
      
      // Note: We don't check any in-memory store because:
      // 1. The JWT already contains expiry (30d from issue time)
      // 2. On server restart, in-memory store is cleared but tokens remain valid
      // 3. This allows session persistence across server restarts
      
      // Get user from database
      const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(payload.id) as any
      if (!user) {
        throw new Error('User not found')
      }
      
      // Generate new access token
      const token = await ctx.reply.jwtSign({ id: user.id, email: user.email, role: user.role.toUpperCase() })
      
      // Generate new refresh token (rotation)
      const newRefreshToken = await ctx.reply.jwtSign(
        { id: user.id, type: 'refresh' },
        { expiresIn: '30d' }
      )
      
      return {
        token,
        refreshToken: newRefreshToken,
        user: userFromRow(user)
      }
    },

    createReservation: (_: any, args: { input: any }, ctx: Context) => {
      const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.input.productId) as any
      if (!product) {
        throw new Error('Product not found')
      }
      if (product.stock === 0) {
        throw new Error('Product is out of stock')
      }
      if (args.input.quantity > product.stock) {
        throw new Error('Requested quantity exceeds available stock')
      }
      
      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO reservations (product_id, quantity, name, email, phone, notes, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `).run(args.input.productId, args.input.quantity, args.input.name, args.input.email, args.input.phone, args.input.notes || null, now, now)
      
      return {
        id: result.lastInsertRowid.toString(),
        productId: args.input.productId,
        quantity: args.input.quantity,
        name: args.input.name,
        email: args.input.email,
        phone: args.input.phone,
        notes: args.input.notes,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
        product: productFromRow(product)
      }
    },

    // News mutations (Staff+)
    createNews: (_: any, args: { input: any }, ctx: Context) => {
      requirePermission(ctx, 'news.create')
      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO news (title, content, image_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(args.input.title, args.input.content, args.input.imageUrl || null, now, now)
      
      return {
        id: result.lastInsertRowid.toString(),
        title: args.input.title,
        content: args.input.content,
        imageUrl: args.input.imageUrl || null,
        createdAt: now,
        updatedAt: now
      }
    },

    updateNews: (_: any, args: { id: string; input: any }, ctx: Context) => {
      requirePermission(ctx, 'news.update')
      const existing = db.prepare(`SELECT * FROM news WHERE id = ?`).get(args.id) as any
      if (!existing) {
        throw new Error('News not found')
      }
      const now = new Date().toISOString()
      const title = args.input.title ?? existing.title
      const content = args.input.content ?? existing.content
      const imageUrl = args.input.imageUrl ?? existing.image_url
      
      db.prepare(`UPDATE news SET title = ?, content = ?, image_url = ?, updated_at = ? WHERE id = ?`)
        .run(title, content, imageUrl, now, args.id)
      
      return {
        id: args.id,
        title,
        content,
        imageUrl,
        createdAt: existing.created_at,
        updatedAt: now
      }
    },

    deleteNews: (_: any, args: { id: string }, ctx: Context) => {
      requirePermission(ctx, 'news.delete')
      const existing = db.prepare(`SELECT * FROM news WHERE id = ?`).get(args.id)
      if (!existing) {
        throw new Error('News not found')
      }
      db.prepare(`DELETE FROM news WHERE id = ?`).run(args.id)
      return true
    },

    // Product mutations (Staff+)
    createProduct: (_: any, args: { input: any }, ctx: Context) => {
      requirePermission(ctx, 'product.create')
      const { name, description, price, stock, imageUrl } = args.input
      
      // Validation
      if (!name || name.trim() === '') {
        throw new Error('Name is required')
      }
      if (name.length > 500) {
        throw new Error('Name must be 500 characters or less')
      }
      if (price <= 0) {
        throw new Error('Price must be greater than 0')
      }
      if (stock < 0) {
        throw new Error('Stock must be 0 or greater')
      }
      
      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO products (name, description, price, stock, image_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name, description, price, stock, imageUrl || null, now, now)
      
      return {
        id: result.lastInsertRowid.toString(),
        name,
        description,
        price,
        stock,
        imageUrl: imageUrl || null,
        createdAt: now,
        updatedAt: now
      }
    },

    updateProduct: (_: any, args: { id: string; input: any }, ctx: Context) => {
      requirePermission(ctx, 'product.update')
      const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.id) as any
      if (!existing) {
        throw new Error('Product not found')
      }
      
      // Validation
      const { name, description, price, stock, imageUrl } = args.input
      if (name !== undefined && name.trim() === '') {
        throw new Error('Name is required')
      }
      if (name && name.length > 500) {
        throw new Error('Name must be 500 characters or less')
      }
      if (price !== undefined && price <= 0) {
        throw new Error('Price must be greater than 0')
      }
      if (stock !== undefined && stock < 0) {
        throw new Error('Stock must be 0 or greater')
      }
      
      const now = new Date().toISOString()
      const updateName = name ?? existing.name
      const updateDescription = description ?? existing.description
      const updatePrice = price ?? existing.price
      const updateStock = stock ?? existing.stock
      const updateImageUrl = imageUrl ?? existing.image_url
      
      db.prepare(`
        UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image_url = ?, updated_at = ?
        WHERE id = ?
      `).run(updateName, updateDescription, updatePrice, updateStock, updateImageUrl, now, args.id)
      
      return {
        id: args.id,
        name: updateName,
        description: updateDescription,
        price: updatePrice,
        stock: updateStock,
        imageUrl: updateImageUrl,
        createdAt: existing.created_at,
        updatedAt: now
      }
    },

    deleteProduct: (_: any, args: { id: string }, ctx: Context) => {
      requirePermission(ctx, 'product.delete')
      const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.id)
      if (!existing) {
        throw new Error('Product not found')
      }
      db.prepare(`DELETE FROM products WHERE id = ?`).run(args.id)
      return true
    },

    // Reservation mutations (Staff+)
    updateReservationStatus: (_: any, args: { id: string; status: string }, ctx: Context) => {
      requirePermission(ctx, 'reservation.update')
      const existing = db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(args.id) as any
      if (!existing) {
        throw new Error('Reservation not found')
      }
      
      const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
      if (!validStatuses.includes(args.status.toUpperCase())) {
        throw new Error('Invalid status')
      }
      
      const prevStatus = existing.status
      const newStatus = args.status.toLowerCase()
      const quantity = existing.quantity
      const productId = existing.product_id
      
      const now = new Date().toISOString()
      db.prepare(`UPDATE reservations SET status = ?, updated_at = ? WHERE id = ?`)
        .run(newStatus, now, args.id)
      
      // FR-032: Stock adjustment logic
      // When status changes to CONFIRMED: decrease product stock by reservation quantity
      if (newStatus === 'confirmed' && prevStatus !== 'confirmed') {
        db.prepare(`UPDATE products SET stock = stock - ? WHERE id = ?`)
          .run(quantity, productId)
      }
      
      // When status changes to CANCELLED (and was previously CONFIRMED): restore product stock
      if (newStatus === 'cancelled' && prevStatus === 'confirmed') {
        db.prepare(`UPDATE products SET stock = stock + ? WHERE id = ?`)
          .run(quantity, productId)
      }
      
      // Get updated reservation with product
      const row = db.prepare(`
        SELECT r.*, p.name as product_name, p.description as product_description, 
               p.price as product_price, p.stock as product_stock, p.image_url as product_image_url,
               p.created_at as product_created_at, p.updated_at as product_updated_at
        FROM reservations r
        LEFT JOIN products p ON r.product_id = p.id
        WHERE r.id = ?
      `).get(args.id) as any
      
      return reservationFromRow(row, true)
    },

    // User mutations (Admin only)
    createUser: async (_: any, args: { input: any }, ctx: Context) => {
      requirePermission(ctx, 'user.create')
      const existing = db.prepare(`SELECT * FROM users WHERE email = ?`).get(args.input.email)
      if (existing) {
        throw new Error('Email already in use')
      }
      
      const hashedPassword = await bcrypt.hash(args.input.password, 12)
      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO users (email, password, role, created_at)
        VALUES (?, ?, ?, ?)
      `).run(args.input.email, hashedPassword, args.input.role.toLowerCase(), now)
      
      return {
        id: result.lastInsertRowid.toString(),
        email: args.input.email,
        role: args.input.role.toUpperCase(),
        createdAt: now
      }
    },

    deleteUser: (_: any, args: { id: string }, ctx: Context) => {
      requirePermission(ctx, 'user.delete')
      const existing = db.prepare(`SELECT * FROM users WHERE id = ?`).get(args.id) as any
      if (!existing) {
        throw new Error('User not found')
      }
      // Prevent admin from deleting themselves (FR edge case)
      if (existing.id === ctx.user!.id) {
        throw new Error('No puedes eliminarte a ti mismo')
      }
      db.prepare(`DELETE FROM users WHERE id = ?`).run(args.id)
      return true
    }
  }
}

export default resolvers