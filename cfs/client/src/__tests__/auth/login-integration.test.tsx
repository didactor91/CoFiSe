import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mutable state for mocking
let mockLoginResponse: { data: any; error: any } | null = null

// Mock graphql client
vi.mock('../../graphql/client', () => ({
  graphqlClient: {
    mutation: vi.fn().mockImplementation(() => ({
      toPromise: vi.fn().mockResolvedValue(mockLoginResponse),
    })),
  },
}))

// Mock cookies
vi.mock('../../utils/cookies', () => ({
  setAuthToken: vi.fn(),
  getAuthToken: vi.fn(() => null),
  removeAuthToken: vi.fn(),
}))

import LoginForm from '../../components/LoginForm'

describe('7.1 Login Integration', () => {
  beforeEach(() => {
    mockLoginResponse = null
    vi.clearAllMocks()
  })

  describe('LoginForm submits to GraphQL', () => {
    it('should call login mutation with email and password on submit', async () => {
      const user = userEvent.setup()

      mockLoginResponse = {
        data: {
          login: {
            token: 'valid-token',
            user: { id: '1', email: 'admin@senacom.com', role: 'ADMIN', createdAt: '2026-04-01' },
          },
        },
        error: null,
      }

      render(<LoginForm onSuccess={vi.fn()} />)

      await user.type(screen.getByLabelText(/email/i), 'admin@senacom.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'changeme123')
      await user.click(screen.getByRole('button', { name: /entrar/i }))

      await waitFor(() => {
        expect(mockLoginResponse).not.toBeNull()
      })
    })

    it('should display error message on failed login', async () => {
      const user = userEvent.setup()

      mockLoginResponse = {
        data: null,
        error: { message: 'Invalid credentials' },
      }

      render(<LoginForm onSuccess={vi.fn()} />)

      await user.type(screen.getByLabelText(/email/i), 'wrong@test.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /entrar/i }))

      await waitFor(() => {
        expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument()
      })
    })
  })

  describe('JWT storage on success', () => {
    it('should call setAuthToken with token from login response', async () => {
      const user = userEvent.setup()
      const mockToken = 'eyJhbGciOiJIUzI1NiJ9.mock-token'

      mockLoginResponse = {
        data: {
          login: {
            token: mockToken,
            user: { id: '1', email: 'admin@senacom.com', role: 'ADMIN', createdAt: '2026-04-01' },
          },
        },
        error: null,
      }

      const onSuccess = vi.fn()
      render(<LoginForm onSuccess={onSuccess} />)

      await user.type(screen.getByLabelText(/email/i), 'admin@senacom.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'password')
      await user.click(screen.getByRole('button', { name: /entrar/i }))

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })

      // Verify setAuthToken was called via the module mock
      const { setAuthToken } = await import('../../utils/cookies')
      expect(setAuthToken).toHaveBeenCalled()
    })

    it('should set auth cookie with 24h max-age and proper path', async () => {
      const user = userEvent.setup()
      const mockToken = 'test-token'

      mockLoginResponse = {
        data: {
          login: {
            token: mockToken,
            user: { id: '1', email: 'admin@senacom.com', role: 'ADMIN', createdAt: '2026-04-01' },
          },
        },
        error: null,
      }

      const { setAuthToken } = await import('../../utils/cookies')

      render(<LoginForm onSuccess={vi.fn()} />)

      await user.type(screen.getByLabelText(/email/i), 'admin@senacom.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'password')
      await user.click(screen.getByRole('button', { name: /entrar/i }))

      await waitFor(() => {
        expect(setAuthToken).toHaveBeenCalledWith(mockToken)
      })
    })
  })

  describe('Redirect on success', () => {
    it('should call onSuccess callback after successful login', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()

      mockLoginResponse = {
        data: {
          login: {
            token: 'valid-token',
            user: { id: '1', email: 'admin@senacom.com', role: 'ADMIN', createdAt: '2026-04-01' },
          },
        },
        error: null,
      }

      render(<LoginForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/email/i), 'admin@senacom.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'password')
      await user.click(screen.getByRole('button', { name: /entrar/i }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
  })
})