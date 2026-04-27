import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'

// Define types locally to avoid import path issues
interface News {
  id: string
  title: string
  content: string
  imageUrl?: string | null
  published: boolean
  createdAt: string
  updatedAt: string
}

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
let newsData: { news: News[] } | null = null
let productsData: { products: Product[] } | null = null
let eventsData: { events: any[] } | null = null

vi.mock('../../graphql/queries', () => ({
  NEWS_QUERY: '',
  PRODUCTS_QUERY: '',
  EVENTS_QUERY: '',
  useNewsQuery: () => {
    return [{ data: newsData, fetching: false, error: null }, (() => {}) as any] as const
  },
  useProductsQuery: () => {
    return [{ data: productsData, fetching: false, error: null }, (() => {}) as any] as const
  },
  useEventsQuery: () => {
    return [{ data: eventsData, fetching: false, error: null }, (() => {}) as any] as const
  },
}))

import Landing from '../../pages/Landing'

const mockNews: News[] = [
  {
    id: '1',
    title: 'Noticia 1',
    content: 'Contenido de la noticia 1',
    imageUrl: null,
    published: true,
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-04-20T10:00:00Z',
  },
  {
    id: '2',
    title: 'Noticia 2',
    content: 'Contenido de la noticia 2',
    imageUrl: null,
    published: true,
    createdAt: '2026-04-21T10:00:00Z',
    updatedAt: '2026-04-21T10:00:00Z',
  },
]

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

describe('Landing Page', () => {
  beforeEach(() => {
    // Reset mock state before each test
    newsData = null
    productsData = null
    eventsData = { events: [] }
  })

  describe('News Feed', () => {
    it('should render news feed with NewsCard components', () => {
      newsData = { news: mockNews }
      productsData = { products: mockProducts }

      render(
        <MemoryRouter>
          <AuthProvider>
            <Landing />
          </AuthProvider>
        </MemoryRouter>,
      )

      // Check for news items - component should render them
      const newsCards = screen.getAllByTestId(/news-card/i)
      expect(newsCards.length).toBe(2)
    })

    it('should display news ordered by newest first', () => {
      // News should already be in newest-first order from server
      const orderedNews = [...mockNews].reverse()
      newsData = { news: orderedNews }
      productsData = { products: mockProducts }

      render(
        <MemoryRouter>
          <AuthProvider>
            <Landing />
          </AuthProvider>
        </MemoryRouter>,
      )

      // Verify order - first news card should have the newest title
      const newsCards = screen.getAllByTestId(/news-card/i)
      expect(newsCards[0]).toHaveTextContent('Noticia 2') // newer date
    })

    it('should show "No hay noticias todavía" when news feed is empty', () => {
      newsData = { news: [] }
      productsData = { products: mockProducts }

      render(
        <MemoryRouter>
          <AuthProvider>
            <Landing />
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByText('No hay noticias todavía')).toBeInTheDocument()
    })
  })

  describe('Catalog Preview', () => {
    it('should display up to 6 products in catalog preview', () => {
      const manyProducts: Product[] = Array.from({ length: 10 }, (_, i) => ({
        id: String(i + 1),
        name: `Producto ${i + 1}`,
        description: `Descripción ${i + 1}`,
        price: 99.99 + i,
        stock: 10 - i,
        imageUrl: null,
        createdAt: '2026-04-20T10:00:00Z',
        updatedAt: '2026-04-20T10:00:00Z',
      }))

      newsData = { news: mockNews }
      productsData = { products: manyProducts }

      render(
        <MemoryRouter>
          <AuthProvider>
            <Landing />
          </AuthProvider>
        </MemoryRouter>,
      )

      // Should only show 6 products (check by product names)
      expect(screen.getByText('Producto 1')).toBeInTheDocument()
      expect(screen.getByText('Producto 6')).toBeInTheDocument()
      expect(screen.queryByText('Producto 7')).not.toBeInTheDocument()
    })
  })
})
