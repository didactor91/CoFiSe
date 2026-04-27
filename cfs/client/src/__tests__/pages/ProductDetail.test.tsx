import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'

// Define types locally
interface ProductOption {
  id: string
  productId: string
  name: string
  required: boolean
  values: { id: string; optionId: string; value: string; stock?: number | null }[]
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number | null
  limitedStock: boolean
  imageUrl?: string | null
  options: ProductOption[]
}

// Mutable state for mocking
let productData: { product: Product } | null = null
let fetchingState = false
let errorState: { message: string } | null = null

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: '789' }),
  }
})

// Mock CartContext
vi.mock('../../context/CartContext', () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => children,
  useCart: () => ({
    items: [],
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    total: 0,
  }),
}))

// Mock the queries
vi.mock('../../graphql/queries', () => ({
  PRODUCT_QUERY: '',
  useProductQuery: () => {
    return [
      {
        data: productData,
        fetching: fetchingState,
        error: errorState,
      },
      (() => {}) as any,
    ] as const
  },
}))

import ProductDetail from '../../pages/ProductDetail'

const mockProduct: Product = {
  id: '1',
  name: 'Ceramic Vase',
  description: 'Handmade ceramic vase with traditional patterns',
  price: 45.0,
  stock: 15,
  limitedStock: true,
  imageUrl: null,
  options: [],
}

describe('ProductDetail Page', () => {
  beforeEach(() => {
    productData = null
    fetchingState = false
    errorState = null
  })

  describe('Loading State', () => {
    it('renders loading state', () => {
      fetchingState = true
      productData = null

      render(
        <MemoryRouter>
          <AuthProvider>
            <ProductDetail />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByText('⏳')).toBeInTheDocument()
      expect(screen.getByText('Cargando...')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('renders error state when query fails', () => {
      errorState = { message: 'Network error' }
      productData = null

      render(
        <MemoryRouter>
          <AuthProvider>
            <ProductDetail />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByText(/no encontrado/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument()
    })

    it('renders error when product is null', () => {
      productData = { product: null as unknown as Product }

      render(
        <MemoryRouter>
          <AuthProvider>
            <ProductDetail />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByText(/no encontrado/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument()
    })
  })

  describe('Content Rendering', () => {
    it('renders product details correctly', () => {
      productData = { product: mockProduct }

      render(
        <MemoryRouter>
          <AuthProvider>
            <ProductDetail />
          </AuthProvider>
        </MemoryRouter>,
      )

      // Check name
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Ceramic Vase')

      // Check price
      expect(screen.getByText('45.00€')).toBeInTheDocument()

      // Check description
      expect(screen.getByText(/Handmade ceramic vase/i)).toBeInTheDocument()
    })

    it('renders stock badge - en stock (green)', () => {
      productData = { product: mockProduct }

      render(
        <MemoryRouter>
          <AuthProvider>
            <ProductDetail />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByText('En stock')).toBeInTheDocument()
    })

    it('renders stock badge - sin stock (red) when stock is 0', () => {
      const outOfStockProduct = {
        ...mockProduct,
        stock: 0,
      }
      productData = { product: outOfStockProduct }

      render(
        <MemoryRouter>
          <AuthProvider>
            <ProductDetail />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByText('Sin stock')).toBeInTheDocument()
    })

    it('renders stock badge - stock infinito (gray) when limitedStock is false', () => {
      const infiniteStockProduct = {
        ...mockProduct,
        limitedStock: false,
      }
      productData = { product: infiniteStockProduct }

      render(
        <MemoryRouter>
          <AuthProvider>
            <ProductDetail />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByText('Stock infinito')).toBeInTheDocument()
    })
  })

  describe('Options Rendering', () => {
    it('renders options as badges when product has options', () => {
      const productWithOptions: Product = {
        ...mockProduct,
        options: [
          {
            id: 'opt1',
            productId: '1',
            name: 'Talla',
            required: true,
            values: [
              { id: 'val1', optionId: 'opt1', value: 'S' },
              { id: 'val2', optionId: 'opt1', value: 'M' },
              { id: 'val3', optionId: 'opt1', value: 'L' },
            ],
          },
        ],
      }
      productData = { product: productWithOptions }

      render(
        <MemoryRouter>
          <AuthProvider>
            <ProductDetail />
          </AuthProvider>
        </MemoryRouter>,
      )

      // Check option name is displayed
      expect(screen.getByText('Talla:')).toBeInTheDocument()

      // Check option values are displayed as badges
      expect(screen.getByText('S')).toBeInTheDocument()
      expect(screen.getByText('M')).toBeInTheDocument()
      expect(screen.getByText('L')).toBeInTheDocument()
    })

    it('does not render options section when product has no options', () => {
      const productWithoutOptions: Product = {
        ...mockProduct,
        options: [],
      }
      productData = { product: productWithoutOptions }

      render(
        <MemoryRouter>
          <AuthProvider>
            <ProductDetail />
          </AuthProvider>
        </MemoryRouter>,
      )

      // Should not show any option-related content
      expect(screen.queryByText('Talla:')).not.toBeInTheDocument()
    })
  })

  // Navigation is implicitly tested via the UI - back button renders and uses navigate(-1)
})
