import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CartProvider } from '../../context/CartContext'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    getStore: () => store,
    setStore: (s: Record<string, string>) => {
      store = s
    },
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
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.25rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
      fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
    },
    spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
    borderRadius: { sm: '4px', md: '8px', lg: '12px' },
  },
}))

// Mock urql for mutations
const mockSubmitCart = vi.fn()
vi.mock('urql', () => ({
  useMutation: vi.fn(() => [
    mockSubmitCart,
    { data: undefined, fetching: false, error: undefined },
  ]),
}))

// Preload empty cart
const preloadEmptyCart = () => {
  localStorageMock.setStore({
    senocom_cart: JSON.stringify({ items: [], sessionId: 'test-session' }),
    senocom_cart_session: 'test-session',
  })
  mockToPromise.mockResolvedValue({
    data: { products: [] },
    error: undefined,
  })
}

// Preload cart with items
const preloadCartWithItems = (
  items: Array<{
    id: string
    productId: string
    productName: string
    productPrice: number
    optionValueId: string | null
    optionValueName: string | null
    quantity: number
  }>,
) => {
  const productIds = [...new Set(items.map((i) => i.productId))]
  mockToPromise.mockResolvedValue({
    data: { products: productIds.map((id) => ({ id })) },
    error: undefined,
  })
  localStorageMock.setStore({
    senocom_cart: JSON.stringify({ items, sessionId: 'test-session' }),
    senocom_cart_session: 'test-session',
  })
}

import Checkout from '../../pages/Checkout'

