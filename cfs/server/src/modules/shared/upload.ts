import config from '../../config.js'

// Magic bytes for image formats
const MAGIC_BYTES: Record<string, number[]> = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF....WEBP
}

const EXTENSION_TO_MIME: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
}

export interface UploadResult {
    buffer: Buffer
    mimeType: string
    extension: string
}

export interface ValidationError {
    error: string
}

/**
 * Validate magic bytes to determine actual file type
 */
function validateMagicBytes(buffer: Buffer): { valid: boolean; mimeType: string | null } {
    for (const [mimeType, magic] of Object.entries(MAGIC_BYTES)) {
        let match = true
        for (let i = 0; i < magic.length; i++) {
            if (buffer[i] !== magic[i]) {
                match = false
                break
            }
        }
        if (match) {
            return { valid: true, mimeType }
        }
    }
    return { valid: false, mimeType: null }
}

/**
 * Get extension from filename or MIME type
 */
function getExtensionFromMime(mimeType: string): string {
    const map: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
    }
    return map[mimeType] || 'bin'
}

/**
 * Validate uploaded file
 * - Checks magic bytes (not just MIME type)
 * - Checks file size
 * - Returns normalized extension
 */
export function validateFile(buffer: Buffer, declaredMimeType: string, filename: string): UploadResult | ValidationError {
    // Check file size
    if (buffer.length > config.uploads.maxSize) {
        return { error: `File size exceeds maximum of ${config.uploads.maxSize / (1024 * 1024)}MB` }
    }

    // Validate magic bytes
    const magicResult = validateMagicBytes(buffer)
    if (!magicResult.valid) {
        return { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' }
    }

    // Determine extension from filename or detected mime type
    let extension = ''
    const filenameLower = filename.toLowerCase()
    
    // Try to get extension from filename
    const lastDot = filenameLower.lastIndexOf('.')
    if (lastDot > 0) {
        const filenameExt = filenameLower.substring(lastDot + 1)
        if (EXTENSION_TO_MIME[filenameExt]) {
            extension = filenameExt
        }
    }
    
    // Fallback to detected mime type
    if (!extension) {
        extension = getExtensionFromMime(magicResult.mimeType!)
    }

    return {
        buffer,
        mimeType: magicResult.mimeType!,
        extension,
    }
}

/**
 * Extract file extension from filename
 */
export function getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.')
    if (lastDot > 0) {
        return filename.substring(lastDot)
    }
    return ''
}
