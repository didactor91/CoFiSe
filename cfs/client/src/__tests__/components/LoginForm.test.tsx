import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mutable state for mocking
let loginCalled = false
let loginCredentials: { email: string; password: string } | null = null
let loginError: string | null = null

vi.mock('../../graphql/client', () => ({
  graphqlClient: {
    mutation: vi.fn().mockImplementation((query: string, variables: { email: string; password: string }) => ({
      toPromise: vi.fn().mockImplementation(() => {
        loginCalled = true
        loginCredentials = variables

        if (loginError) {
          return Promise.resolve({ data: null, error: { message: loginError } })
        }

        return Promise.resolve({
          data: {
            login: {
              token: 'fake-jwt-token',
              user: {
                id: '1',
                email: variables.email,
                role: 'STAFF',
                createdAt: new Date().toISOString(),
              },
            },
          },
          error: null,
        })
      }),
    })),
  },
}))

vi.mock('../../utils/cookies', () => ({
  setAuthToken: vi.fn(),
  getAuthToken: vi.fn(() => null),
  removeAuthToken: vi.fn(),
}))

import LoginForm from '../../components/LoginForm'

describe('LoginForm Component', () => {
  beforeEach(() => {
    loginCalled = false
    loginCredentials = null
    loginError = null
  })

  describe('Form Fields', () => {
    it('should render email and password fields', () => {
      render(<LoginForm onSuccess={vi.fn()} />)

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    })

    it('should render submit button', () => {
      render(<LoginForm onSuccess={vi.fn()} />)

      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
    })
  })

  describe('Login Functionality', () => {
    it('should call login mutation on submit', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()

      render(<LoginForm onSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/email/i), 'admin@test.com')
      await user.type(screen.getByLabelText(/contraseña/i), 'password123')
      await user.click(screen.getByRole('button', { name: /entrar/i }))

      await waitFor(() => {
        expect(loginCalled).toBe(true)
        expect(loginCredentials).toEqual({
          email: 'admin@test.com',
          password: 'password123',
        })
      })
    })

    it('should show error on failed login', async () => {
      const user = userEvent.setup()
      const mockOnSuccess = vi.fn()
      loginError = 'Credenciales inválidas'

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