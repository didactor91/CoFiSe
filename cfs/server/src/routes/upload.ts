import multipart from '@fastify/multipart'
import { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify'

import { hasPermission, type Permission } from '../../auth/permissions.js'
import { db } from '../../db/index.js'
import config from '../config.js'
import { store } from '../modules/shared/storage.js'
import { validateFile } from '../modules/shared/upload.js'
import { eventFromRow, productFromRow, newsFromRow } from '../shared/mappers.js'

type EntityType = 'PRODUCT' | 'NEWS' | 'EVENT'

function getEntityTable(entityType: EntityType): string {
    switch (entityType) {
        case 'PRODUCT': return 'products'
        case 'NEWS': return 'news'
        case 'EVENT': return 'events'
    }
}

function getEntityIdColumn(entityType: EntityType): string {
    switch (entityType) {
        case 'PRODUCT': return 'id'
        case 'NEWS': return 'id'
        case 'EVENT': return 'id'
    }
}

function getEntityMapper(entityType: EntityType) {
    switch (entityType) {
        case 'PRODUCT': return productFromRow
        case 'NEWS': return newsFromRow
        case 'EVENT': return eventFromRow
    }
}

async function linkImageToEntity(entityType: EntityType, entityId: string, imageUrl: string): Promise<void> {
    const table = getEntityTable(entityType)
    const idColumn = getEntityIdColumn(entityType)
    const now = new Date().toISOString()
    db.prepare(`UPDATE ${table} SET image_url = ?, updated_at = ? WHERE ${idColumn} = ?`)
        .run(imageUrl, now, entityId)
}

/**
 * GraphQL resolver for uploadImage mutation
 */
export const uploadImageResolver = {
    uploadImage: async (_: any, args: { entityType: EntityType; entityId: string }, context: any) => {
        // Check authentication
        if (!context.user) {
            throw new Error('Unauthorized')
        }

        // Check permissions
        const permissionMap: Record<EntityType, Permission> = {
            'PRODUCT': 'product.update',
            'NEWS': 'news.update',
            'EVENT': 'event.update',
        }
        if (!hasPermission(context.user.role, permissionMap[args.entityType])) {
            throw new Error('Insufficient permissions')
        }

        // Get entity from database to return updated object
        const table = getEntityTable(args.entityType)
        const idColumn = getEntityIdColumn(args.entityType)
        const row = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(args.entityId)
        if (!row) {
            throw new Error(`${args.entityType.toLowerCase()} not found`)
        }

        const mapper = getEntityMapper(args.entityType)
        return mapper(row)
    }
}

/**
 * Register upload routes
 */
export async function registerUploadRoutes(server: FastifyInstance): Promise<void> {
    // Register multipart plugin
    await server.register(multipart, {
        limits: {
            fileSize: config.uploads.maxSize,
            files: 1,
        },
    })

    // Upload endpoint
    server.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
        // Check authentication
        const user = (request as any).user
        if (!user) {
            return reply.code(401).send({ error: 'Unauthorized' })
        }

        // Check staff/admin permission
        if (!hasPermission(user.role, 'product.update') && 
            !hasPermission(user.role, 'news.update') && 
            !hasPermission(user.role, 'event.update')) {
            return reply.code(403).send({ error: 'Forbidden' })
        }

        // Get file from multipart
        const data = await request.file()
        if (!data) {
            return reply.code(400).send({ error: 'No file provided' })
        }

        // Get entity info from fields
        // Note: fields can be Multipart or Multipart[] depending on how form sends data
        const entityTypeField = (data.fields as any).entityType
        const entityIdField = (data.fields as any).entityId
        
        // Handle both single field and array field
        const entityTypeValue = Array.isArray(entityTypeField) ? entityTypeField[0]?.value : entityTypeField?.value
        const entityIdValue = Array.isArray(entityIdField) ? entityIdField[0]?.value : entityIdField?.value
        
        const entityType = entityTypeValue as EntityType | undefined
        const entityId = entityIdValue as string | undefined

        // Validate entityType if provided
        if (entityType && !['PRODUCT', 'NEWS', 'EVENT'].includes(entityType)) {
            return reply.code(400).send({ error: 'Invalid entityType. Must be PRODUCT, NEWS, or EVENT' })
        }

        // Validate entityId format if provided
        if (entityId && !/^\d+$/.test(entityId)) {
            return reply.code(400).send({ error: 'Invalid entityId' })
        }

        // Read file buffer
        const buffer = await data.toBuffer()

        // Validate file
        const validation = validateFile(buffer, data.mimetype, data.filename)
        if ('error' in validation) {
            return reply.code(400).send({ error: validation.error })
        }

        // Store file
        const result = await store(buffer, validation.extension)

        // Link to entity if entityType and entityId provided
        if (entityType && entityId) {
            await linkImageToEntity(entityType, entityId, result.imageUrl)
        }

        return {
            imageUrl: result.imageUrl,
            filename: result.filename,
        }
    })
}

export default registerUploadRoutes
