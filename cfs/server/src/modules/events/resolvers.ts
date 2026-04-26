import { db } from '../../db/index.js'
import { requirePermission, type Context } from '../shared/guards.js'
import { eventFromRow } from '../shared/mappers.js'

export const eventsResolvers = {
    Query: {
        events: () => {
            const rows = db.prepare(`SELECT * FROM events WHERE start_time >= datetime('now') ORDER BY start_time ASC`).all()
            return rows.map(eventFromRow)
        },

        event: (_: any, args: { id: string }) => {
            const row = db.prepare(`SELECT * FROM events WHERE id = ?`).get(args.id)
            return row ? eventFromRow(row) : null
        },

        allEvents: (_: any, __: any, ctx: Context) => {
            requirePermission(ctx, 'event.read')
            const rows = db.prepare(`SELECT * FROM events ORDER BY start_time ASC`).all()
            return rows.map(eventFromRow)
        },
    },

    Mutation: {
        createEvent: (_: any, args: { input: any }, ctx: Context) => {
            requirePermission(ctx, 'event.create')
            const { name, description, location, startTime, endTime, imageUrl } = args.input

            if (!name || name.trim() === '') throw new Error('Name is required')
            if (name.length > 200) throw new Error('Name must be 200 characters or less')
            if (!location || location.trim() === '') throw new Error('Location is required')
            if (location.length > 300) throw new Error('Location must be 300 characters or less')
            if (!startTime) throw new Error('Start time is required')
            if (!endTime) throw new Error('End time is required')
            if (new Date(endTime) <= new Date(startTime)) throw new Error('End time must be after start time')

            const now = new Date().toISOString()
            const result = db.prepare(`
        INSERT INTO events (name, description, location, start_time, end_time, image_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, description || null, location, startTime, endTime, imageUrl || null, now, now)

            return {
                id: result.lastInsertRowid.toString(),
                name,
                description: description || null,
                location,
                startTime,
                endTime,
                imageUrl: imageUrl || null,
                createdAt: now,
                updatedAt: now,
            }
        },

        updateEvent: (_: any, args: { id: string; input: any }, ctx: Context) => {
            requirePermission(ctx, 'event.update')
            const existing = db.prepare(`SELECT * FROM events WHERE id = ?`).get(args.id) as any
            if (!existing) throw new Error('Event not found')

            const { name, description, location, startTime, endTime, imageUrl } = args.input
            if (name !== undefined) {
                if (name.trim() === '') throw new Error('Name is required')
                if (name.length > 200) throw new Error('Name must be 200 characters or less')
            }
            if (location !== undefined) {
                if (location.trim() === '') throw new Error('Location is required')
                if (location.length > 300) throw new Error('Location must be 300 characters or less')
            }
            if (startTime !== undefined && endTime !== undefined && new Date(endTime) <= new Date(startTime)) {
                throw new Error('End time must be after start time')
            }

            const now = new Date().toISOString()
            const updateName = name ?? existing.name
            const updateDescription = description ?? existing.description
            const updateLocation = location ?? existing.location
            const updateStartTime = startTime ?? existing.start_time
            const updateEndTime = endTime ?? existing.end_time
            const updateImageUrl = imageUrl ?? existing.image_url

            db.prepare(`
        UPDATE events SET name = ?, description = ?, location = ?, start_time = ?, end_time = ?, image_url = ?, updated_at = ?
        WHERE id = ?
      `).run(updateName, updateDescription, updateLocation, updateStartTime, updateEndTime, updateImageUrl, now, args.id)

            return {
                id: args.id,
                name: updateName,
                description: updateDescription,
                location: updateLocation,
                startTime: updateStartTime,
                endTime: updateEndTime,
                imageUrl: updateImageUrl,
                createdAt: existing.created_at,
                updatedAt: now,
            }
        },

        deleteEvent: (_: any, args: { id: string }, ctx: Context) => {
            requirePermission(ctx, 'event.delete')
            const existing = db.prepare(`SELECT * FROM events WHERE id = ?`).get(args.id)
            if (!existing) throw new Error('Event not found')
            db.prepare(`DELETE FROM events WHERE id = ?`).run(args.id)
            return true
        },
    },
}
