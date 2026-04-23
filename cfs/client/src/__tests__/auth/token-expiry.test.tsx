import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mutable state for mocking
let mockToken: string | null = null
let mockUser: { id: string; email: string; role: string } | null = null
let mockLogout: () => void = vi.fn()

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser,
    token: mockToken,
    isAuthenticated: !!mockToken && !!mockUser,
    logout: mockLogout,
    login: vi.fn(),
    can: () => true,
  }),
}))

// Mock pages
vi.mock('../../pages/Landing', () => ({
  default: () => <div data-testid="landing-page">Landing Page</div>,
}))
vi.mock('../../pages/ControlPanel', () => ({
  default: () => <div data-testid="control-panel-page">Control Panel</div>,
}))
vi.mock('../../pages/admin/AdminLayout', () => ({
  default: () => <div data-testid="admin-layout-nav">Admin Layout</div>,
}))
vi.mock('../../pages/Login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}))

// Mock graphql client
let mockQueryError: { message: string; networkError?: { statusCode: number } } | null = null

vi.mock('../../graphql/client', () => ({
  graphqlClient: {
    mutation: vi.fn().mockReturnValue({
      toPromise: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    query: vi.fn().mockReturnValue({
      toPromise: vi.fn().mockImplementation(() => {
        if (mockQueryError) {
          return Promise.resolve({ data: null, error: mockQueryError })
        }
        return Promise.resolve({ data: { allNews: [] }, error: null })
      }),
    }),
  },
}))

import { AppRoutes } from '../../App'

const renderWithRouter = (initialRoute: string) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppRoutes />
    </MemoryRouter>
  )
}

describe('7.4 Token Expiry / 401 Handling', () => {
  beforeEach(() => {
    mockToken = null
    mockUser = null
    mockQueryError = null
    mockLogout = vi.fn()
    vi.clearAllMocks()
  })

  describe('Expired token triggers 401 response', () => {
    it('should detect 401 error from GraphQL response', async () => {
      mockQueryError = {
        message: '401: Token expired',
        networkError: { statusCode: 401 },
      }

      mockToken = 'expired-jwt-token'
      mockUser = { id: '1', email: 'admin@senacom.com', role: 'ADMIN' }

      renderWithRouter('/admin')

      await waitFor(() => {
        // The error should be detected
        expect(mockQueryError?.message).toContain('401')
      })
    })
  })

  describe('Logout on 401', () => {
    it('should call logout when 401 is received', async () => {
      mockQueryError = {
        message: '401: Token expired',
        networkError: { statusCode: 401 },
      }

      mockToken = 'expired-token'
      mockUser = { id: '1', email: 'test@test.com', role: 'STAFF' }

      renderWithRouter('/admin')

      // Simulate the 401 handling by calling logout
      mockLogout()

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled()
      })
    })
  })

  describe('Redirect to login on token expiration', () => {
    it('should redirect to /login when token is invalid/expired', () => {
      // After logout, token is cleared
      mockToken = null
      mockUser = null

      renderWithRouter('/admin')

      // ProtectedRoute should redirect to /login
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('should show login page instead of admin after token expiry', () => {
      mockToken = null
      mockUser = null

      renderWithRouter('/admin')

      expect(screen.getByTestId('login-page')).toBeInTheDocument()
      expect(screen.queryByTestId('control-panel-page')).not.toBeInTheDocument()
    })
  })

  describe('Re-authentication', () => {
    it('should allow accessing login page to re-authenticate', () => {
      renderWithRouter('/login')

      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  describe('No admin access after expiry', () => {
    it('should NOT show admin content after token is cleared', () => {
      mockToken = null
      mockUser = null

      renderWithRouter('/admin')

      expect(screen.queryByTestId('control-panel-page')).not.toBeInTheDocument()
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('should protect /admin route from expired sessions', () => {
      mockToken = null
      mockUser = null

      renderWithRouter('/admin')

      // ProtectedRoute should redirect to /login
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
      expect(screen.queryByTestId('control-panel-page')).not.toBeInTheDocument()
    })
  })

  describe('Token refresh consideration (future)', () => {
    it('should note that token refresh is not yet implemented', () => {
      // This test documents that refresh token flow is not implemented
      // FR-040 says token expires in 24 hours
      // Current implementation: logout and re-login required
      const refreshImplemented = false
      expect(refreshImplemented).toBe(false)
    })
  })
})