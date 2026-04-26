import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '../shared/ui/Button'
import theme from '../theme'

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

interface ImageUploadProps {
    entityType: 'PRODUCT' | 'NEWS' | 'EVENT'
    entityId?: string
    currentImageUrl?: string | null
    onUploadComplete?: (imageUrl: string) => void
    onUploadStateChange?: (state: UploadState) => void
}

const API_BASE = '/api'

export function ImageUpload({ entityType, entityId, currentImageUrl, onUploadComplete, onUploadStateChange }: ImageUploadProps) {
    const [uploadState, setUploadState] = useState<UploadState>('idle')
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
    const [error, setError] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Notify parent of state changes
    useEffect(() => {
        onUploadStateChange?.(uploadState)
    }, [uploadState, onUploadStateChange])

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setError(null)
        setIsUploading(true)
        setUploadState('uploading')

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!validTypes.includes(file.type)) {
            setError('Tipo de archivo inválido. Usa: JPG, PNG, GIF, WebP')
            setUploadState('error')
            setIsUploading(false)
            return
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('El archivo es demasiado grande. Máximo 5MB')
            setUploadState('error')
            setIsUploading(false)
            return
        }

        // Show preview
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target?.result as string)
        reader.readAsDataURL(file)

        // Upload file
        try {
            const formData = new FormData()
            formData.append('file', file)
            if (entityType) formData.append('entityType', entityType)
            if (entityId) formData.append('entityId', entityId)

            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Error al subir la imagen')
            }

            const data = await response.json()
            setPreview(data.imageUrl)
            setUploadState('success')
            onUploadComplete?.(data.imageUrl)
        } catch (err: any) {
            setError(err.message || 'Error al subir la imagen')
            setUploadState('error')
        } finally {
            setIsUploading(false)
        }
    }, [entityType, entityId, onUploadComplete])

    const handleRemove = useCallback(async () => {
        if (!currentImageUrl) return
        setPreview(null)
        setUploadState('idle')
        onUploadComplete?.('')
    }, [currentImageUrl, onUploadComplete])

    const displayUrl = preview || currentImageUrl

    return (
        <div style={{ marginTop: theme.spacing.md }}>
            <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                Imagen
            </label>

            {/* Preview area */}
            {displayUrl && (
                <div style={{ marginBottom: theme.spacing.sm, position: 'relative', display: 'inline-block' }}>
                    <img
                        src={displayUrl}
                        alt="Preview"
                        style={{
                            maxWidth: '200px',
                            maxHeight: '150px',
                            objectFit: 'cover',
                            borderRadius: theme.borderRadius.sm,
                            border: `1px solid ${theme.colors.border}`,
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: theme.colors.error,
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* File input */}
            <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    style={{
                        display: 'none',
                    }}
                />
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? 'Subiendo...' : displayUrl ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </Button>
            </div>

            {/* Error message */}
            {error && (
                <p style={{ color: theme.colors.error, fontSize: theme.typography.fontSize.xs, marginTop: theme.spacing.xs }}>
                    {error}
                </p>
            )}

            {/* Upload state indicator */}
            {uploadState === 'uploading' && (
                <p style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginTop: theme.spacing.xs }}>
                    Subiendo imagen...
                </p>
            )}
            {uploadState === 'success' && !error && (
                <p style={{ color: theme.colors.success, fontSize: theme.typography.fontSize.xs, marginTop: theme.spacing.xs }}>
                    Imagen subida correctamente
                </p>
            )}
        </div>
    )
}

export default ImageUpload
