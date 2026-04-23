import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProductsPage from '../../../pages/admin/ProductsPage'
import { AuthProvider } from '../../../context/AuthContext'

// Mutable state for controlling mock user and data
let mockUser: { id: string; email: string; role: 'ADMIN' | 'STAFF'; createdAt: string } | null = null
let mockCan: string[] = []
const mockProducts = [{ id: '1', name: 'Test Product', description: 'Description', price: 99.99, stock: 10, imageUrl: null, createdAt: '', updatedAt: '', limitedStock: false, options: [] }]

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
  useProductsQuery: () => [
    { data: { products: mockProducts }, fetching: false, error: null },
    (() => {}) as any,
  ],
  useReservationsQuery: () => [
    { data: { reservations: [] }, fetching: false, error: null },
    (() => {}) as any,
  ],
}))

vi.mock('../../../graphql/mutations', () => ({
  useCreateProductMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
  useUpdateProductMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
  useDeleteProductMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
  useCreateProductOptionMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
  useAddOptionValuesMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
  useDeleteProductOptionMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
}))

describe('ProductsPage', () => {
  beforeEach(() => {
    mockUser = { id: '1', email: 'admin@test.com', role: 'ADMIN', createdAt: '2026-04-01T00:00:00Z' }
    mockCan = ['product.read', 'product.create', 'product.update', 'product.delete']
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render products page', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <ProductsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('products-page')).toBeInTheDocument()
    })

    it('should display product name in the list', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <ProductsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('Test Product')).toBeInTheDocument()
    })
  })

  describe('Permission checks', () => {
    it('should show add product button when user has product.create permission', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <ProductsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('Añadir Producto')).toBeInTheDocument()
    })

    it('should hide add product button when user lacks product.create permission', () => {
      mockCan = ['product.read', 'product.update', 'product.delete']

      render(
        <MemoryRouter>
          <AuthProvider>
            <ProductsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByText('Añadir Producto')).not.toBeInTheDocument()
    })

    it('should show edit button when user has product.update permission', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <ProductsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('edit-product-btn-1')).toBeInTheDocument()
    })

    it('should hide edit button when user lacks product.update permission', () => {
      mockCan = ['product.read', 'product.create', 'product.delete']

      render(
        <MemoryRouter>
          <AuthProvider>
            <ProductsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByTestId('edit-product-btn-1')).not.toBeInTheDocument()
    })
  })
})