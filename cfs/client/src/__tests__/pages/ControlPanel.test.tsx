import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'

// Define types locally
interface News {
  id: string
  title: string
  content: string
  imageUrl?: string | null
  createdAt: string
  updatedAt: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  imageUrl?: string | null
  createdAt: string
  updatedAt: string
}

interface Reservation {
  id: string
  productId: string
  product: Product
  quantity: number
  name: string
  email: string
  phone: string
  notes?: string | null
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  createdAt: string
  updatedAt: string
}

interface User {
  id: string
  email: string
  role: 'ADMIN' | 'STAFF'
  createdAt: string
}

interface MockState {
  user: User | null
  newsData: { allNews: News[] } | null
  productsData: { products: Product[] } | null
  reservationsData: { reservations: Reservation[] } | null
  usersData: { users: User[] } | null
}

const mockState: MockState = {
  user: null,
  newsData: null,
  productsData: null,
  reservationsData: null,
  usersData: null,
}

vi.mock('../../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockState.user,
    token: mockState.user ? 'fake-token' : null,
    isAuthenticated: !!mockState.user,
    logout: vi.fn(),
    can: (permission: string) => {
      if (!mockState.user) return false
      // ADMIN has all permissions, STAFF has read-only user permissions
      if (mockState.user.role === 'ADMIN') return true
      // STAFF can do anything except user.create and user.delete
      if (permission.startsWith('user.') && (permission === 'user.create' || permission === 'user.delete')) {
        return false
      }
      return true
    },
  }),
}))

vi.mock('../../graphql/queries', () => ({
  useNewsQuery: () => [
    { data: mockState.newsData, fetching: false, error: null },
    (() => {}) as any,
  ] as const,
  useProductsQuery: () => [
    { data: mockState.productsData, fetching: false, error: null },
    (() => {}) as any,
  ] as const,
  useUsersQuery: () => [
    { data: mockState.usersData, fetching: false, error: null },
    (() => {}) as any,
  ] as const,
  ALL_NEWS_QUERY: '',
  RESERVATIONS_QUERY: '',
  useAllNewsQuery: () => [
    { data: mockState.newsData, fetching: false, error: null },
    (() => {}) as any,
  ] as const,
  useReservationsQuery: () => [
    { data: mockState.reservationsData, fetching: false, error: null },
    (() => {}) as any,
  ] as const,
}))

vi.mock('../../graphql/mutations', () => ({
  useCreateUserMutation: () => [
    (() => {}) as any,
    { loading: false, error: null },
  ] as const,
  useDeleteUserMutation: () => [
    (() => {}) as any,
    { loading: false, error: null },
  ] as const,
  useCreateProductMutation: () => [
    (() => {}) as any,
    { loading: false, error: null },
  ] as const,
  useUpdateProductMutation: () => [
    (() => {}) as any,
    { loading: false, error: null },
  ] as const,
  useDeleteProductMutation: () => [
    (() => {}) as any,
    { loading: false, error: null },
  ] as const,
  useCreateNewsMutation: () => [
    (() => {}) as any,
    { loading: false, error: null },
  ] as const,
  useUpdateNewsMutation: () => [
    (() => {}) as any,
    { loading: false, error: null },
  ] as const,
  useDeleteNewsMutation: () => [
    (() => {}) as any,
    { loading: false, error: null },
  ] as const,
}))

import ControlPanel from '../../pages/ControlPanel'

const mockNews: News[] = [
  {
    id: '1',
    title: 'Noticia 1',
    content: 'Contenido 1',
    imageUrl: null,
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-04-20T10:00:00Z',
  },
  {
    id: '2',
    title: 'Noticia 2',
    content: 'Contenido 2',
    imageUrl: null,
    createdAt: '2026-04-21T10:00:00Z',
    updatedAt: '2026-04-21T10:00:00Z',
  },
]

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Producto 1',
    description: 'Descripción 1',
    price: 99.99,
    stock: 10,
    imageUrl: null,
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-04-20T10:00:00Z',
  },
]

