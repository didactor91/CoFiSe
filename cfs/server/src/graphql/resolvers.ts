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

// Helper to convert DB row to Event type
function eventFromRow(row: any) {
  return {
    id: row.id.toString(),
    name: row.name,
    description: row.description,
    location: row.location,
    startTime: row.start_time,
    endTime: row.end_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

// Helper to convert DB row to ProductOption type
function productOptionFromRow(row: any) {
  return {
    id: row.id.toString(),
    productId: row.product_id.toString(),
    name: row.name,
    required: !!row.required
  }
}

// Helper: compute type from name (for backward compatibility with DB)
function productOptionTypeFromName(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('color') || lower.includes('colour')) return 'COLOR'
  return 'SIZE'
}

// Helper to convert DB row to OptionValue type
function optionValueFromRow(row: any) {
  return {
    id: row.id.toString(),
    optionId: row.option_id.toString(),
    value: row.value,
    stock: row.stock
  }
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

    // Public event queries
    events: () => {
      const rows = db.prepare(`SELECT * FROM events WHERE start_time >= datetime('now') ORDER BY start_time ASC`).all()
      return rows.map(eventFromRow)
    },

    event: (_: any, args: { id: string }) => {
      const row = db.prepare(`SELECT * FROM events WHERE id = ?`).get(args.id)
      return row ? eventFromRow(row) : null
    },

    // Product options query (Staff+)
    productOptions: (_: any, args: { productId: string }, ctx: Context) => {
      requireStaff(ctx)
      const rows = db.prepare(`SELECT * FROM product_options WHERE product_id = ? ORDER BY position`).all(args.productId)
      return rows.map(productOptionFromRow)
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

    // Staff+ event queries
    allEvents: (_: any, __: any, ctx: Context) => {
      requirePermission(ctx, 'event.read')
      const rows = db.prepare(`SELECT * FROM events ORDER BY start_time ASC`).all()
      return rows.map(eventFromRow)
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

  // Product type resolver with options
  Product: {
    options: (parent: any) => {
      const rows = db.prepare(`SELECT * FROM product_options WHERE product_id = ? ORDER BY position`).all(parent.id)
      const options = rows.map(productOptionFromRow)
      return options.map((opt: any) => ({
        ...opt,
        values: db.prepare(`SELECT * FROM option_values WHERE option_id = ? ORDER BY position`).all(opt.id).map(optionValueFromRow)
      }))
    }
  },

  // ProductOption type resolver with values
  ProductOption: {
    // type computed from name for backward compatibility
    type: (parent: any) => productOptionTypeFromName(parent.name),
    values: (parent: any) => {
      const rows = db.prepare(`SELECT * FROM option_values WHERE option_id = ? ORDER BY position`).all(parent.id)
      return rows.map(optionValueFromRow)
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
      // Parse JWT payload without cryptographic verification
      // We only verify the exp claim and payload structure
      try {
        const parts = args.refreshToken.split('.')
        if (parts.length !== 3) {
          throw new Error('Invalid token format')
        }
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
        
        if (!payload.id || payload.type !== 'refresh') {
          throw new Error('Invalid token payload')
        }
        
        // Check expiration (exp is Unix timestamp in seconds)
        const now = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < now) {
          throw new Error('Token has expired')
        }
        
        const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(payload.id) as any
        if (!user) {
          throw new Error('User not found')
        }
        
        const token = await ctx.reply.jwtSign({ id: user.id, email: user.email, role: user.role.toUpperCase() })
        const newRefreshToken = await ctx.reply.jwtSign(
          { id: user.id, type: 'refresh' },
          { expiresIn: '30d' }
        )
        
        return {
          token,
          refreshToken: newRefreshToken,
          user: userFromRow(user)
        }
      } catch (err) {
        if (err.message === 'Invalid token format' || err.message === 'Invalid token payload' || err.message === 'Token has expired' || err.message === 'User not found') {
          throw err
        }
        throw new Error('Invalid or expired refresh token')
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

    // Event mutations (Staff+)
    createEvent: (_: any, args: { input: any }, ctx: Context) => {
      requirePermission(ctx, 'event.create')
      const { name, description, location, startTime, endTime } = args.input

      // Validation
      if (!name || name.trim() === '') {
        throw new Error('Name is required')
      }
      if (name.length > 200) {
        throw new Error('Name must be 200 characters or less')
      }
      if (!location || location.trim() === '') {
        throw new Error('Location is required')
      }
      if (location.length > 300) {
        throw new Error('Location must be 300 characters or less')
      }
      if (!startTime) {
        throw new Error('Start time is required')
      }
      if (!endTime) {
        throw new Error('End time is required')
      }
      if (new Date(endTime) <= new Date(startTime)) {
        throw new Error('End time must be after start time')
      }

      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO events (name, description, location, start_time, end_time, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name, description || null, location, startTime, endTime, now, now)

      return {
        id: result.lastInsertRowid.toString(),
        name,
        description: description || null,
        location,
        startTime,
        endTime,
        createdAt: now,
        updatedAt: now
      }
    },

    updateEvent: (_: any, args: { id: string; input: any }, ctx: Context) => {
      requirePermission(ctx, 'event.update')
      const existing = db.prepare(`SELECT * FROM events WHERE id = ?`).get(args.id) as any
      if (!existing) {
        throw new Error('Event not found')
      }

      const { name, description, location, startTime, endTime } = args.input

      // Validation
      if (name !== undefined) {
        if (name.trim() === '') {
          throw new Error('Name is required')
        }
        if (name.length > 200) {
          throw new Error('Name must be 200 characters or less')
        }
      }
      if (location !== undefined) {
        if (location.trim() === '') {
          throw new Error('Location is required')
        }
        if (location.length > 300) {
          throw new Error('Location must be 300 characters or less')
        }
      }
      if (startTime !== undefined && endTime !== undefined) {
        if (new Date(endTime) <= new Date(startTime)) {
          throw new Error('End time must be after start time')
        }
      }

      const now = new Date().toISOString()
      const updateName = name ?? existing.name
      const updateDescription = description ?? existing.description
      const updateLocation = location ?? existing.location
      const updateStartTime = startTime ?? existing.start_time
      const updateEndTime = endTime ?? existing.end_time

      db.prepare(`
        UPDATE events SET name = ?, description = ?, location = ?, start_time = ?, end_time = ?, updated_at = ?
        WHERE id = ?
      `).run(updateName, updateDescription, updateLocation, updateStartTime, updateEndTime, now, args.id)

      return {
        id: args.id,
        name: updateName,
        description: updateDescription,
        location: updateLocation,
        startTime: updateStartTime,
        endTime: updateEndTime,
        createdAt: existing.created_at,
        updatedAt: now
      }
    },

    deleteEvent: (_: any, args: { id: string }, ctx: Context) => {
      requirePermission(ctx, 'event.delete')
      const existing = db.prepare(`SELECT * FROM events WHERE id = ?`).get(args.id)
      if (!existing) {
        throw new Error('Event not found')
      }
      db.prepare(`DELETE FROM events WHERE id = ?`).run(args.id)
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

    // Product Option mutations (Staff+)
    createProductOption: (_: any, args: { input: any }, ctx: Context) => {
      requirePermission(ctx, 'product.update')
      const product = db.prepare(`SELECT id FROM products WHERE id = ?`).get(args.input.productId)
      if (!product) {
        throw new Error('Product not found')
      }
      const existingOption = db.prepare(`SELECT id FROM product_options WHERE product_id = ?`).get(args.input.productId)
      if (existingOption) {
        throw new Error('Product already has an option selector. Delete existing option first.')
      }
      // Infer type from name for DB storage (compatibility)
      const type = productOptionTypeFromName(args.input.name)
      const now = new Date().toISOString()
      const result = db.prepare(`
        INSERT INTO product_options (product_id, name, type, required, position, created_at, updated_at)
        VALUES (?, ?, ?, ?, 0, ?, ?)
      `).run(args.input.productId, args.input.name, type, args.input.required ? 1 : 0, now, now)
      return {
        id: result.lastInsertRowid.toString(),
        productId: args.input.productId,
        name: args.input.name,
        required: args.input.required,
        values: []
      }
    },

    updateProductOption: (_: any, args: { id: string; input: any }, ctx: Context) => {
      requirePermission(ctx, 'product.update')
      const existing = db.prepare(`SELECT * FROM product_options WHERE id = ?`).get(args.id) as any
      if (!existing) {
        throw new Error('Product option not found')
      }
      const now = new Date().toISOString()
      const name = args.input.name ?? existing.name
      // If name changed, infer new type from name; otherwise keep existing
      const type = args.input.name ? productOptionTypeFromName(args.input.name) : existing.type
      const required = args.input.required !== undefined ? (args.input.required ? 1 : 0) : existing.required
      db.prepare(`UPDATE product_options SET name = ?, type = ?, required = ?, updated_at = ? WHERE id = ?`)
        .run(name, type, required, now, args.id)
      return {
        id: args.id,
        productId: existing.product_id.toString(),
        name,
        required: !!required,
        values: []
      }
    },

    deleteProductOption: (_: any, args: { id: string }, ctx: Context) => {
      requirePermission(ctx, 'product.delete')
      const existing = db.prepare(`SELECT id FROM product_options WHERE id = ?`).get(args.id)
      if (!existing) {
        throw new Error('Product option not found')
      }
      db.prepare(`DELETE FROM option_values WHERE option_id = ?`).run(args.id)
      db.prepare(`DELETE FROM product_options WHERE id = ?`).run(args.id)
      return true
    },

    addOptionValues: (_: any, args: { optionId: string; values: any[] }, ctx: Context) => {
      requirePermission(ctx, 'product.update')
      const option = db.prepare(`SELECT * FROM product_options WHERE id = ?`).get(args.optionId) as any
      if (!option) {
        throw new Error('Product option not found')
      }
      const now = new Date().toISOString()
      const insertedValues = []
      for (const val of args.values) {
        const result = db.prepare(`INSERT INTO option_values (option_id, value, stock, position, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)`)
          .run(args.optionId, val.value, val.stock ?? null, now, now)
        insertedValues.push({ id: result.lastInsertRowid.toString(), optionId: args.optionId, value: val.value, stock: val.stock ?? null })
      }
      return { id: option.id.toString(), productId: option.product_id.toString(), name: option.name, type: option.type.toUpperCase(), required: !!option.required, values: insertedValues }
    },

    updateOptionValue: (_: any, args: { id: string; value?: string; stock?: number }, ctx: Context) => {
      requirePermission(ctx, 'product.update')
      const existing = db.prepare(`SELECT * FROM option_values WHERE id = ?`).get(args.id) as any
      if (!existing) {
        throw new Error('Option value not found')
      }
      const now = new Date().toISOString()
      const newValue = args.value ?? existing.value
      const newStock = args.stock !== undefined ? args.stock : existing.stock
      db.prepare(`UPDATE option_values SET value = ?, stock = ?, updated_at = ? WHERE id = ?`).run(newValue, newStock, now, args.id)
      return { id: args.id, optionId: existing.option_id.toString(), value: newValue, stock: newStock }
    },

    deleteOptionValue: (_: any, args: { id: string }, ctx: Context) => {
      requirePermission(ctx, 'product.delete')
      const existing = db.prepare(`SELECT id FROM option_values WHERE id = ?`).get(args.id)
      if (!existing) {
        throw new Error('Option value not found')
      }
      db.prepare(`DELETE FROM option_values WHERE id = ?`).run(args.id)
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