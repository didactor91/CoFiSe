import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { store, getUrl, exists, deleteFile } from './storage.js'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { mkdir, rm } from 'node:fs/promises'

// Test upload directory
const TEST_UPLOADS_DIR = join(process.cwd(), 'test-uploads')

describe('storage module', () => {
    beforeAll(async () => {
        // Ensure test directory exists
        await mkdir(TEST_UPLOADS_DIR, { recursive: true })
    })

    afterAll(async () => {
        // Cleanup test directory
        try {
            await rm(TEST_UPLOADS_DIR, { recursive: true, force: true })
        } catch {
            // Ignore cleanup errors
        }
    })

    describe('store()', () => {
        it('returns UUID filename', async () => {
            const testBuffer = Buffer.from('test image content')
            
            const result = await store(testBuffer, 'jpg')
            
            expect(result.filename).toBeDefined()
            expect(result.filename).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/)
        })

        it('returns correct URL path', async () => {
            const testBuffer = Buffer.from('test image content')
            
            const result = await store(testBuffer, 'png')
            
            expect(result.imageUrl).toBe(`/uploads/${result.filename}`)
        })

        it('stores file with correct extension', async () => {
            const testBuffer = Buffer.from('test image content')
            const extensions = ['jpg', 'png', 'gif', 'webp']
            
            for (const ext of extensions) {
                const result = await store(testBuffer, ext)
                expect(result.filename.endsWith(`.${ext}`)).toBe(true)
            }
        })

        it('handles extension without leading dot', async () => {
            const testBuffer = Buffer.from('test content')
            
            const result = await store(testBuffer, 'jpg')
            
            expect(result.filename).toMatch(/^[0-9a-f-]+\.jpg$/)
        })

        it('handles extension with leading dot', async () => {
            const testBuffer = Buffer.from('test content')
            
            const result = await store(testBuffer, '.jpg')
            
            expect(result.filename).toMatch(/^[0-9a-f-]+\.jpg$/)
        })

        it('returns different UUIDs for each call', async () => {
            const testBuffer = Buffer.from('test content')
            
            const result1 = await store(testBuffer, 'jpg')
            const result2 = await store(testBuffer, 'jpg')
            
            expect(result1.filename).not.toBe(result2.filename)
        })
    })

    describe('getUrl()', () => {
        it('returns correct path format', () => {
            const filename = 'test-uuid-1234.jpg'
            
            const url = getUrl(filename)
            
            expect(url).toBe('/uploads/test-uuid-1234.jpg')
        })

        it('preserves filename exactly', () => {
            const filename = '550e8400-e29b-41d4-a716-446655440000.png'
            
            const url = getUrl(filename)
            
            expect(url).toBe('/uploads/550e8400-e29b-41d4-a716-446655440000.png')
        })
    })

    describe('exists()', () => {
        it('returns true for existing file', async () => {
            const testBuffer = Buffer.from('test content')
            const result = await store(testBuffer, 'txt')
            
            const fileExists = await exists(result.filename)
            
            expect(fileExists).toBe(true)
            
            // Cleanup
            await deleteFile(result.filename)
        })

        it('returns false for non-existing file', async () => {
            const nonExistentFile = 'non-existent-file-12345.jpg'
            
            const fileExists = await exists(nonExistentFile)
            
            expect(fileExists).toBe(false)
        })
    })

    describe('deleteFile()', () => {
        it('deletes existing file successfully', async () => {
            const testBuffer = Buffer.from('test content to delete')
            const result = await store(testBuffer, 'txt')
            
            // Verify it exists
            expect(await exists(result.filename)).toBe(true)
            
            // Delete it
            await deleteFile(result.filename)
            
            // Verify it's gone
            expect(await exists(result.filename)).toBe(false)
        })

        it('does not throw when deleting non-existent file', async () => {
            const nonExistentFile = 'definitely-does-not-exist-12345.jpg'
            
            // Should not throw
            await expect(deleteFile(nonExistentFile)).resolves.not.toThrow()
        })
    })
})
