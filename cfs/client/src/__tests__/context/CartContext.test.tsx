import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { CartProvider, useCart } from '../../context/CartContext'

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

// Mock graphql client - will be configured per test
const mockQuery = vi.fn()
vi.mock('../../graphql/client', () => ({
  graphqlClient: {
    query: (...args: unknown[]) => mockQuery(...args),
  },
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
)

describe('CartContext', () => {
  beforeEach(() => {
    localStorageMock.clear()
    localStorageMock.setStore({})
    randomUUIDMock.mockReturnValue('test-uuid-1234')
    mockQuery.mockReset()
    // Default: no products (will cause stale cleanup to remove all items)
    mockQuery.mockResolvedValue({
      data: { products: [] },
      error: undefined,
    })
  })

  describe('Initial State', () => {
    it('should initialize with empty items array', () => {
      const { result } = renderHook(() => useCart(), { wrapper })
      expect(result.current.items).toEqual([])
    })

    it('should generate a new sessionId if none in localStorage', () => {
      const { result } = renderHook(() => useCart(), { wrapper })
      expect(result.current.sessionId).toBe('test-uuid-1234')
    })

    it('should persist sessionId to localStorage', () => {
      renderHook(() => useCart(), { wrapper })
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'senocom_cart_session',
        'test-uuid-1234'
      )
    })

    it('should restore sessionId from localStorage if it exists', () => {
      localStorageMock.setStore({ 'senocom_cart_session': 'existing-session-456' })
      const { result } = renderHook(() => useCart(), { wrapper })
      expect(result.current.sessionId).toBe('existing-session-456')
    })
  })

  describe('addToCart()', () => {
    it('should add a new item when product+option combination does not exist', async () => {
      // Mock returning valid products so item isn't removed as stale
      mockQuery.mockResolvedValue({
        data: { products: [{ id: 'p1' }] },
        error: undefined,
      })

      const { result } = renderHook(() => useCart(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0)
      })

      act(() => {
        result.current.addToCart({
          productId: 'p1',
          productName: 'Gorro',
          productPrice: 15.00,
          optionValueId: null,
          optionValueName: null,
          quantity: 1,
        })
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0]).toMatchObject({
        productId: 'p1',
        productName: 'Gorro',
        productPrice: 15.00,
        optionValueId: null,
        optionValueName: null,
        quantity: 1,
      })
    })

    it('should merge quantities when adding same product+option again', async () => {
      mockQuery.mockResolvedValue({
        data: { products: [{ id: 'p2' }] },
        error: undefined,
      })

      const { result } = renderHook(() => useCart(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0)
      })

      // Add first item
      act(() => {
        result.current.addToCart({
          productId: 'p2',
          productName: 'Corbata',
          productPrice: 25.00,
          optionValueId: 'ov1',
          optionValueName: 'Rojo',
          quantity: 2,
        })
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].quantity).toBe(2)

      // Add same product+option again
      act(() => {
        result.current.addToCart({
          productId: 'p2',
          productName: 'Corbata',
          productPrice: 25.00,
          optionValueId: 'ov1',
          optionValueName: 'Rojo',
          quantity: 1,
        })
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].quantity).toBe(3)
    })

    it('should add as separate items when same product has different options', async () => {
      mockQuery.mockResolvedValue({
        data: { products: [{ id: 'p2' }] },
        error: undefined,
      })

      const { result } = renderHook(() => useCart(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0)
      })

      // Add with Rojo
      act(() => {
        result.current.addToCart({
          productId: 'p2',
          productName: 'Corbata',
          productPrice: 25.00,
          optionValueId: 'ov1',
          optionValueName: 'Rojo',
          quantity: 2,
        })
      })

      // Add with Verde
      act(() => {
        result.current.addToCart({
          productId: 'p2',
          productName: 'Corbata',
          productPrice: 25.00,
          optionValueId: 'ov2',
          optionValueName: 'Verde',
          quantity: 1,
        })
      })

      expect(result.current.items).toHaveLength(2)
      expect(result.current.items.find(i => i.optionValueId === 'ov1')?.quantity).toBe(2)
      expect(result.current.items.find(i => i.optionValueId === 'ov2')?.quantity).toBe(1)
    })

    it('should persist cart to localStorage after adding item', async () => {
      mockQuery.mockResolvedValue({
        data: { products: [{ id: 'p1' }] },
        error: undefined,
      })

      const { result } = renderHook(() => useCart(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0)
      })

      act(() => {
        result.current.addToCart({
          productId: 'p1',
          productName: 'Gorro',
          productPrice: 15.00,
          optionValueId: null,
          optionValueName: null,
          quantity: 1,
        })
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'senocom_cart',
        expect.stringContaining('"productId":"p1"')
      )
    })
  })

  describe('updateQuantity()', () => {
    it('should update the quantity of an existing item', async () => {
      mockQuery.mockResolvedValue({
        data: { products: [{ id: 'p1' }] },
        error: undefined,
      })

      const { result } = renderHook(() => useCart(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0)
      })

      act(() => {
        result.current.addToCart({
          productId: 'p1',
          productName: 'Gorro',
          productPrice: 15.00,
          optionValueId: null,
          optionValueName: null,
          quantity: 1,
        })
      })

      const itemId = result.current.items[0].id

      act(() => {
        result.current.updateQuantity(itemId, 5)
      })

      expect(result.current.items[0].quantity).toBe(5)
    })

    it('should remove item when quantity is set to zero', async () => {
      mockQuery.mockResolvedValue({
        data: { products: [{ id: 'p1' }] },
        error: undefined,
      })

      const { result } = renderHook(() => useCart(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0)
      })

      act(() => {
        result.current.addToCart({
          productId: 'p1',
          productName: 'Gorro',
          productPrice: 15.00,
          optionValueId: null,
          optionValueName: null,
          quantity: 1,
        })
      })

      const itemId = result.current.items[0].id

      act(() => {
        result.current.updateQuantity(itemId, 0)
      })

      expect(result.current.items).toHaveLength(0)
    })
  })

  describe('removeItem()', () => {
    it('should remove an item from the cart', async () => {
      mockQuery.mockResolvedValue({
        data: { products: [{ id: 'p1' }] },
        error: undefined,
      })

      const { result } = renderHook(() => useCart(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0)
      })

      act(() => {
        result.current.addToCart({
          productId: 'p1',
          productName: 'Gorro',
          productPrice: 15.00,
          optionValueId: null,
          optionValueName: null,
          quantity: 1,
        })
      })

      const itemId = result.current.items[0].id

      act(() => {
        result.current.removeItem(itemId)
      })

      expect(result.current.items).toHaveLength(0)
    })
  })

  describe('clearCart()', () => {
    it('should remove all items from the cart', async () => {
      mockQuery.mockResolvedValue({
        data: { products: [{ id: 'p1' }, { id: 'p2' }] },
        error: undefined,
      })

      const { result } = renderHook(() => useCart(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0)
      })

      act(() => {
        result.current.addToCart({
          productId: 'p1',
          productName: 'Gorro',
          productPrice: 15.00,
          optionValueId: null,
          optionValueName: null,
          quantity: 1,
        })
      })

      act(() => {
        result.current.addToCart({
          productId: 'p2',
          productName: 'Corbata',
          productPrice: 25.00,
          optionValueId: 'ov1',
          optionValueName: 'Rojo',
          quantity: 2,
        })
      })

      act(() => {
        result.current.clearCart()
      })

      expect(result.current.items).toHaveLength(0)
    })
  })

  describe('totalItems', () => {
    it('should return the sum of all item quantities', async () => {
      mockQuery.mockResolvedValue({
        data: { products: [{ id: 'p1' }, { id: 'p2' }] },
        error: undefined,
      })

      const { result } = renderHook(() => useCart(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0)
      })

      act(() => {
        result.current.addToCart({
          productId: 'p1',
          productName: 'Gorro',
          productPrice: 15.00,
          optionValueId: null,
          optionValueName: null,
          quantity: 2,
        })
      })

      act(() => {
        result.current.addToCart({
          productId: 'p2',
          productName: 'Corbata',
          productPrice: 25.00,
          optionValueId: 'ov1',
          optionValueName: 'Rojo',
          quantity: 3,
        })
      })

      expect(result.current.totalItems).toBe(5)
    })
  })

  describe('localStorage persistence', () => {
    it('should persist full cart state to localStorage', async () => {
      mockQuery.mockResolvedValue({
        data: { products: [{ id: 'p1' }] },
        error: undefined,
      })

      const { result } = renderHook(() => useCart(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0)
      })

      act(() => {
        result.current.addToCart({
          productId: 'p1',
          productName: 'Gorro',
          productPrice: 15.00,
          optionValueId: null,
          optionValueName: null,
          quantity: 2,
        })
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'senocom_cart',
        expect.stringContaining('"items"')
      )
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'senocom_cart',
        expect.stringContaining('"sessionId"')
      )
    })

    it('should restore cart from localStorage on mount', async () => {
      const storedCart = {
        items: [
          {
            id: 'existing-item-1',
            productId: 'p1',
            productName: 'Gorro',
            productPrice: 15.00,
            optionValueId: null,
            optionValueName: null,
            quantity: 3,
          },
        ],
        sessionId: 'restored-session-789',
      }

      localStorageMock.setStore({
        'senocom_cart': JSON.stringify(storedCart),
        'senocom_cart_session': 'restored-session-789',
      })

      // Mock returning that p1 exists
      mockQuery.mockResolvedValue({
        data: { products: [{ id: 'p1' }] },
        error: undefined,
      })

      const { result } = renderHook(() => useCart(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1)
      })

      expect(result.current.items[0].productId).toBe('p1')
      expect(result.current.sessionId).toBe('restored-session-789')
    })
  })

  describe('Stale product cleanup on load', () => {
    it('should remove items with productIds not found in database', async () => {
      // Setup: cart has p1 (valid) and deleted-product (stale)
      const storedCart = {
        items: [
          {
            id: 'item-1',
            productId: 'p1',
            productName: 'Gorro',
            productPrice: 15.00,
            optionValueId: null,
            optionValueName: null,
            quantity: 2,
          },
          {
            id: 'item-2',
            productId: 'deleted-product',
            productName: 'Deleted Product',
            productPrice: 20.00,
            optionValueId: null,
            optionValueName: null,
            quantity: 1,
          },
        ],
        sessionId: 'test-session',
      }

      localStorageMock.setStore({
        'senocom_cart': JSON.stringify(storedCart),
        'senocom_cart_session': 'test-session',
      })

      // Mock graphql client to return only p1 as existing
      mockQuery.mockResolvedValue({
        data: {
          products: [
            { id: 'p1' },
          ],
        },
        error: undefined,
      })

      const { result } = renderHook(() => useCart(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1)
      })

      expect(result.current.items[0].productId).toBe('p1')
      expect(result.current.items.find(i => i.productId === 'deleted-product')).toBeUndefined()
    })

    it('should keep all items when all productIds exist in database', async () => {
      const storedCart = {
        items: [
          {
            id: 'item-1',
            productId: 'p1',
            productName: 'Gorro',
            productPrice: 15.00,
            optionValueId: null,
            optionValueName: null,
            quantity: 2,
          },
          {
            id: 'item-2',
            productId: 'p2',
            productName: 'Corbata',
            productPrice: 25.00,
            optionValueId: 'ov1',
            optionValueName: 'Rojo',
            quantity: 1,
          },
        ],
        sessionId: 'test-session',
      }

      localStorageMock.setStore({
        'senocom_cart': JSON.stringify(storedCart),
        'senocom_cart_session': 'test-session',
      })

      mockQuery.mockResolvedValue({
        data: {
          products: [
            { id: 'p1' },
            { id: 'p2' },
          ],
        },
        error: undefined,
      })

      const { result } = renderHook(() => useCart(), { wrapper })

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2)
      })

      expect(result.current.items.find(i => i.productId === 'p1')).toBeDefined()
      expect(result.current.items.find(i => i.productId === 'p2')).toBeDefined()
    })

    it('should handle GraphQL query failure gracefully (fail open)', async () => {
      const storedCart = {
        items: [
          {
            id: 'item-1',
            productId: 'p1',
            productName: 'Gorro',
            productPrice: 15.00,
            optionValueId: null,
            optionValueName: null,
            quantity: 2,
          },
        ],
        sessionId: 'test-session',
      }

      localStorageMock.setStore({
        'senocom_cart': JSON.stringify(storedCart),
        'senocom_cart_session': 'test-session',
      })

      // Mock GraphQL query to fail
      mockQuery.mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      })

      const { result } = renderHook(() => useCart(), { wrapper })

      // When query fails, we keep all items (fail open)
      await waitFor(() => {
        expect(result.current.items).toHaveLength(1)
      })

      expect(result.current.items[0].productId).toBe('p1')
    })
  })
})
