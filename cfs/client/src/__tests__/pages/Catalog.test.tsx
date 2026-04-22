import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import userEvent from '@testing-library/user-event'

// Define types locally
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

// Mutable state for mocking
let productsData: { products: Product[] } | null = null

vi.mock('../../graphql/queries', () => ({
  PRODUCTS_QUERY: '',
  useProductsQuery: () => {
    return [
      { data: productsData, fetching: false, error: null },
      (() => {}) as any,
    ] as const
  },
}))

// Mock ReservationForm to avoid urql client issues
vi.mock('../../components/ReservationForm', () => ({
  default: function MockReservationForm({ product }: { product: Product; onSuccess?: () => void }) {
    return (
      <div data-testid="reservation-form">
        <span>Reservar: {product.name}</span>
        <button data-testid="close-form" onClick={() => {}}>
          ← Volver al catálogo
        </button>
      </div>
    )
  },
}))

import Catalog from '../../pages/Catalog'

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Producto 1',
    description: 'Descripción del producto 1',
    price: 99.99,
    stock: 10,
    imageUrl: null,
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-04-20T10:00:00Z',
  },
  {
    id: '2',
    name: 'Producto 2',
    description: 'Descripción del producto 2',
    price: 149.99,
    stock: 5,
    imageUrl: null,
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-04-20T10:00:00Z',
  },
]

describe('Catalog Page', () => {
  beforeEach(() => {
    productsData = null
  })

  describe('Product Listing', () => {
    it('should display all products with ProductCard components', () => {
      productsData = { products: mockProducts }

      render(
        <MemoryRouter>
          <AuthProvider>
            <Catalog />
          </AuthProvider>
        </MemoryRouter>
      )

      const productCards = screen.getAllByTestId(/product-card/i)
      expect(productCards.length).toBe(2)
    })

    it('should show empty catalog message when no products', () => {
      productsData = { products: [] }

      render(
        <MemoryRouter>
          <AuthProvider>
            <Catalog />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText(/no hay productos/i)).toBeInTheDocument()
    })
  })

  describe('Product Detail', () => {
    it('should show reservation form when product is clicked', async () => {
      const user = userEvent.setup()
      productsData = { products: mockProducts }

      render(
        <MemoryRouter>
          <AuthProvider>
            <Catalog />
          </AuthProvider>
        </MemoryRouter>
      )

      // Find and click the first product card
      const firstProductCard = screen.getByTestId('product-card-1')
      await act(async () => {
        await user.click(firstProductCard)
      })

      // After clicking, reservation form should be shown
      expect(screen.getByTestId('reservation-form')).toBeInTheDocument()
      expect(screen.getByText('Reservar: Producto 1')).toBeInTheDocument()
    })

    it('should return to catalog when closing reservation form', async () => {
      const user = userEvent.setup()
      productsData = { products: mockProducts }

      render(
        <MemoryRouter>
          <AuthProvider>
            <Catalog />
          </AuthProvider>
        </MemoryRouter>
      )

      // Click product to open reservation form
      const firstProductCard = screen.getByTestId('product-card-1')
      await act(async () => {
        await user.click(firstProductCard)
      })

      // Click back button (the first one is the real Catalog button, not the mocked ReservationForm)
      const backButtons = screen.getAllByRole('button', { name: /volver al catálogo/i })
      await act(async () => {
        await user.click(backButtons[0])
      })

      // Should be back to catalog with product cards
      const productCards = screen.getAllByTestId(/product-card/i)
      expect(productCards.length).toBe(2)
    })
  })
})