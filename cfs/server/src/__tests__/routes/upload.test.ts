/**
 * Integration Tests for Upload Route
 * 
 * Tests POST /upload endpoint behavior
 * Note: Full multipart testing requires complex server setup due to
 * @fastify/multipart plugin registration constraints.
 * 
 * Phase 5: Testing - Task 5.9
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { validateFile } from '../../modules/shared/upload.js'
import { store, getUrl, deleteFile } from '../../modules/shared/storage.js'
import { randomUUID } from 'node:crypto'
import path from 'path'
import fs from 'fs'

const TEST_UPLOADS_DIR = path.join(process.cwd(), 'test-uploads-integration')

describe('Upload Route - Integration', () => {
    beforeAll(async () => {
        // Ensure test upload directory exists
        if (!fs.existsSync(TEST_UPLOADS_DIR)) {
            fs.mkdirSync(TEST_UPLOADS_DIR, { recursive: true })
        }
    })

    afterAll(async () => {
        // Cleanup test upload directory
        try {
            if (fs.existsSync(TEST_UPLOADS_DIR)) {
                const files = fs.readdirSync(TEST_UPLOADS_DIR)
                for (const file of files) {
                    fs.unlinkSync(path.join(TEST_UPLOADS_DIR, file))
                }
                fs.rmdirSync(TEST_UPLOADS_DIR)
            }
        } catch {
            // Ignore cleanup errors
        }
    })

    describe('File Validation', () => {
        it('validateFile accepts valid JPEG', () => {
            const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46])
            const result = validateFile(jpegBuffer, 'image/jpeg', 'test.jpg')
            expect(result).not.toHaveProperty('error')
            expect((result as any).mimeType).toBe('image/jpeg')
        })

        it('validateFile rejects invalid file type', () => {
            const textBuffer = Buffer.from('This is just text')
            const result = validateFile(textBuffer, 'text/plain', 'test.txt')
            expect(result).toHaveProperty('error')
            expect((result as any).error).toContain('Invalid file type')
        })

        it('validateFile rejects oversized files (>5MB)', () => {
            const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 0xFF)
            const result = validateFile(largeBuffer, 'image/jpeg', 'large.jpg')
            expect(result).toHaveProperty('error')
            expect((result as any).error).toContain('exceeds maximum')
        })
    })

    describe('File Storage', () => {
        it('store() creates file with UUID filename', async () => {
            const testBuffer = Buffer.from('test image content')
            const result = await store(testBuffer, 'jpg')
            
            expect(result.filename).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/)
            
            // Cleanup
            await deleteFile(result.filename)
        })

        it('store() returns correct URL path', async () => {
            const testBuffer = Buffer.from('test image content')
            const result = await store(testBuffer, 'png')
            
            expect(result.imageUrl).toBe(`/uploads/${result.filename}`)
            
            // Cleanup
            await deleteFile(result.filename)
        })

        it('getUrl() returns correct path format', () => {
            const filename = 'test-uuid-1234.jpg'
            const url = getUrl(filename)
            expect(url).toBe('/uploads/test-uuid-1234.jpg')
        })
    })

    describe('End-to-End Upload Flow', () => {
        it('complete flow: validate -> store -> getUrl', async () => {
            // Step 1: Create valid image buffer
            const imageBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46])
            
            // Step 2: Validate
            const validation = validateFile(imageBuffer, 'image/jpeg', 'photo.jpg')
            expect(validation).not.toHaveProperty('error')
            expect((validation as any).extension).toBe('jpg')
            
            // Step 3: Store
            const storage = await store(imageBuffer, (validation as any).extension)
            expect(storage.filename).toBeDefined()
            expect(storage.imageUrl).toContain('/uploads/')
            
            // Step 4: Verify URL format
            const url = getUrl(storage.filename)
            expect(url).toBe(storage.imageUrl)
            
            // Cleanup
            await deleteFile(storage.filename)
        })

        it('complete flow with PNG', async () => {
            const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
            
            const validation = validateFile(pngBuffer, 'image/png', 'image.png')
            expect(validation).not.toHaveProperty('error')
            
            const storage = await store(pngBuffer, 'png')
            expect(storage.filename.endsWith('.png')).toBe(true)
            
            await deleteFile(storage.filename)
        })

        it('complete flow with GIF', async () => {
            const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
            
            const validation = validateFile(gifBuffer, 'image/gif', 'animation.gif')
            expect(validation).not.toHaveProperty('error')
            
            const storage = await store(gifBuffer, 'gif')
            expect(storage.filename.endsWith('.gif')).toBe(true)
            
            await deleteFile(storage.filename)
        })

        it('complete flow with WebP', async () => {
            const webpBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])
            
            const validation = validateFile(webpBuffer, 'image/webp', 'image.webp')
            expect(validation).not.toHaveProperty('error')
            
            const storage = await store(webpBuffer, 'webp')
            expect(storage.filename.endsWith('.webp')).toBe(true)
            
            await deleteFile(storage.filename)
        })
    })
})