const mockReservations: Reservation[] = [
  {
    id: '1',
    productId: '1',
    product: mockProducts[0],
    quantity: 2,
    name: 'Cliente 1',
    email: 'cliente1@example.com',
    phone: '1234567890',
    notes: null,
    status: 'PENDING',
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-04-20T10:00:00Z',
  },
  {
    id: '2',
    productId: '1',
    product: mockProducts[0],
    quantity: 1,
    name: 'Cliente 2',
    email: 'cliente2@example.com',
    phone: '0987654321',
    notes: null,
    status: 'CONFIRMED',
    createdAt: '2026-04-21T10:00:00Z',
    updatedAt: '2026-04-21T10:00:00Z',
  },
]

describe('ControlPanel Page', () => {
  beforeEach(() => {
    mockState.user = { id: '1', email: 'staff@test.com', role: 'STAFF', createdAt: '2026-04-01T00:00:00Z' }
    mockState.newsData = { allNews: mockNews }
    mockState.productsData = { products: mockProducts }
    mockState.reservationsData = { reservations: mockReservations }
    mockState.usersData = null
  })

  describe('Stats Dashboard', () => {
    it('should display news count', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('stat-news-count')).toHaveTextContent('2')
    })

    it('should display pending reservations count', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('stat-pending-reservations')).toHaveTextContent('1')
    })

    it('should display product count', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('stat-product-count')).toHaveTextContent('1')
    })
  })

  describe('Recent News List', () => {
    it('should list recent news items', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      const newsItems = screen.getAllByText(/Noticia/)
      expect(newsItems.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Recent Reservations List', () => {
    it('should list recent reservations', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('Cliente 1')).toBeInTheDocument()
      expect(screen.getByText('Cliente 2')).toBeInTheDocument()
    })

    it('should show status filters', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('reservation-filter-pending')).toBeInTheDocument()
      expect(screen.getByTestId('reservation-filter-confirmed')).toBeInTheDocument()
    })
  })

  describe('User Management', () => {
    it('should NOT show user management for staff role', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByTestId('user-management-section')).not.toBeInTheDocument()
    })

    it('should show user management for admin role', () => {
      mockState.user = { id: '1', email: 'admin@test.com', role: 'ADMIN', createdAt: '2026-04-01T00:00:00Z' }

      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('user-management-section')).toBeInTheDocument()
    })

    it('should show user list for admin', () => {
      mockState.user = { id: '1', email: 'admin@test.com', role: 'ADMIN', createdAt: '2026-04-01T00:00:00Z' }
      mockState.usersData = { 
        users: [
          { id: '1', email: 'admin@test.com', role: 'ADMIN', createdAt: '2026-04-01T00:00:00Z' },
          { id: '2', email: 'staff@test.com', role: 'STAFF', createdAt: '2026-04-01T00:00:00Z' },
        ]
      }

      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('admin@test.com')).toBeInTheDocument()
      expect(screen.getByText('staff@test.com')).toBeInTheDocument()
    })

    it('should show create user form for admin', () => {
      mockState.user = { id: '1', email: 'admin@test.com', role: 'ADMIN', createdAt: '2026-04-01T00:00:00Z' }
      mockState.usersData = { users: [] }

      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('create-user-form')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument()
    })

    it('should not show delete button for self', () => {
      mockState.user = { id: '1', email: 'admin@test.com', role: 'ADMIN', createdAt: '2026-04-01T00:00:00Z' }
      mockState.usersData = { 
        users: [
          { id: '1', email: 'admin@test.com', role: 'ADMIN', createdAt: '2026-04-01T00:00:00Z' },
          { id: '2', email: 'staff@test.com', role: 'STAFF', createdAt: '2026-04-01T00:00:00Z' },
        ]
      }

      render(
        <MemoryRouter>
          <AuthProvider>
            <ControlPanel />
          </AuthProvider>
        </MemoryRouter>
      )

      // The admin@test.com row (self) should not have a delete button
      const rows = screen.getAllByRole('listitem')
      const adminRow = rows.find(row => row.textContent?.includes('admin@test.com'))
      expect(adminRow?.querySelector('[data-testid="delete-user-btn"]')).not.toBeInTheDocument()
    })
  })
})