describe('Checkout Page', () => {
  beforeEach(() => {
    localStorageMock.clear()
    localStorageMock.setStore({})
    randomUUIDMock.mockReturnValue('test-uuid-1234')
    mockToPromise.mockReset()
    mockToPromise.mockResolvedValue({
      data: { products: [] },
      error: undefined,
    })
    mockSubmitCart.mockReset()
    mockSubmitCart.mockResolvedValue({
      data: undefined,
      error: undefined,
    })
  })

  describe('Empty cart guard (5.4 RED + 5.5 GREEN)', () => {
    it('should show empty cart message when cart has no items', async () => {
      preloadEmptyCart()

      render(
        <MemoryRouter>
          <CartProvider>
            <Checkout />
          </CartProvider>
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument()
      })
    })

    it('should show message that checkout is not accessible', async () => {
      preloadEmptyCart()

      render(
        <MemoryRouter>
          <CartProvider>
            <Checkout />
          </CartProvider>
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByText(/checkout/i)).toBeInTheDocument()
        // Should not show cart review step
        expect(screen.queryByText('Revisa tu carrito')).not.toBeInTheDocument()
      })
    })

    it('should show a link to go back to catalog', async () => {
      preloadEmptyCart()

      render(
        <MemoryRouter>
          <CartProvider>
            <Checkout />
          </CartProvider>
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /volver al catálogo/i })).toBeInTheDocument()
      })
    })
  })

  describe('Cart review step', () => {
    it('should display cart items with product name and option', async () => {
      preloadCartWithItems([
        {
          id: 'item-1',
          productId: 'p1',
          productName: 'Corbata',
          productPrice: 25.0,
          optionValueId: 'ov1',
          optionValueName: 'Rojo',
          quantity: 1,
        },
      ])

      render(
        <MemoryRouter>
          <CartProvider>
            <Checkout />
          </CartProvider>
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByText('Corbata')).toBeInTheDocument()
        expect(screen.getByText('Rojo')).toBeInTheDocument()
      })
    })

    it('should display quantity controls', async () => {
      preloadCartWithItems([
        {
          id: 'item-1',
          productId: 'p1',
          productName: 'Gorro',
          productPrice: 15.0,
          optionValueId: null,
          optionValueName: null,
          quantity: 1,
        },
      ])

      render(
        <MemoryRouter>
          <CartProvider>
            <Checkout />
          </CartProvider>
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '+' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '-' })).toBeInTheDocument()
      })
    })

    it('should display delete button for each item', async () => {
      preloadCartWithItems([
        {
          id: 'item-1',
          productId: 'p1',
          productName: 'Gorro',
          productPrice: 15.0,
          optionValueId: null,
          optionValueName: null,
          quantity: 1,
        },
      ])

      render(
        <MemoryRouter>
          <CartProvider>
            <Checkout />
          </CartProvider>
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()
      })
    })

    it('should show total price', async () => {
      preloadCartWithItems([
        {
          id: 'item-1',
          productId: 'p1',
          productName: 'Gorro',
          productPrice: 15.0,
          optionValueId: null,
          optionValueName: null,
          quantity: 2,
        },
      ])

      render(
        <MemoryRouter>
          <CartProvider>
            <Checkout />
          </CartProvider>
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByText('30.00€')).toBeInTheDocument()
      })
    })

    it('should continue to contact form step', async () => {
      preloadCartWithItems([
        {
          id: 'item-1',
          productId: 'p1',
          productName: 'Gorro',
          productPrice: 15.0,
          optionValueId: null,
          optionValueName: null,
          quantity: 1,
        },
      ])

      render(
        <MemoryRouter>
          <CartProvider>
            <Checkout />
          </CartProvider>
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByText('Revisa tu carrito')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

      await waitFor(() => {
        expect(screen.getByText('Datos de contacto')).toBeInTheDocument()
      })
    })
  })

  describe('Contact form anti-fraud (5.6 RED + 5.7 GREEN)', () => {
    it('should show bot detection message when honeypot field is filled', async () => {
      preloadCartWithItems([
        {
          id: 'item-1',
          productId: 'p1',
          productName: 'Test Product',
          productPrice: 25.0,
          optionValueId: null,
          optionValueName: null,
          quantity: 1,
        },
      ])

      render(
        <MemoryRouter initialEntries={['/checkout']}>
          <CartProvider>
            <Checkout />
          </CartProvider>
        </MemoryRouter>,
      )

      // Wait for cart review to appear
      await waitFor(() => {
        expect(screen.getByText('Revisa tu carrito')).toBeInTheDocument()
      })

      // Click continue to go to contact form
      fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

      // Wait for contact form
      await waitFor(() => {
        expect(screen.getByText('Datos de contacto')).toBeInTheDocument()
      })

      // Fill out the form using fireEvent
      const nameInput = screen.getByLabelText('Nombre *')
      const emailInput = screen.getByLabelText('Email *')
      const phoneInput = screen.getByLabelText('Teléfono *')

      fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } })
      fireEvent.change(emailInput, { target: { value: 'juan@test.com' } })
      fireEvent.change(phoneInput, { target: { value: '123456789' } })

      // Find and fill the honeypot field (the hidden website input)
      const honeypotInput = document.querySelector('input[name="website"]') as HTMLInputElement
      expect(honeypotInput).not.toBeNull()

      // Simulate bot filling the honeypot field
      fireEvent.change(honeypotInput, { target: { value: 'bot@example.com' } })

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

      // Should show bot detection message
      await waitFor(() => {
        expect(
          screen.getByText('Por favor, completa el formulario correctamente'),
        ).toBeInTheDocument()
      })
    })

    it('should reject fast submission (timing check)', async () => {
      preloadCartWithItems([
        {
          id: 'item-1',
          productId: 'p1',
          productName: 'Test Product',
          productPrice: 25.0,
          optionValueId: null,
          optionValueName: null,
          quantity: 1,
        },
      ])

      render(
        <MemoryRouter initialEntries={['/checkout']}>
          <CartProvider>
            <Checkout />
          </CartProvider>
        </MemoryRouter>,
      )

      // Wait for cart review to appear
      await waitFor(() => {
        expect(screen.getByText('Revisa tu carrito')).toBeInTheDocument()
      })

      // Click continue to go to contact form
      fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

      // Wait for contact form
      await waitFor(() => {
        expect(screen.getByText('Datos de contacto')).toBeInTheDocument()
      })

      // Fill out the form immediately (no delay - timing check should fail)
      const nameInput = screen.getByLabelText('Nombre *')
      const emailInput = screen.getByLabelText('Email *')
      const phoneInput = screen.getByLabelText('Teléfono *')

      fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } })
      fireEvent.change(emailInput, { target: { value: 'juan@test.com' } })
      fireEvent.change(phoneInput, { target: { value: '123456789' } })

      // Submit immediately (less than 3 seconds)
      fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

      // Should show timing check error
      await waitFor(() => {
        expect(
          screen.getByText('Por favor, revisa el formulario antes de enviar'),
        ).toBeInTheDocument()
      })
    })
  })
})
