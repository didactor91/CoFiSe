import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import config from '../../config.js'

export interface StorageResult {
    filename: string
    imageUrl: string
}

/**
 * Get the URL path for a stored file
 */
export function getUrl(filename: string): string {
    return `/uploads/${filename}`
}

/**
 * Check if a file exists
 */
export async function exists(filename: string): Promise<boolean> {
    const { stat } = await import('node:fs/promises')
    try {
        await stat(join(config.uploads.dir, filename))
        return true
    } catch {
        return false
    }
}

/**
 * Delete a stored file
 */
export async function deleteFile(filename: string): Promise<void> {
    const { unlink } = await import('node:fs/promises')
    const filePath = join(config.uploads.dir, filename)
    try {
        await unlink(filePath)
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            throw error
        }
    }
}

/**
 * Store a file buffer and return the filename and URL
 */
export async function store(buffer: Buffer, originalExtension: string): Promise<StorageResult> {
    // Ensure upload directory exists
    await mkdir(config.uploads.dir, { recursive: true })

    // Generate UUID filename with extension
    const uuid = randomUUID()
    const extension = originalExtension.replace(/^\./, '') // Remove leading dot if present
    const filename = `${uuid}.${extension}`

    // Write file
    const filePath = join(config.uploads.dir, filename)
    const writeStream = createWriteStream(filePath)
    
    await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
        writeStream.write(buffer)
        writeStream.end()
    })

    return {
        filename,
        imageUrl: getUrl(filename),
    }
}
