import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CartProvider } from '../../context/CartContext'
import CartDrawer from '../../components/CartDrawer'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    getStore: () => store,
    setStore: (s: Record<string, string>) => { store = s },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock crypto.randomUUID
const randomUUIDMock = vi.fn(() => 'test-uuid-1234')
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: randomUUIDMock },
  configurable: true,
})

// Mock graphql client
const mockToPromise = vi.fn()
vi.mock('../../graphql/client', () => ({
  graphqlClient: {
    query: vi.fn().mockImplementation(() => ({
      toPromise: mockToPromise,
    })),
  },
}))

// Mock theme
vi.mock('../../theme', () => ({
  default: {
    colors: {
      accent: '#d4af37',
      text: '#f5f5f5',
      textSecondary: '#a0a0a0',
      border: '#262626',
      surface: '#141414',
      background: '#0a0a0a',
      success: '#22c55e',
      error: '#ef4444',
      disabled: '#4a4a4a',
      disabledText: '#888888',
    },
    typography: {
      fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.25rem', xl: '1.5rem' },
      fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
    },
    spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
    borderRadius: { sm: '4px', md: '8px', lg: '12px' },
  },
}))

// Helper to preload cart and mock products so items aren't filtered as stale
const preloadCartWithProducts = (items: Array<{
  id: string
  productId: string
  productName: string
  productPrice: number
  optionValueId: string | null
  optionValueName: string | null
  quantity: number
}>) => {
  localStorageMock.setStore({
    senocom_cart: JSON.stringify({ items, sessionId: 'test-session' }),
    senocom_cart_session: 'test-session',
  })
  // Mock GraphQL to return all productIds from the cart
  const productIds = [...new Set(items.map(i => i.productId))]
  mockToPromise.mockResolvedValue({
    data: { products: productIds.map(id => ({ id })) },
    error: undefined,
  })
}

