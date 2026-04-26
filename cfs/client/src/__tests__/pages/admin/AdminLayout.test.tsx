import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminLayout from '../../../pages/admin/AdminLayout'
import { AuthProvider } from '../../../context/AuthContext'

// Mutable state for controlling mock user
let mockUser: { id: string; email: string; role: 'ADMIN' | 'STAFF'; createdAt: string } | null =
  null
let mockCan: string[] = []

// Mock AuthContext
vi.mock('../../../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser,
    token: mockUser ? 'valid-token' : null,
    isAuthenticated: !!mockUser,
    logout: vi.fn(),
    can: (permission: string) => {
      return mockCan.includes(permission)
    },
  }),
}))

// Mock Outlet component from react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  }
})

describe('AdminLayout', () => {
  beforeEach(() => {
    mockUser = null
    mockCan = []
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the admin layout with navbar', () => {
      mockUser = {
        id: '1',
        email: 'admin@test.com',
        role: 'ADMIN',
        createdAt: '2026-04-01T00:00:00Z',
      }
      mockCan = ['product.read', 'news.read', 'event.read', 'user.read']

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLayout />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByTestId('admin-layout-nav')).toBeInTheDocument()
      expect(screen.getByText('Panel de control')).toBeInTheDocument()
    })

    it('should render logout button', () => {
      mockUser = {
        id: '1',
        email: 'admin@test.com',
        role: 'ADMIN',
        createdAt: '2026-04-01T00:00:00Z',
      }

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLayout />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByTestId('logout-button')).toBeInTheDocument()
      expect(screen.getByText('Cerrar sesión')).toBeInTheDocument()
    })
  })

  describe('Navigation links', () => {
    it('should show Dashboard link for all authenticated users', () => {
      mockUser = {
        id: '1',
        email: 'admin@test.com',
        role: 'STAFF',
        createdAt: '2026-04-01T00:00:00Z',
      }

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLayout />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should show Products link when user has product.read permission', () => {
      mockUser = {
        id: '1',
        email: 'admin@test.com',
        role: 'STAFF',
        createdAt: '2026-04-01T00:00:00Z',
      }
      mockCan = ['product.read']

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLayout />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByText('Productos')).toBeInTheDocument()
    })

    it('should hide Products link when user lacks product.read permission', () => {
      mockUser = {
        id: '1',
        email: 'staff@test.com',
        role: 'STAFF',
        createdAt: '2026-04-01T00:00:00Z',
      }
      mockCan = []

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLayout />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.queryByText('Productos')).not.toBeInTheDocument()
    })

    it('should show News link when user has news.read permission', () => {
      mockUser = {
        id: '1',
        email: 'admin@test.com',
        role: 'STAFF',
        createdAt: '2026-04-01T00:00:00Z',
      }
      mockCan = ['news.read']

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLayout />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByText('Noticias')).toBeInTheDocument()
    })

    it('should show Events link when user has event.read permission', () => {
      mockUser = {
        id: '1',
        email: 'admin@test.com',
        role: 'STAFF',
        createdAt: '2026-04-01T00:00:00Z',
      }
      mockCan = ['event.read']

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLayout />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByText('Eventos')).toBeInTheDocument()
    })

    it('should show Users link when user has user.read permission', () => {
      mockUser = {
        id: '1',
        email: 'admin@test.com',
        role: 'STAFF',
        createdAt: '2026-04-01T00:00:00Z',
      }
      mockCan = ['user.read']

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLayout />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByText('Usuarios')).toBeInTheDocument()
    })

    it('should hide Users link when user lacks user.read permission', () => {
      mockUser = {
        id: '1',
        email: 'staff@test.com',
        role: 'STAFF',
        createdAt: '2026-04-01T00:00:00Z',
      }
      mockCan = ['product.read']

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLayout />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.queryByText('Usuarios')).not.toBeInTheDocument()
    })
  })
})
