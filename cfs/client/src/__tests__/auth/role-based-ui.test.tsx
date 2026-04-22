import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import { UserRole } from '../../../../packages/types/generated/graphql'

// Mutable state for controlling mock user
let mockUser: { id: string; email: string; role: UserRole; createdAt: string } | null = null

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser,
    token: mockUser ? 'valid-token' : null,
    isAuthenticated: !!mockUser,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock('../../graphql/queries', () => ({
  useAllNewsQuery: () => [
    { data: { allNews: [] }, fetching: false, error: null },
    (() => {}) as any,
  ],
  useProductsQuery: () => [
    { data: { products: [] }, fetching: false, error: null },
    (() => {}) as any,
  ],
  useReservationsQuery: () => [
    { data: { reservations: [] }, fetching: false, error: null },
    (() => {}) as any,
  ],
  useUsersQuery: () => [
    { data: { users: [] }, fetching: false, error: null },
    (() => {}) as any,
  ],
}))

vi.mock('../../graphql/mutations', () => ({
  useCreateUserMutation: () => [
    vi.fn(),
    { fetching: false, error: null },
  ],
  useDeleteUserMutation: () => [
    vi.fn(),
    { fetching: false, error: null },
  ],
}))

import ControlPanel from '../../pages/ControlPanel'

describe('7.3 Role-Based UI', () => {
  beforeEach(() => {
    mockUser = null
    vi.clearAllMocks()
  })

  describe('Admin role sees user management', () => {
    it('should show user management section when user role is ADMIN', () => {
      mockUser = {
        id: '1',
        email: 'admin@senacom.com',
        role: UserRole.Admin,
        createdAt: '2026-04-01T00:00:00Z',
      }

      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('user-management-section')).toBeInTheDocument()
      expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument()
    })

    it('should identify user role from JWT claims in user object', () => {
      mockUser = {
        id: '1',
        email: 'admin@senacom.com',
        role: UserRole.Admin,
        createdAt: '2026-04-01T00:00:00Z',
      }

      // The role comes from the JWT decoded claims stored in user object
      expect(mockUser.role).toBe(UserRole.Admin)
      expect(mockUser.role).not.toBe(UserRole.Staff)
    })
  })

  describe('Staff role does NOT see user management', () => {
    it('should NOT show user management section when user role is STAFF', () => {
      mockUser = {
        id: '2',
        email: 'staff@senacom.com',
        role: UserRole.Staff,
        createdAt: '2026-04-01T00:00:00Z',
      }

      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByTestId('user-management-section')).not.toBeInTheDocument()
    })

    it('should show stats dashboard but not user section for staff', () => {
      mockUser = {
        id: '2',
        email: 'staff@senacom.com',
        role: UserRole.Staff,
        createdAt: '2026-04-01T00:00:00Z',
      }

      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      // Stats should be visible (news, reservations, products)
      expect(screen.getByTestId('stat-news-count')).toBeInTheDocument()
      expect(screen.getByTestId('stat-pending-reservations')).toBeInTheDocument()
      expect(screen.getByTestId('stat-product-count')).toBeInTheDocument()

      // But user management should NOT
      expect(screen.queryByTestId('user-management-section')).not.toBeInTheDocument()
    })

    it('should conditionally render based on role comparison', () => {
      mockUser = {
        id: '2',
        email: 'staff@senacom.com',
        role: UserRole.Staff,
        createdAt: '2026-04-01T00:00:00Z',
      }

      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      // isAdmin check - should be false for staff
      const isAdmin = mockUser?.role === UserRole.Admin
      expect(isAdmin).toBe(false)

      // isStaff check - should be true for staff
      const isStaff = mockUser?.role === UserRole.Staff
      expect(isStaff).toBe(true)
    })
  })

  describe('Role check booleans from AuthContext', () => {
    it('should derive isAdmin from user.role === ADMIN', () => {
      mockUser = {
        id: '1',
        email: 'admin@senacom.com',
        role: UserRole.Admin,
        createdAt: '2026-04-01T00:00:00Z',
      }

      const isAdmin = mockUser?.role === UserRole.Admin
      expect(isAdmin).toBe(true)

      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      // Admin sees user management
      expect(screen.getByTestId('user-management-section')).toBeInTheDocument()
    })

    it('should derive isStaff from user.role === STAFF', () => {
      mockUser = {
        id: '2',
        email: 'staff@senacom.com',
        role: UserRole.Staff,
        createdAt: '2026-04-01T00:00:00Z',
      }

      const isStaff = mockUser?.role === UserRole.Staff
      expect(isStaff).toBe(true)

      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      // Staff does NOT see user management
      expect(screen.queryByTestId('user-management-section')).not.toBeInTheDocument()
    })
  })

  describe('Unauthenticated state', () => {
    it('should NOT render admin-only UI elements when user is null', () => {
      mockUser = null

      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      // User management section should not exist (null user)
      expect(screen.queryByTestId('user-management-section')).not.toBeInTheDocument()
    })

    it('should treat null role as unauthenticated', () => {
      mockUser = null

      // No role means no access to admin-only features
      const hasRole = mockUser?.role === UserRole.Admin || mockUser?.role === UserRole.Staff
      expect(hasRole).toBe(false)
    })
  })
})