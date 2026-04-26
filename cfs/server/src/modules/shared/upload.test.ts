import { describe, it, expect } from 'vitest'
import { validateFile } from './upload.js'

describe('upload module - magic bytes validation', () => {
    describe('rejects files with wrong signatures', () => {
        it('rejects .exe disguised as .jpg', () => {
            // EXE file signature: MZ (0x4D, 0x5A)
            const exeBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00])
            
            const result = validateFile(exeBuffer, 'image/jpeg', 'malware.jpg')
            
            expect(result).toHaveProperty('error')
            expect((result as { error: string }).error).toContain('Invalid file type')
        })

        it('rejects a text file disguised as png', () => {
            // Text file content - not a valid image signature
            const textBuffer = Buffer.from('This is just plain text, not an image')
            
            const result = validateFile(textBuffer, 'image/png', 'fake.png')
            
            expect(result).toHaveProperty('error')
            expect((result as { error: string }).error).toContain('Invalid file type')
        })

        it('rejects a pdf disguised as webp', () => {
            // PDF signature: %PDF (0x25, 0x50, 0x44, 0x46)
            const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34])
            
            const result = validateFile(pdfBuffer, 'image/webp', 'document.webp')
            
            expect(result).toHaveProperty('error')
            expect((result as { error: string }).error).toContain('Invalid file type')
        })

        it('rejects empty buffer', () => {
            const emptyBuffer = Buffer.from([])
            
            const result = validateFile(emptyBuffer, 'image/jpeg', 'empty.jpg')
            
            expect(result).toHaveProperty('error')
            expect((result as { error: string }).error).toContain('Invalid file type')
        })

        it('rejects random bytes that do not match any magic signature', () => {
            // Random bytes that don't match JPEG, PNG, GIF, or WebP
            const randomBuffer = Buffer.from([0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77])
            
            const result = validateFile(randomBuffer, 'image/jpeg', 'random.jpg')
            
            expect(result).toHaveProperty('error')
            expect((result as { error: string }).error).toContain('Invalid file type')
        })
    })

    describe('accepts valid image types', () => {
        it('accepts valid JPEG image', () => {
            // JPEG magic bytes: FF D8 FF
            const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46])
            
            const result = validateFile(jpegBuffer, 'image/jpeg', 'photo.jpg')
            
            expect(result).not.toHaveProperty('error')
            expect((result as { mimeType: string }).mimeType).toBe('image/jpeg')
            expect((result as { extension: string }).extension).toBe('jpg')
        })

        it('accepts valid PNG image', () => {
            // PNG magic bytes: 89 50 4E 47
            const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
            
            const result = validateFile(pngBuffer, 'image/png', 'image.png')
            
            expect(result).not.toHaveProperty('error')
            expect((result as { mimeType: string }).mimeType).toBe('image/png')
            expect((result as { extension: string }).extension).toBe('png')
        })

        it('accepts valid GIF image', () => {
            // GIF magic bytes: 47 49 46 38 (GIF8)
            const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00])
            
            const result = validateFile(gifBuffer, 'image/gif', 'animation.gif')
            
            expect(result).not.toHaveProperty('error')
            expect((result as { mimeType: string }).mimeType).toBe('image/gif')
            expect((result as { extension: string }).extension).toBe('gif')
        })

        it('accepts valid WebP image', () => {
            // WebP magic bytes: 52 49 46 46 (RIFF) followed by ...57 45 42 50 (WEBP)
            const webpBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])
            
            const result = validateFile(webpBuffer, 'image/webp', 'image.webp')
            
            expect(result).not.toHaveProperty('error')
            expect((result as { mimeType: string }).mimeType).toBe('image/webp')
            expect((result as { extension: string }).extension).toBe('webp')
        })
    })
})
