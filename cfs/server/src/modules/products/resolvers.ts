import { db } from '../../db/index.js'
import { requirePermission, requireStaff, type Context } from '../shared/guards.js'
import {
    optionValueFromRow,
    productFromRow,
    productOptionFromRow,
    productOptionTypeFromName,
} from '../shared/mappers.js'

export const productsResolvers = {
    Query: {
        products: () => {
            const rows = db.prepare(`SELECT * FROM products`).all()
            return rows.map(productFromRow)
        },

        product: (_: any, args: { id: string }) => {
            const row = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.id)
            return row ? productFromRow(row) : null
        },

        productOptions: (_: any, args: { productId: string }, ctx: Context) => {
            requireStaff(ctx)
            const rows = db.prepare(`SELECT * FROM product_options WHERE product_id = ? ORDER BY position`).all(args.productId)
            return rows.map(productOptionFromRow)
        },
    },

    Product: {
        options: (parent: any) => {
            const rows = db.prepare(`SELECT * FROM product_options WHERE product_id = ? ORDER BY position`).all(parent.id)
            const options = rows.map(productOptionFromRow)
            return options.map((opt: any) => ({
                ...opt,
                values: db.prepare(`SELECT * FROM option_values WHERE option_id = ? ORDER BY position`).all(opt.id).map(optionValueFromRow),
            }))
        },
        stock: (parent: any) => {
            const optionRows = db.prepare(`SELECT * FROM product_options WHERE product_id = ?`).all(parent.id)
            if (optionRows.length === 0) return parent.stock

            let totalStock = 0
            for (const opt of optionRows as any[]) {
                const valueRows = db.prepare(`SELECT stock FROM option_values WHERE option_id = ?`).all(opt.id) as Array<{ stock: number | null }>
                for (const val of valueRows) {
                    if (val.stock === null) return null
                    totalStock += val.stock
                }
            }
            return totalStock
        },
    },

    ProductOption: {
        values: (parent: any) => {
            const rows = db.prepare(`SELECT * FROM option_values WHERE option_id = ? ORDER BY position`).all(parent.id)
            return rows.map(optionValueFromRow)
        },
    },

    Mutation: {
        createProduct: (_: any, args: { input: any }, ctx: Context) => {
            requirePermission(ctx, 'product.create')
            const { name, description, price, stock, imageUrl } = args.input
            if (!name || name.trim() === '') throw new Error('Name is required')
            if (name.length > 500) throw new Error('Name must be 500 characters or less')
            if (price <= 0) throw new Error('Price must be greater than 0')
            if (stock < 0) throw new Error('Stock must be 0 or greater')

            const now = new Date().toISOString()
            const limitedStock = args.input.limitedStock ? 1 : 0
            const result = db.prepare(`
        INSERT INTO products (name, description, price, stock, limited_stock, image_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, description, price, stock, limitedStock, imageUrl || null, now, now)

            return {
                id: result.lastInsertRowid.toString(),
                name,
                description,
                price,
                stock,
                limitedStock: !!limitedStock,
                imageUrl: imageUrl || null,
                createdAt: now,
                updatedAt: now,
            }
        },

        updateProduct: (_: any, args: { id: string; input: any }, ctx: Context) => {
            requirePermission(ctx, 'product.update')
            const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.id) as any
            if (!existing) throw new Error('Product not found')

            const { name, description, price, stock, limitedStock, imageUrl } = args.input
            if (name !== undefined && name.trim() === '') throw new Error('Name is required')
            if (name && name.length > 500) throw new Error('Name must be 500 characters or less')
            if (price !== undefined && price <= 0) throw new Error('Price must be greater than 0')
            if (stock !== undefined && stock < 0) throw new Error('Stock must be 0 or greater')

            const now = new Date().toISOString()
            const updateName = name ?? existing.name
            const updateDescription = description ?? existing.description
            const updatePrice = price ?? existing.price
            const updateStock = stock ?? existing.stock
            const updateLimitedStock = limitedStock !== undefined ? (limitedStock ? 1 : 0) : existing.limited_stock
            const updateImageUrl = imageUrl ?? existing.image_url

            db.prepare(`
        UPDATE products SET name = ?, description = ?, price = ?, stock = ?, limited_stock = ?, image_url = ?, updated_at = ?
        WHERE id = ?
      `).run(updateName, updateDescription, updatePrice, updateStock, updateLimitedStock, updateImageUrl, now, args.id)

            return {
                id: args.id,
                name: updateName,
                description: updateDescription,
                price: updatePrice,
                stock: updateStock,
                limitedStock: !!updateLimitedStock,
                imageUrl: updateImageUrl,
                createdAt: existing.created_at,
                updatedAt: now,
            }
        },

        deleteProduct: (_: any, args: { id: string }, ctx: Context) => {
            requirePermission(ctx, 'product.delete')
            const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(args.id)
            if (!existing) throw new Error('Product not found')
            db.prepare(`DELETE FROM products WHERE id = ?`).run(args.id)
            return true
        },

        createProductOption: (_: any, args: { input: any }, ctx: Context) => {
            requirePermission(ctx, 'product.update')
            const product = db.prepare(`SELECT id FROM products WHERE id = ?`).get(args.input.productId)
            if (!product) throw new Error('Product not found')
            const existingOption = db.prepare(`SELECT id FROM product_options WHERE product_id = ?`).get(args.input.productId)
            if (existingOption) throw new Error('Product already has an option selector. Delete existing option first.')

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
                values: [],
            }
        },

        updateProductOption: (_: any, args: { id: string; input: any }, ctx: Context) => {
            requirePermission(ctx, 'product.update')
            const existing = db.prepare(`SELECT * FROM product_options WHERE id = ?`).get(args.id) as any
            if (!existing) throw new Error('Product option not found')

            const now = new Date().toISOString()
            const name = args.input.name ?? existing.name
            const type = args.input.name ? productOptionTypeFromName(args.input.name) : existing.type
            const required = args.input.required !== undefined ? (args.input.required ? 1 : 0) : existing.required
            db.prepare(`UPDATE product_options SET name = ?, type = ?, required = ?, updated_at = ? WHERE id = ?`)
                .run(name, type, required, now, args.id)

            return {
                id: args.id,
                productId: existing.product_id.toString(),
                name,
                required: !!required,
                values: [],
            }
        },

        deleteProductOption: (_: any, args: { id: string }, ctx: Context) => {
            requirePermission(ctx, 'product.delete')
            const existing = db.prepare(`SELECT id FROM product_options WHERE id = ?`).get(args.id)
            if (!existing) throw new Error('Product option not found')
            db.prepare(`DELETE FROM option_values WHERE option_id = ?`).run(args.id)
            db.prepare(`DELETE FROM product_options WHERE id = ?`).run(args.id)
            return true
        },

        addOptionValues: (_: any, args: { optionId: string; values: any[] }, ctx: Context) => {
            requirePermission(ctx, 'product.update')
            const option = db.prepare(`SELECT * FROM product_options WHERE id = ?`).get(args.optionId) as any
            if (!option) throw new Error('Product option not found')

            const now = new Date().toISOString()
            const insertedValues = []
            for (const val of args.values) {
                const result = db.prepare(`INSERT INTO option_values (option_id, value, stock, position, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)`)
                    .run(args.optionId, val.value, val.stock ?? null, now, now)
                insertedValues.push({ id: result.lastInsertRowid.toString(), optionId: args.optionId, value: val.value, stock: val.stock ?? null })
            }
            return {
                id: option.id.toString(),
                productId: option.product_id.toString(),
                name: option.name,
                type: option.type.toUpperCase(),
                required: !!option.required,
                values: insertedValues,
            }
        },

        updateOptionValue: (_: any, args: { id: string; value?: string; stock?: number }, ctx: Context) => {
            requirePermission(ctx, 'product.update')
            const existing = db.prepare(`SELECT * FROM option_values WHERE id = ?`).get(args.id) as any
            if (!existing) throw new Error('Option value not found')

            const now = new Date().toISOString()
            const newValue = args.value ?? existing.value
            const newStock = args.stock !== undefined ? args.stock : existing.stock
            db.prepare(`UPDATE option_values SET value = ?, stock = ?, updated_at = ? WHERE id = ?`).run(newValue, newStock, now, args.id)
            return { id: args.id, optionId: existing.option_id.toString(), value: newValue, stock: newStock }
        },

        deleteOptionValue: (_: any, args: { id: string }, ctx: Context) => {
            requirePermission(ctx, 'product.delete')
            const existing = db.prepare(`SELECT id FROM option_values WHERE id = ?`).get(args.id)
            if (!existing) throw new Error('Option value not found')
            db.prepare(`DELETE FROM option_values WHERE id = ?`).run(args.id)
            return true
        },
    },
}
