import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mutable state for mocking
let mockLogin: any = vi.fn()

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    login: mockLogin,
    user: null,
    token: null,
    isAuthenticated: false,
  }),
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
    mockLogin = vi.fn()
    vi.clearAllMocks()
  })

  describe('LoginForm submits to AuthContext', () => {
    it('should call login with email and password on submit', async () => {
      const user = userEvent.setup()
      mockLogin.mockResolvedValue(undefined)

      render(<LoginForm onSuccess={vi.fn()} />)

      await user.type(screen.getByLabelText(/email/i), 'admin@senacom.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'changeme123')
      await user.click(screen.getByRole('button', { name: /entrar/i }))

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('admin@senacom.com', 'changeme123')
      })
    })

    it('should display error message on failed login', async () => {
      const user = userEvent.setup()
      mockLogin.mockRejectedValue(new Error('Credenciales inválidas'))

      render(<LoginForm onSuccess={vi.fn()} />)

      await user.type(screen.getByLabelText(/email/i), 'wrong@test.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /entrar/i }))

      await waitFor(() => {
        expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument()
      })
    })
  })

  describe('Redirect on success', () => {
    it('should call onSuccess callback after successful login', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()
      mockLogin.mockResolvedValue(undefined)

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
