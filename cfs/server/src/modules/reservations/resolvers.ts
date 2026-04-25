import { db } from '../../db/index.js'
import { requirePermission, type Context } from '../shared/guards.js'
import { productFromRow, reservationFromRow } from '../shared/mappers.js'

type ReservationItemRow = {
    id: number
    reservation_id: number
    product_id: number
    product_name: string
    option_value_id: number | null
    option_value: string | null
    quantity: number
    unit_price: number
}

function getReservationWithProduct(id: string) {
    return db.prepare(`
        SELECT r.*, p.name as product_name, p.description as product_description, 
               p.price as product_price, p.stock as product_stock, p.image_url as product_image_url,
               p.created_at as product_created_at, p.updated_at as product_updated_at
        FROM reservations r
        LEFT JOIN products p ON r.product_id = p.id
        WHERE r.id = ?
      `).get(id) as any
}

function getReservationItems(reservationId: string, fallbackReservation?: any): ReservationItemRow[] {
    const items = db.prepare(`
        SELECT ri.id, ri.reservation_id, ri.product_id, p.name as product_name, ri.option_value_id,
               ov.value as option_value, ri.quantity, ri.unit_price
        FROM reservation_items ri
        JOIN products p ON p.id = ri.product_id
        LEFT JOIN option_values ov ON ov.id = ri.option_value_id
        WHERE ri.reservation_id = ?
        ORDER BY ri.id ASC
      `).all(reservationId) as ReservationItemRow[]

    if (items.length > 0) return items
    if (!fallbackReservation?.product_id) return []

    return [{
        id: 0,
        reservation_id: Number(reservationId),
        product_id: fallbackReservation.product_id,
        product_name: fallbackReservation.product_name,
        option_value_id: null,
        option_value: null,
        quantity: fallbackReservation.quantity,
        unit_price: fallbackReservation.product_price,
    }]
}

function applyStockDelta(items: ReservationItemRow[], multiplier: 1 | -1) {
    for (const item of items) {
        if (item.option_value_id) {
            const optionValue = db.prepare(`SELECT stock FROM option_values WHERE id = ?`).get(item.option_value_id) as { stock: number | null } | undefined
            if (!optionValue) throw new Error('Option value not found')

            if (optionValue.stock !== null) {
                const nextStock = optionValue.stock + (multiplier * item.quantity)
                if (nextStock < 0) {
                    throw new Error(`Insufficient stock for size "${item.option_value ?? item.option_value_id}"`)
                }
                db.prepare(`UPDATE option_values SET stock = ? WHERE id = ?`).run(nextStock, item.option_value_id)
            }
            continue
        }

        const product = db.prepare(`SELECT stock, limited_stock FROM products WHERE id = ?`).get(item.product_id) as { stock: number; limited_stock: number } | undefined
        if (!product) throw new Error('Product not found')
        if (!product.limited_stock) continue

        const nextStock = product.stock + (multiplier * item.quantity)
        if (nextStock < 0) {
            throw new Error(`Insufficient stock for product "${item.product_name}"`)
        }
        db.prepare(`UPDATE products SET stock = ? WHERE id = ?`).run(nextStock, item.product_id)
    }
}

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

        reservationMetrics: (_: any, args: { status?: string }, ctx: Context) => {
            requirePermission(ctx, 'reservation.read')
            const params: any[] = []
            const whereClause = args.status ? 'WHERE r.status = ?' : ''
            if (args.status) params.push(args.status.toLowerCase())

            const totalRow = db.prepare(`
                SELECT COUNT(*) as total_reservations, COALESCE(SUM(quantity), 0) as total_units
                FROM (
                    SELECT r.id, COALESCE(SUM(ri.quantity), r.quantity) as quantity
                    FROM reservations r
                    LEFT JOIN reservation_items ri ON ri.reservation_id = r.id
                    ${whereClause}
                    GROUP BY r.id
                )
            `).get(...params) as { total_reservations: number; total_units: number }

            const byProduct = db.prepare(`
                SELECT t.product_id, p.name as product_name, SUM(t.quantity) as quantity
                FROM (
                    SELECT ri.product_id, ri.quantity
                    FROM reservations r
                    JOIN reservation_items ri ON ri.reservation_id = r.id
                    ${whereClause}
                    UNION ALL
                    SELECT r.product_id, r.quantity
                    FROM reservations r
                    WHERE NOT EXISTS (SELECT 1 FROM reservation_items ri2 WHERE ri2.reservation_id = r.id)
                    ${args.status ? 'AND r.status = ?' : ''}
                ) t
                JOIN products p ON p.id = t.product_id
                GROUP BY t.product_id, p.name
                ORDER BY quantity DESC, p.name ASC
                LIMIT 10
            `).all(...(args.status ? [...params, ...params] : params)) as Array<{ product_id: number; product_name: string; quantity: number }>

            const bySize = db.prepare(`
                SELECT COALESCE(ov.value, 'Sin talla') as size, SUM(ri.quantity) as quantity
                FROM reservations r
                JOIN reservation_items ri ON ri.reservation_id = r.id
                LEFT JOIN option_values ov ON ov.id = ri.option_value_id
                ${whereClause}
                GROUP BY COALESCE(ov.value, 'Sin talla')
                ORDER BY quantity DESC, size ASC
                LIMIT 10
            `).all(...params) as Array<{ size: string; quantity: number }>

            return {
                totalReservations: totalRow?.total_reservations ?? 0,
                totalUnits: totalRow?.total_units ?? 0,
                byProduct: byProduct.map((row) => ({
                    productId: row.product_id.toString(),
                    productName: row.product_name,
                    quantity: row.quantity,
                })),
                bySize,
            }
        },

        reservation: (_: any, args: { id: string }, ctx: Context) => {
            requirePermission(ctx, 'reservation.read')
            const row = getReservationWithProduct(args.id)
            return row ? reservationFromRow(row, true) : null
        },
    },

    Reservation: {
        items: (parent: any) => {
            const rows = getReservationItems(parent.id, parent)
            return rows.map((row) => ({
                id: row.id.toString(),
                reservationId: row.reservation_id.toString(),
                productId: row.product_id.toString(),
                productName: row.product_name,
                optionValueId: row.option_value_id?.toString() ?? null,
                optionValue: row.option_value,
                quantity: row.quantity,
                unitPrice: row.unit_price,
            }))
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
            const existing = getReservationWithProduct(args.id)
            if (!existing) throw new Error('Reservation not found')

            const validStatuses = ['PENDING_UNVERIFIED', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
            if (!validStatuses.includes(args.status.toUpperCase())) throw new Error('Invalid status')

            const prevStatus = existing.status
            const newStatus = args.status.toLowerCase()

            const now = new Date().toISOString()
            const items = getReservationItems(args.id, existing)

            const tx = db.transaction(() => {
                if (newStatus === 'confirmed' && prevStatus !== 'confirmed') {
                    applyStockDelta(items, -1)
                }
                if (newStatus === 'cancelled' && prevStatus === 'confirmed') {
                    applyStockDelta(items, 1)
                }

                db.prepare(`UPDATE reservations SET status = ?, updated_at = ? WHERE id = ?`).run(newStatus, now, args.id)
            })
            tx()

            const row = getReservationWithProduct(args.id)

            return reservationFromRow(row, true)
        },
    },
}