describe('CartDrawer', () => {
  beforeEach(() => {
    localStorageMock.clear()
    localStorageMock.setStore({})
    randomUUIDMock.mockReturnValue('test-uuid-1234')
    mockToPromise.mockReset()
    mockToPromise.mockResolvedValue({
      data: { products: [] },
      error: undefined,
    })
  })

  describe('Rendering', () => {
    it('should render "Tu Carrito" header when open', async () => {
      preloadCartWithProducts([])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={vi.fn()} />
        </CartProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Tu Carrito')).toBeInTheDocument()
      })
    })

    it('should show close button', async () => {
      preloadCartWithProducts([])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={vi.fn()} />
        </CartProvider>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
      })
    })

    it('should not render the drawer when isOpen is false', async () => {
      preloadCartWithProducts([])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={false} onClose={vi.fn()} />
        </CartProvider>
      )

      // When closed, the drawer header should not be visible
      await waitFor(() => {
        expect(screen.queryByText('Tu Carrito')).toBeNull()
      })
    })
  })

  describe('Empty cart', () => {
    it('should show empty message when cart has no items', async () => {
      preloadCartWithProducts([])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={vi.fn()} />
        </CartProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
      })
    })
  })

  describe('Cart with items', () => {
    it('should display product name for item without options', async () => {
      preloadCartWithProducts([{
        id: 'item-1',
        productId: 'p1',
        productName: 'Gorro',
        productPrice: 15.00,
        optionValueId: null,
        optionValueName: null,
        quantity: 1,
      }])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={vi.fn()} />
        </CartProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Gorro')).toBeInTheDocument()
      })
    })

    it('should display product name + selected option value', async () => {
      preloadCartWithProducts([{
        id: 'item-1',
        productId: 'p2',
        productName: 'Corbata',
        productPrice: 25.00,
        optionValueId: 'ov1',
        optionValueName: 'Rojo',
        quantity: 1,
      }])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={vi.fn()} />
        </CartProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Corbata')).toBeInTheDocument()
        expect(screen.getByText('Rojo')).toBeInTheDocument()
      })
    })

    it('should display quantity controls (+/- buttons)', async () => {
      preloadCartWithProducts([{
        id: 'item-1',
        productId: 'p1',
        productName: 'Gorro',
        productPrice: 15.00,
        optionValueId: null,
        optionValueName: null,
        quantity: 1,
      }])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={vi.fn()} />
        </CartProvider>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '-' })).toBeInTheDocument()
      })
    })

    it('should display delete button', async () => {
      preloadCartWithProducts([{
        id: 'item-1',
        productId: 'p1',
        productName: 'Gorro',
        productPrice: 15.00,
        optionValueId: null,
        optionValueName: null,
        quantity: 1,
      }])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={vi.fn()} />
        </CartProvider>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()
      })
    })

    it('should display subtotal (price × quantity)', async () => {
      preloadCartWithProducts([{
        id: 'item-1',
        productId: 'p1',
        productName: 'Gorro',
        productPrice: 15.00,
        optionValueId: null,
        optionValueName: null,
        quantity: 2,
      }])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={vi.fn()} />
        </CartProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('30.00€')).toBeInTheDocument()
      })
    })
  })

  describe('Cart footer', () => {
    it('should display total items count', async () => {
      preloadCartWithProducts([{
        id: 'item-1',
        productId: 'p1',
        productName: 'Gorro',
        productPrice: 15.00,
        optionValueId: null,
        optionValueName: null,
        quantity: 2,
      }])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={vi.fn()} />
        </CartProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/2 artículos/)).toBeInTheDocument()
      })
    })

    it('should display total price', async () => {
      preloadCartWithProducts([{
        id: 'item-1',
        productId: 'p1',
        productName: 'Gorro',
        productPrice: 15.00,
        optionValueId: null,
        optionValueName: null,
        quantity: 2,
      }])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={vi.fn()} />
        </CartProvider>
      )

      await waitFor(() => {
        expect(screen.getByText(/Total: 30.00€/)).toBeInTheDocument()
      })
    })

    it('should display checkout button when cart has items', async () => {
      preloadCartWithProducts([{
        id: 'item-1',
        productId: 'p1',
        productName: 'Gorro',
        productPrice: 15.00,
        optionValueId: null,
        optionValueName: null,
        quantity: 1,
      }])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={vi.fn()} />
        </CartProvider>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Ir al Checkout/i })).toBeInTheDocument()
      })
    })
  })

  describe('Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn()
      preloadCartWithProducts([])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={onClose} />
        </CartProvider>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))

      expect(onClose).toHaveBeenCalled()
    })

    it('should display updated quantity after increment', async () => {
      preloadCartWithProducts([{
        id: 'item-1',
        productId: 'p1',
        productName: 'Gorro',
        productPrice: 15.00,
        optionValueId: null,
        optionValueName: null,
        quantity: 1,
      }])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={vi.fn()} />
        </CartProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })

      // Click + button
      fireEvent.click(screen.getByRole('button', { name: '+' }))

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })

    it('should display updated quantity after decrement', async () => {
      preloadCartWithProducts([{
        id: 'item-1',
        productId: 'p1',
        productName: 'Gorro',
        productPrice: 15.00,
        optionValueId: null,
        optionValueName: null,
        quantity: 2,
      }])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={vi.fn()} />
        </CartProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })

      // Click - button
      fireEvent.click(screen.getByRole('button', { name: '-' }))

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })

    it('should remove item when delete button is clicked', async () => {
      preloadCartWithProducts([{
        id: 'item-1',
        productId: 'p1',
        productName: 'Gorro',
        productPrice: 15.00,
        optionValueId: null,
        optionValueName: null,
        quantity: 1,
      }])
      
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={vi.fn()} />
        </CartProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Gorro')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

      await waitFor(() => {
        expect(screen.queryByText('Gorro')).not.toBeInTheDocument()
        expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
      })
    })
  })
})