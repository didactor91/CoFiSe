import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mutable state for mocking
let mockLogin: any = null
let loginError: string | null = null

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

vi.mock('../../utils/cookies', () => ({
  setAuthToken: vi.fn(),
  getAuthToken: vi.fn(() => null),
  removeAuthToken: vi.fn(),
}))

import LoginForm from '../../components/LoginForm'

describe('LoginForm Component', () => {
  beforeEach(() => {
    loginError = null
  })

  describe('Form Fields', () => {
    it('should render email and password fields', () => {
      mockLogin = vi.fn()
      render(<LoginForm onSuccess={vi.fn()} />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    })

    it('should render submit button', () => {
      mockLogin = vi.fn()
      render(<LoginForm onSuccess={vi.fn()} />)

      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
    })
  })

  describe('Login Functionality', () => {
    it('should call login on submit with credentials', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()
      mockLogin = vi.fn().mockResolvedValue(undefined)

      render(<LoginForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/email/i), 'admin@test.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'password123')
      await user.click(screen.getByRole('button', { name: /entrar/i }))

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'password123')
      })
    })

    it('should show error on failed login', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()
      mockLogin = vi.fn().mockRejectedValue(new Error('Credenciales inválidas'))

      render(<LoginForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/email/i), 'wrong@test.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /entrar/i }))

      await waitFor(() => {
        expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument()
      })
    })

    it('should call onSuccess on successful login', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()
      mockLogin = vi.fn().mockResolvedValue(undefined)

      render(<LoginForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/email/i), 'admin@test.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'correctpassword')
      await user.click(screen.getByRole('button', { name: /entrar/i }))

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
  })
})
