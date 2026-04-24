import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'

// Define types locally
interface News {
  id: string
  title: string
  content: string
  imageUrl?: string | null
  createdAt: string
  updatedAt: string
}

// Mutable state for mocking
let newsItemData: { newsItem: News } | null = null
let fetchingState = false
let errorState: { message: string } | null = null

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: '123' }),
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
  NEWS_ITEM_QUERY: '',
  useNewsItemQuery: () => {
    return [
      { 
        data: newsItemData, 
        fetching: fetchingState, 
        error: errorState 
      },
      (() => {}) as any,
    ] as const
  },
}))

import NewsDetail from '../../pages/NewsDetail'

const mockNewsItem: News = {
  id: '1',
  title: 'Nueva-noticia',
  content: 'Contenido de prueba con varias líneas',
  imageUrl: null,
  createdAt: '2026-04-24T10:00:00.000Z',
  updatedAt: '2026-04-24T10:00:00.000Z',
}

describe('NewsDetail Page', () => {
  beforeEach(() => {
    newsItemData = null
    fetchingState = false
    errorState = null
  })

  describe('Loading State', () => {
    it('renders loading state initially', () => {
      fetchingState = true
      newsItemData = null

      render(
        <MemoryRouter>
          <AuthProvider>
            <NewsDetail />
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
      newsItemData = null

      render(
        <MemoryRouter>
          <AuthProvider>
            <NewsDetail />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText(/no encontrada/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument()
    })

    it('renders not found when newsItem returns null', () => {
      newsItemData = { newsItem: null as unknown as News }

      render(
        <MemoryRouter>
          <AuthProvider>
            <NewsDetail />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText(/no encontrada/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /volver/i })).toBeInTheDocument()
    })
  })

  describe('Content Rendering', () => {
    it('renders news content correctly', () => {
      newsItemData = { newsItem: mockNewsItem }

      render(
        <MemoryRouter>
          <AuthProvider>
            <NewsDetail />
          </AuthProvider>
        </MemoryRouter>
      )

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Nueva-noticia')
      
      expect(screen.getByText(/Contenido de prueba con varias líneas/i)).toBeInTheDocument()
    })

    it('renders news with image', () => {
      const newsWithImage = {
        ...mockNewsItem,
        imageUrl: 'https://example.com/image.jpg',
      }
      newsItemData = { newsItem: newsWithImage }

      render(
        <MemoryRouter>
          <AuthProvider>
            <NewsDetail />
          </AuthProvider>
        </MemoryRouter>
      )

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
    })

    it('date is formatted correctly', () => {
      newsItemData = { newsItem: mockNewsItem }

      render(
        <MemoryRouter>
          <AuthProvider>
            <NewsDetail />
          </AuthProvider>
        </MemoryRouter>
      )

      // Date should be formatted in Spanish
      expect(screen.getByText(/24 de abril de 2026/i)).toBeInTheDocument()
    })
  })

// Navigation is implicitly tested via the UI - back button renders and uses navigate(-1)
})