/**
 * Unit Tests for ImageUpload Component
 * 
 * Tests component rendering and state transitions
 * 
 * Phase 5: Testing - Task 5.10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock theme
vi.mock('../../theme', () => ({
    default: {
        colors: {
            accent: '#d4af37',
            text: '#f5f5f5',
            textSecondary: '#a0a0a0',
            border: '#262626',
            surface: '#141414',
            background: '#0a0a0a',
            success: '#22c55e',
            error: '#ef4444',
            disabled: '#4a4a4a',
            disabledText: '#888888',
        },
        typography: {
            fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.25rem', xl: '1.5rem' },
            fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
        },
        spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
        borderRadius: { sm: '4px', md: '8px', lg: '12px' },
    },
}))

// Mock Button component
vi.mock('../../shared/ui/Button', () => ({
    Button: ({ children, disabled, onClick, type }: any) => (
        <button type={type || 'button'} disabled={disabled} onClick={onClick} data-testid="mock-button">
            {children}
        </button>
    ),
}))

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

import ImageUpload from '../../components/ImageUpload'

describe('ImageUpload Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFetch.mockReset()
    })

    describe('Rendering', () => {
        it('should render the component with label', () => {
            render(<ImageUpload entityType="PRODUCT" />)

            expect(screen.getByText('Imagen')).toBeInTheDocument()
        })

        it('should render upload button in idle state', () => {
            render(<ImageUpload entityType="PRODUCT" />)

            expect(screen.getByTestId('mock-button')).toBeInTheDocument()
            expect(screen.getByTestId('mock-button')).toHaveTextContent('Seleccionar imagen')
        })

        it('should render file input with correct accept attribute', () => {
            render(<ImageUpload entityType="PRODUCT" />)

            const input = screen.getByRole('button', { name: /seleccionar imagen/i }).closest('div').querySelector('input')
            expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/gif,image/webp')
        })

        it('should show "Cambiar imagen" button when currentImageUrl is provided', () => {
            render(<ImageUpload entityType="PRODUCT" currentImageUrl="http://example.com/image.jpg" />)

            expect(screen.getByTestId('mock-button')).toHaveTextContent('Cambiar imagen')
        })
    })

    describe('Idle State', () => {
        it('should display "Seleccionar imagen" when no image is set', () => {
            render(<ImageUpload entityType="PRODUCT" />)

            expect(screen.getByTestId('mock-button')).toHaveTextContent('Seleccionar imagen')
        })

        it('should show current image preview when currentImageUrl is provided', () => {
            render(<ImageUpload entityType="PRODUCT" currentImageUrl="http://example.com/existing.jpg" />)

            const img = screen.getByAltText('Preview')
            expect(img).toHaveAttribute('src', 'http://example.com/existing.jpg')
        })

        it('should not show error message in idle state', () => {
            render(<ImageUpload entityType="PRODUCT" />)

            expect(screen.queryByText(/tipo de archivo inválido/i)).not.toBeInTheDocument()
            expect(screen.queryByText(/archivo demasiado grande/i)).not.toBeInTheDocument()
        })
    })

    describe('State Transitions', () => {
        it('should transition to uploading state when file is selected', async () => {
            const user = userEvent.setup()
            mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves to keep uploading state

            render(<ImageUpload entityType="PRODUCT" />)

            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
            const input = document.querySelector('input[type="file"]')

            if (input) {
                Object.defineProperty(input, 'files', {
                    value: [file],
                    configurable: true,
                })
                fireEvent.change(input)
            }

            await waitFor(() => {
                // Check that uploading text is present (either button or status text)
                const uploadingText = screen.getAllByText(/subiendo/i)
                expect(uploadingText.length).toBeGreaterThan(0)
            })
        })

        it('should show success message after successful upload', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ imageUrl: '/uploads/test-uuid.jpg' }),
            })

            render(<ImageUpload entityType="PRODUCT" />)

            const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
            const input = document.querySelector('input[type="file"]')

            if (input) {
                Object.defineProperty(input, 'files', {
                    value: [file],
                    configurable: true,
                })
                fireEvent.change(input)
            }

            await waitFor(() => {
                expect(screen.getByText(/imagen subida correctamente/i)).toBeInTheDocument()
            })
        })

        it('should show error message on upload failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ error: 'Error del servidor' }),
            })

            render(<ImageUpload entityType="PRODUCT" />)

            const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
            const input = document.querySelector('input[type="file"]')

            if (input) {
                Object.defineProperty(input, 'files', {
                    value: [file],
                    configurable: true,
                })
                fireEvent.change(input)
            }

            await waitFor(() => {
                // The component shows "Error del servidor" from the API response
                expect(screen.getByText(/error del servidor/i)).toBeInTheDocument()
            })
        })
    })

    describe('Client-side Validation', () => {
        it('should reject invalid file types before upload', async () => {
            const user = userEvent.setup()

            render(<ImageUpload entityType="PRODUCT" />)

            const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
            const input = document.querySelector('input[type="file"]')

            if (input) {
                Object.defineProperty(input, 'files', {
                    value: [file],
                    configurable: true,
                })
                fireEvent.change(input)
            }

            await waitFor(() => {
                expect(screen.getByText(/tipo de archivo inválido/i)).toBeInTheDocument()
            })

            // Fetch should not be called for invalid file types
            expect(mockFetch).not.toHaveBeenCalled()
        })

        it('should reject files larger than 5MB', async () => {
            // Create a file larger than 5MB
            const largeContent = new ArrayBuffer(6 * 1024 * 1024)
            const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })

            render(<ImageUpload entityType="PRODUCT" />)

            const input = document.querySelector('input[type="file"]')

            if (input) {
                Object.defineProperty(input, 'files', {
                    value: [file],
                    configurable: true,
                })
                fireEvent.change(input)
            }

            await waitFor(() => {
                // The component shows "El archivo es demasiado grande. Máximo 5MB"
                const errorElements = screen.getAllByText(/archivo/i)
                expect(errorElements.length).toBeGreaterThan(0)
            })

            // Fetch should not be called for oversized files
            expect(mockFetch).not.toHaveBeenCalled()
        })

        it('should accept valid image types', async () => {
            mockFetch.mockImplementation(() => new Promise(() => {}))

            const validTypes = [
                { name: 'test.jpg', type: 'image/jpeg' },
                { name: 'test.png', type: 'image/png' },
                { name: 'test.gif', type: 'image/gif' },
                { name: 'test.webp', type: 'image/webp' },
            ]

            for (const { name, type } of validTypes) {
                vi.clearAllMocks()
                render(<ImageUpload entityType="PRODUCT" />)

                const file = new File(['test content'], name, { type })
                const input = document.querySelector('input[type="file"]')

                if (input) {
                    Object.defineProperty(input, 'files', {
                        value: [file],
                        configurable: true,
                    })
                    fireEvent.change(input)
                }

                // Should show uploading state (fetch was called)
                await waitFor(() => {
                    const uploadingText = screen.getAllByText(/subiendo/i)
                    expect(uploadingText.length).toBeGreaterThan(0)
                }, { timeout: 1000 })
            }
        })
    })

    describe('Callback Props', () => {
        it('should call onUploadComplete with imageUrl on success', async () => {
            const onUploadComplete = vi.fn()
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ imageUrl: '/uploads/test-uuid.jpg' }),
            })

            render(<ImageUpload entityType="PRODUCT" onUploadComplete={onUploadComplete} />)

            const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
            const input = document.querySelector('input[type="file"]')

            if (input) {
                Object.defineProperty(input, 'files', {
                    value: [file],
                    configurable: true,
                })
                fireEvent.change(input)
            }

            await waitFor(() => {
                expect(onUploadComplete).toHaveBeenCalledWith('/uploads/test-uuid.jpg')
            })
        })

        it('should call onUploadStateChange with state transitions', async () => {
            const states: string[] = []
            const onUploadStateChange = (state: string) => states.push(state)

            mockFetch.mockImplementation(() => new Promise(() => {}))

            render(<ImageUpload entityType="PRODUCT" onUploadStateChange={onUploadStateChange} />)

            const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
            const input = document.querySelector('input[type="file"]')

            if (input) {
                Object.defineProperty(input, 'files', {
                    value: [file],
                    configurable: true,
                })
                fireEvent.change(input)
            }

            await waitFor(() => {
                expect(states).toContain('uploading')
            }, { timeout: 1000 })
        })
    })

    describe('Image Preview', () => {
        it('should show preview after selecting file', async () => {
            mockFetch.mockImplementation(() => new Promise(() => {}))

            render(<ImageUpload entityType="PRODUCT" />)

            // Create a file with some content
            const fileContent = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
            const file = new File([fileContent], 'test.jpg', { type: 'image/jpeg' })
            
            const input = document.querySelector('input[type="file"]')

            if (input) {
                Object.defineProperty(input, 'files', {
                    value: [file],
                    configurable: true,
                })
                fireEvent.change(input)
            }

            await waitFor(() => {
                // Should show preview image
                const preview = screen.queryByAltText('Preview')
                expect(preview).toBeInTheDocument()
            }, { timeout: 1000 })
        })

        it('should remove preview when handleRemove is called', async () => {
            const onUploadComplete = vi.fn()

            render(
                <ImageUpload
                    entityType="PRODUCT"
                    currentImageUrl="http://example.com/image.jpg"
                    onUploadComplete={onUploadComplete}
                />
            )

            // Find and click the remove button
            const removeButton = screen.getByRole('button', { name: /×/i })
            fireEvent.click(removeButton)

            await waitFor(() => {
                expect(onUploadComplete).toHaveBeenCalledWith('')
            })
        })
    })

    describe('Entity Type Prop', () => {
        it('should accept PRODUCT entityType', () => {
            render(<ImageUpload entityType="PRODUCT" />)
            expect(screen.getByTestId('mock-button')).toBeInTheDocument()
        })

        it('should accept NEWS entityType', () => {
            render(<ImageUpload entityType="NEWS" />)
            expect(screen.getByTestId('mock-button')).toBeInTheDocument()
        })

        it('should accept EVENT entityType', () => {
            render(<ImageUpload entityType="EVENT" />)
            expect(screen.getByTestId('mock-button')).toBeInTheDocument()
        })
    })
})
