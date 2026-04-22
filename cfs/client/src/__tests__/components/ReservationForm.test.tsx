import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Define types locally
interface CreateReservationInput {
  productId: string
  quantity: number
  name: string
  email: string
  phone: string
  notes?: string
}

// Mutable state for mocking
let formData: CreateReservationInput | null = null
let mutationError: string | null = null

// Mock useCreateReservationMutation
const mockCreateReservation = vi.fn()

vi.mock('../../graphql/mutations', () => ({
  CREATE_RESERVATION_MUTATION: '',
  useCreateReservationMutation: () => [
    { fetching: false, error: mutationError ? { message: mutationError } : null },
    mockCreateReservation,
  ] as const,
}))

import ReservationForm from '../../components/ReservationForm'

const mockProduct = {
  id: '1',
  name: 'Producto Test',
  description: 'Descripción del producto',
  price: 99.99,
  stock: 10,
  imageUrl: null,
  createdAt: '2026-04-20T10:00:00Z',
  updatedAt: '2026-04-20T10:00:00Z',
}

describe('ReservationForm Component', () => {
  beforeEach(() => {
    formData = null
    mutationError = null
    mockCreateReservation.mockClear()
  })

  describe('Form Fields', () => {
    it('should render all required form fields', () => {
      render(<ReservationForm product={mockProduct} onSuccess={vi.fn()} />)

      expect(screen.getByLabelText(/producto/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/cantidad/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notas/i)).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should show validation errors for required fields', async () => {
      const user = userEvent.setup()
      render(<ReservationForm product={mockProduct} onSuccess={vi.fn()} />)

      // Submit form directly using data-testid
      const form = screen.getByTestId('reservation-form')
      await act(async () => {
        fireEvent.submit(form)
      })

      // Should show validation errors (all 3 fields should show required errors)
      await waitFor(() => {
        const errorMessages = screen.getAllByText(/requerido/i)
        expect(errorMessages.length).toBe(3)
      })
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      render(<ReservationForm product={mockProduct} onSuccess={vi.fn()} />)

      // Fill invalid email
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'invalid-email')

      // Submit form
      const form = screen.getByTestId('reservation-form')
      await act(async () => {
        fireEvent.submit(form)
      })

      // Should show email validation error
      await waitFor(() => {
        expect(screen.getByText(/email válido/i)).toBeInTheDocument()
      })
    })

    it('should validate phone number length', async () => {
      const user = userEvent.setup()
      render(<ReservationForm product={mockProduct} onSuccess={vi.fn()} />)

      // Fill short phone
      const phoneInput = screen.getByLabelText(/teléfono/i)
      await user.type(phoneInput, '123')

      // Submit form
      const form = screen.getByTestId('reservation-form')
      await act(async () => {
        fireEvent.submit(form)
      })

      // Should show phone validation error
      await waitFor(() => {
        expect(screen.getByText(/mínimo 9 caracteres/i)).toBeInTheDocument()
      })
    })
  })

  describe('Submit Button', () => {
    it('should be disabled until form is valid', () => {
      render(<ReservationForm product={mockProduct} onSuccess={vi.fn()} />)

      const submitButton = screen.getByRole('button', { name: /enviar/i })
      expect(submitButton).toBeDisabled()
    })

    it('should be enabled when all required fields are filled', async () => {
      const user = userEvent.setup()
      render(<ReservationForm product={mockProduct} onSuccess={vi.fn()} />)

      // Fill all required fields
      await user.type(screen.getByLabelText(/nombre/i), 'Juan Pérez')
      await user.type(screen.getByLabelText(/email/i), 'juan@example.com')
      await user.type(screen.getByLabelText(/teléfono/i), '12345678901234')

      const submitButton = screen.getByRole('button', { name: /enviar/i })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('should call createReservation on submit', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()

      // Mock the execute function to return a Promise that resolves with data
      mockCreateReservation.mockImplementation(() => Promise.resolve({
        data: {
          createReservation: {
            id: '1',
            productId: '1',
            quantity: 1,
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '12345678901234',
            notes: null,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            product: mockProduct,
          },
        },
        error: null,
      }))

      render(<ReservationForm product={mockProduct} onSuccess={mockOnSuccess} />)

      // Fill all required fields
      await user.type(screen.getByLabelText(/nombre/i), 'Juan Pérez')
      await user.type(screen.getByLabelText(/email/i), 'juan@example.com')
      await user.type(screen.getByLabelText(/teléfono/i), '12345678901234')

      // Submit form directly using data-testid
      const form = screen.getByTestId('reservation-form')
      await act(async () => {
        fireEvent.submit(form)
      })

      await waitFor(() => {
        expect(mockCreateReservation).toHaveBeenCalledWith({
          input: {
            productId: '1',
            quantity: 1,
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '12345678901234',
            notes: undefined,
          },
        })
      })
    })
  })
})
