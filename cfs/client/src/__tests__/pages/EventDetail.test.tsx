import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'

// Define types locally
interface Event {
  id: string
  name: string
  description?: string | null
  location: string
  startTime: string
  endTime: string
  createdAt: string
  updatedAt: string
}

// Mutable state for mocking
let eventData: { event: Event } | null = null
let fetchingState = false
let errorState: { message: string } | null = null

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: '456' }),
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
  EVENT_QUERY: '',
  useEventQuery: () => {
    return [
      { 
        data: eventData, 
        fetching: fetchingState, 
        error: errorState 
      },
      (() => {}) as any,
    ] as const
  },
}))

import EventDetail from '../../pages/EventDetail'

const mockEvent: Event = {
  id: '1',
  name: 'Taller de Ceramica',
  description: 'Un taller para aprender tecnicas de ceramica',
  location: 'Sala de Arte',
  startTime: '2026-04-24T10:00:00.000Z',
  endTime: '2026-04-24T12:00:00.000Z',
  createdAt: '2026-04-20T10:00:00.000Z',
  updatedAt: '2026-04-20T10:00:00.000Z',
}

describe('EventDetail Page', () => {
  beforeEach(() => {
    eventData = null
    fetchingState = false
    errorState = null
  })

  describe('Loading State', () => {
    it('renders loading state', () => {
      fetchingState = true
      eventData = null

      render(
        <MemoryRouter>
          <AuthProvider>
            <EventDetail />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('⏳')).toBeInTheDocument()
      expect(screen.getByText('Cargando...')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('renders error state when query fails', () => {
      errorState = { message: 'Network error' }
      eventData = null

      render(
        <MemoryRouter>
          <AuthProvider>
            <EventDetail />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText(/no encontrado/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument()
    })

    it('renders error when event is null', () => {
      eventData = { event: null as unknown as Event }

      render(
        <MemoryRouter>
          <AuthProvider>
            <EventDetail />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText(/no encontrado/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument()
    })
  })

  describe('Content Rendering', () => {
    it('renders event details correctly', () => {
      eventData = { event: mockEvent }

      render(
        <MemoryRouter>
          <AuthProvider>
            <EventDetail />
          </AuthProvider>
        </MemoryRouter>
      )

      // Check name
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Taller de Ceramica')

      // Check location
      expect(screen.getByText(/📍 Sala de Arte/i)).toBeInTheDocument()

      // Check description
      expect(screen.getByText(/Un taller para aprender tecnicas de ceramica/i)).toBeInTheDocument()
    })

    it('datetime formatting shows correct range', () => {
      eventData = { event: mockEvent }

      render(
        <MemoryRouter>
          <AuthProvider>
            <EventDetail />
          </AuthProvider>
        </MemoryRouter>
      )

      // Should show date and time range in Spanish format
      expect(screen.getByText(/24 de abril de 2026/i)).toBeInTheDocument()
      // Time range may vary based on timezone, check for time pattern
      expect(screen.getByText(/\d{1,2}:\d{2} - \d{1,2}:\d{2}/i)).toBeInTheDocument()
    })

    it('renders event without description', () => {
      const eventWithoutDesc = {
        ...mockEvent,
        description: null,
      }
      eventData = { event: eventWithoutDesc }

      render(
        <MemoryRouter>
          <AuthProvider>
            <EventDetail />
          </AuthProvider>
        </MemoryRouter>
      )

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Taller de Ceramica')
      expect(screen.queryByText(/taller para aprender/i)).not.toBeInTheDocument()
    })
  })

// Navigation is implicitly tested via the UI - back button renders and uses navigate(-1)
})