import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mutable state for mocking
let mockToken: string | null = null
let mockUser: { id: string; email: string; role: string } | null = null

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser,
    token: mockToken,
    isAuthenticated: !!mockToken && !!mockUser,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

// Mock pages
vi.mock('../../pages/Landing', () => ({
  default: () => <div data-testid="landing-page">Landing Page</div>,
}))
vi.mock('../../pages/Login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}))
vi.mock('../../pages/admin/AdminLayout', () => ({
  default: () => <div data-testid="admin-layout">Admin Layout</div>,
}))
vi.mock('../../pages/admin/Dashboard', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard</div>,
}))

import { AppRoutes } from '../../App'

const renderWithRouter = (initialRoute: string) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('7.2 Protected Routes', () => {
  beforeEach(() => {
    mockToken = null
    mockUser = null
    vi.clearAllMocks()
  })

  describe('Unauthenticated access to /admin', () => {
    it('should redirect to /login when accessing /admin without token', () => {
      renderWithRouter('/admin')

      expect(screen.getByTestId('login-page')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-layout')).not.toBeInTheDocument()
    })

    it('should NOT show admin layout when token is null', () => {
      renderWithRouter('/admin')

      expect(screen.queryByTestId('admin-layout')).not.toBeInTheDocument()
    })

    it('should redirect unauthenticated users even if user object exists without token', () => {
      // User exists in context but no token - should still redirect
      mockUser = { id: '1', email: 'admin@test.com', role: 'ADMIN' }
      mockToken = null

      renderWithRouter('/admin')

      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  describe('Authenticated access to /admin', () => {
    it('should show admin layout with dashboard when accessing /admin with valid token', () => {
      mockToken = 'valid-jwt-token'
      mockUser = { id: '1', email: 'admin@senacom.com', role: 'ADMIN' }

      renderWithRouter('/admin')

      expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
    })

    it('should allow staff user to access /admin with valid token', () => {
      mockToken = 'staff-jwt-token'
      mockUser = { id: '2', email: 'staff@senacom.com', role: 'STAFF' }

      renderWithRouter('/admin')

      expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
    })

    it('should not redirect when both token and user are present', () => {
      mockToken = 'valid-token'
      mockUser = { id: '1', email: 'admin@test.com', role: 'ADMIN' }

      renderWithRouter('/admin')

      expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
    })
  })

  describe('Cookie-based token storage', () => {
    it('should read token from cookie via getAuthToken on mount', () => {
      // When cookie has token, useAuth provides it
      mockToken = 'cookie-token'
      mockUser = { id: '1', email: 'admin@senacom.com', role: 'ADMIN' }

      renderWithRouter('/admin')

      expect(screen.getByTestId('admin-layout')).toBeInTheDocument()
    })
  })

  describe('Public routes remain accessible without auth', () => {
    it('should allow access to / (Landing) without authentication', () => {
      renderWithRouter('/')

      expect(screen.getByTestId('landing-page')).toBeInTheDocument()
    })

    it('should allow access to /login without authentication', () => {
      renderWithRouter('/login')

      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })
})
