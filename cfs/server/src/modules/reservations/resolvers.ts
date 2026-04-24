import { db } from '../../db/index.js'
import { productFromRow, reservationFromRow } from '../shared/mappers.js'
import { requirePermission, type Context } from '../shared/guards.js'

export const reservationsResolvers = {
    Query: {
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
    },

    Mutation: {
        createReservation: (_: any, args: { input: any }) => {
            const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.input.productId) as any
            if (!product) throw new Error('Product not found')
            if (product.stock === 0) throw new Error('Product is out of stock')
            if (args.input.quantity > product.stock) throw new Error('Requested quantity exceeds available stock')

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
                product: productFromRow(product),
            }
        },

        updateReservationStatus: (_: any, args: { id: string; status: string }, ctx: Context) => {
            requirePermission(ctx, 'reservation.update')
            const existing = db.prepare(`SELECT * FROM reservations WHERE id = ?`).get(args.id) as any
            if (!existing) throw new Error('Reservation not found')

            const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
            if (!validStatuses.includes(args.status.toUpperCase())) throw new Error('Invalid status')

            const prevStatus = existing.status
            const newStatus = args.status.toLowerCase()
            const quantity = existing.quantity
            const productId = existing.product_id

            const now = new Date().toISOString()
            db.prepare(`UPDATE reservations SET status = ?, updated_at = ? WHERE id = ?`).run(newStatus, now, args.id)

            if (newStatus === 'confirmed' && prevStatus !== 'confirmed') {
                db.prepare(`UPDATE products SET stock = stock - ? WHERE id = ?`).run(quantity, productId)
            }
            if (newStatus === 'cancelled' && prevStatus === 'confirmed') {
                db.prepare(`UPDATE products SET stock = stock + ? WHERE id = ?`).run(quantity, productId)
            }

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
    },
}
