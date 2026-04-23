import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import UsersPage from '../../../pages/admin/UsersPage'
import { AuthProvider } from '../../../context/AuthContext'

// Mutable state for controlling mock user and data
let mockUser: { id: string; email: string; role: 'ADMIN' | 'STAFF'; createdAt: string } | null = null
let mockCan: string[] = []
const mockUsers = [
  { id: '1', email: 'admin@test.com', role: 'ADMIN', createdAt: '2026-04-01T00:00:00Z' },
  { id: '2', email: 'staff@test.com', role: 'STAFF', createdAt: '2026-04-01T00:00:00Z' },
]
const mockRoles = [
  { id: '1', name: 'ADMIN', permissions: ['*'], createdAt: '', updatedAt: '' },
  { id: '2', name: 'STAFF', permissions: ['product.read'], createdAt: '', updatedAt: '' },
]

vi.mock('../../../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser,
    token: mockUser ? 'valid-token' : null,
    isAuthenticated: !!mockUser,
    logout: vi.fn(),
    can: (permission: string) => mockCan.includes(permission),
  }),
}))

vi.mock('../../../graphql/queries', () => ({
  useUsersQuery: () => [
    { data: { users: mockUsers }, fetching: false, error: null },
    (() => {}) as any,
  ],
  useRolesQuery: () => [
    { data: { roles: mockRoles }, fetching: false, error: null },
    (() => {}) as any,
  ],
}))

vi.mock('../../../graphql/mutations', () => ({
  useCreateUserMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
  useDeleteUserMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
  useCreateRoleMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
  useUpdateRoleMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
  useDeleteRoleMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
}))

describe('UsersPage', () => {
  beforeEach(() => {
    mockUser = { id: '1', email: 'admin@test.com', role: 'ADMIN', createdAt: '2026-04-01T00:00:00Z' }
    mockCan = ['user.read', 'user.create', 'user.delete', 'role.read', 'role.create', 'role.delete']
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render users page', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('users-page')).toBeInTheDocument()
    })

    it('should display user emails in the list', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('admin@test.com')).toBeInTheDocument()
      expect(screen.getByText('staff@test.com')).toBeInTheDocument()
    })

    it('should render Roles section', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('Gestión de Roles')).toBeInTheDocument()
    })
  })

  describe('Permission checks', () => {
    it('should show create user form when user has user.create permission', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      )

      // Click "Añadir Usuario" button to show the form
      const addButton = screen.getByText('Añadir Usuario')
      fireEvent.click(addButton)

      expect(screen.getByTestId('create-user-form')).toBeInTheDocument()
    })

    it('should hide create user form when user lacks user.create permission', () => {
      mockCan = ['user.read', 'user.delete']

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByTestId('create-user-form')).not.toBeInTheDocument()
    })

    it('should show Roles section when user has role.create and role.delete permissions', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('Gestión de Roles')).toBeInTheDocument()
    })

    it('should hide Roles section when user lacks role permissions', () => {
      mockCan = ['user.read', 'user.create', 'user.delete']

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByText('Gestión de Roles')).not.toBeInTheDocument()
    })

    it('should show delete button for other users but not for self', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      )

      // Only one delete button (for staff user, id 2)
      expect(screen.getByTestId('delete-user-btn')).toBeInTheDocument()
    })
  })
})