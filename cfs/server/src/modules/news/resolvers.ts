import { db } from '../../db/index.js'
import { requirePermission, type Context } from '../shared/guards.js'
import { newsFromRow } from '../shared/mappers.js'

export const newsResolvers = {
    Query: {
        news: () => {
            const rows = db.prepare(`SELECT * FROM news ORDER BY created_at DESC`).all()
            return rows.map(newsFromRow)
        },

        newsItem: (_: any, args: { id: string }) => {
            const row = db.prepare(`SELECT * FROM news WHERE id = ?`).get(args.id)
            return row ? newsFromRow(row) : null
        },

        allNews: (_: any, __: any, ctx: Context) => {
            requirePermission(ctx, 'news.read')
            const rows = db.prepare(`SELECT * FROM news ORDER BY created_at DESC`).all()
            return rows.map(newsFromRow)
        },
    },

    Mutation: {
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
                updatedAt: now,
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
                updatedAt: now,
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
    },
}
