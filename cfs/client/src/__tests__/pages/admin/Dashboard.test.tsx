import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../../../pages/admin/Dashboard'
import { AuthProvider } from '../../../context/AuthContext'

// Mock user
const mockUser = { id: '1', email: 'admin@test.com', role: 'ADMIN' as const, createdAt: '2026-04-01T00:00:00Z' }

// Mock data
const mockNews = [
  { id: '1', title: 'News 1', content: 'Content 1', imageUrl: null, createdAt: '', updatedAt: '' },
  { id: '2', title: 'News 2', content: 'Content 2', imageUrl: null, createdAt: '', updatedAt: '' },
]
const mockProducts = [
  { id: '1', name: 'Product 1', description: 'Desc 1', price: 10, stock: 5, imageUrl: null, createdAt: '', updatedAt: '', limitedStock: true, options: [] },
]
const mockReservations = [
  {
    id: '1', productId: '1', quantity: 2, name: 'Customer 1', email: 'c1@test.com',
    phone: '123', notes: null, status: 'PENDING' as const,
    createdAt: '', updatedAt: '',
    product: { id: '1', name: 'Product 1', description: '', price: 10, stock: 5, imageUrl: null, createdAt: '', updatedAt: '' }
  },
  {
    id: '2', productId: '1', quantity: 1, name: 'Customer 2', email: 'c2@test.com',
    phone: '456', notes: null, status: 'CONFIRMED' as const,
    createdAt: '', updatedAt: '',
    product: { id: '1', name: 'Product 1', description: '', price: 10, stock: 5, imageUrl: null, createdAt: '', updatedAt: '' }
  },
]

vi.mock('../../../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser,
    token: 'valid-token',
    isAuthenticated: true,
    logout: vi.fn(),
    can: () => true,
  }),
}))

vi.mock('../../../graphql/queries', () => ({
  useAllNewsQuery: () => [
    { data: { allNews: mockNews }, fetching: false, error: null },
    (() => {}) as any,
  ],
  useProductsQuery: () => [
    { data: { products: mockProducts }, fetching: false, error: null },
    (() => {}) as any,
  ],
  useReservationsQuery: () => [
    { data: { reservations: mockReservations }, fetching: false, error: null },
    (() => {}) as any,
  ],
}))

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render dashboard page', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
  })

  it('should render stats cards with correct testids', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByTestId('stat-news-count')).toBeInTheDocument()
    expect(screen.getByTestId('stat-pending-reservations')).toBeInTheDocument()
    expect(screen.getByTestId('stat-product-count')).toBeInTheDocument()
  })

  it('should render reservation filter buttons', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByTestId('reservation-filter-pending')).toBeInTheDocument()
    expect(screen.getByTestId('reservation-filter-confirmed')).toBeInTheDocument()
    expect(screen.getByTestId('reservation-filter-all')).toBeInTheDocument()
  })

  it('should render sections for news and reservations', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Noticias Recientes')).toBeInTheDocument()
    expect(screen.getByText('Reservas Recientes')).toBeInTheDocument()
  })

  it('should display news count from query data', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    )

    // News count is 2 (mockNews has 2 items)
    expect(screen.getByTestId('stat-news-count')).toHaveTextContent('2')
  })

  it('should display product count from query data', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    )

    // Products count is 1 (mockProducts has 1 item)
    expect(screen.getByTestId('stat-product-count')).toHaveTextContent('1')
  })

  it('should display pending reservations count', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    )

    // Pending count is 1 (mockReservations has 1 PENDING out of 2 total)
    expect(screen.getByTestId('stat-pending-reservations')).toHaveTextContent('1')
  })

  it('should show all reservations by default', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </MemoryRouter>
    )

    // Both customers should be visible
    expect(screen.getByText('Customer 1')).toBeInTheDocument()
    expect(screen.getByText('Customer 2')).toBeInTheDocument()
  })
})