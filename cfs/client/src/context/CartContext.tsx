import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'
import type { ReactNode } from 'react'
import { graphqlClient } from '../graphql/client'

const PRODUCTS_QUERY = `
  query Products {
    products {
      id
    }
  }
`

export interface CartItem {
  id: string
  productId: string
  productName: string
  productPrice: number
  optionValueId: string | null
  optionValueName: string | null
  quantity: number
}

interface CartState {
  items: CartItem[]
  sessionId: string
}

interface CartContextValue extends CartState {
  addToCart: (item: Omit<CartItem, 'id'>) => void
  updateQuantity: (itemId: string, quantity: number) => void
  removeItem: (itemId: string) => void
  clearCart: () => void
  totalItems: number
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'senocom_cart'
const SESSION_KEY = 'senocom_cart_session'

function generateId(): string {
  return crypto.randomUUID()
}

function generateSessionId(): string {
  return crypto.randomUUID()
}

function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [sessionId, setSessionId] = useState<string>('')

  // Initialize from localStorage on mount
  useEffect(() => {
    const initCart = async () => {
      const storedSessionId = localStorage.getItem(SESSION_KEY)
      const storedCart = getFromStorage<{ items: CartItem[]; sessionId: string }>(
        STORAGE_KEY,
        { items: [], sessionId: '' }
      )

      if (storedSessionId) {
        setSessionId(storedSessionId)
      } else {
        const newSessionId = generateSessionId()
        setSessionId(newSessionId)
        localStorage.setItem(SESSION_KEY, newSessionId)
      }

      if (storedCart.items.length > 0) {
        // Filter out stale products (products that no longer exist in DB)
        try {
          const result = await graphqlClient.query(PRODUCTS_QUERY, {}).toPromise()
          const existingProductIds = result.data?.products?.map(
            (p: { id: string }) => p.id
          ) ?? []

          const validItems = storedCart.items.filter((item) =>
            existingProductIds.includes(item.productId)
          )
          setItems(validItems)
        } catch {
          // If the query fails, keep all items (fail open for stale cleanup)
          setItems(storedCart.items)
        }
      }
    }

    initCart()
  }, [])

  // Persist to localStorage on every change
  useEffect(() => {
    if (sessionId) {
      saveToStorage(STORAGE_KEY, { items, sessionId })
    }
  }, [items, sessionId])

  const addToCart = useCallback((newItem: Omit<CartItem, 'id'>) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.optionValueId === newItem.optionValueId
      )

      if (existingIndex >= 0) {
        // Merge quantities
        const updated = [...prevItems]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        }
        return updated
      }

      // Add new item
      return [
        ...prevItems,
        {
          ...newItem,
          id: generateId(),
        },
      ]
    })
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
      return
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    )
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        sessionId,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
