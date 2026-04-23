import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import { CartProvider } from '../../context/CartContext'

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

  const renderCatalog = () => {
    return render(
      <MemoryRouter>
        <CartProvider>
          <AuthProvider>
            <Catalog />
          </AuthProvider>
        </CartProvider>
      </MemoryRouter>
    )
  }

  describe('Product Listing', () => {
    it('should display all products with ProductCard components', () => {
      productsData = { products: mockProducts }

      renderCatalog()

      const productCards = screen.getAllByTestId(/product-card/i)
      expect(productCards.length).toBe(2)
    })

    it('should show empty catalog message when no products', () => {
      productsData = { products: [] }

      renderCatalog()

      expect(screen.getByText(/no hay productos/i)).toBeInTheDocument()
    })
  })
})