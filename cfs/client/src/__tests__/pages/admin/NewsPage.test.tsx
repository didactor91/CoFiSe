import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NewsPage from '../../../pages/admin/NewsPage'
import { AuthProvider } from '../../../context/AuthContext'

// Mutable state for controlling mock user and data
let mockUser: { id: string; email: string; role: 'ADMIN' | 'STAFF'; createdAt: string } | null = null
let mockCan: string[] = []
const mockNews = [
  { id: '1', title: 'News 1', content: 'Content 1', imageUrl: null, published: true, createdAt: '', updatedAt: '' },
  { id: '2', title: 'News 2', content: 'Content 2', imageUrl: null, published: false, createdAt: '', updatedAt: '' },
]

vi.mock('../../../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: mockUser,
    token: mockUser ? 'valid-token' : null,
    isAuthenticated: !!mockUser,
    logout: vi.fn(),
    can: (permission: string) => mockCan.includes(permission),
  }),
}))

vi.mock('../../../graphql/queries', () => ({
  useAllNewsQuery: () => [
    { data: { allNews: mockNews }, fetching: false, error: null },
    (() => {}) as any,
  ],
}))

vi.mock('../../../graphql/mutations', () => ({
  useCreateNewsMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
  useUpdateNewsMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
  useDeleteNewsMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
  usePublishNewsMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
  useUnpublishNewsMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
}))

describe('NewsPage', () => {
  beforeEach(() => {
    mockUser = { id: '1', email: 'admin@test.com', role: 'ADMIN', createdAt: '2026-04-01T00:00:00Z' }
    mockCan = ['news.read', 'news.create', 'news.update', 'news.delete']
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render news page', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <NewsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('news-page')).toBeInTheDocument()
    })

    it('should render news list', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <NewsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('News 1')).toBeInTheDocument()
      expect(screen.getByText('News 2')).toBeInTheDocument()
    })

    it('should display news titles', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <NewsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      const newsItems = screen.getAllByText(/News \d/)
      expect(newsItems.length).toBe(2)
    })
  })

  describe('Permission checks', () => {
    it('should show add news button when user has news.create permission', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <NewsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('Añadir Noticia')).toBeInTheDocument()
    })

    it('should hide add news button when user lacks news.create permission', () => {
      mockCan = ['news.read', 'news.update', 'news.delete']

      render(
        <MemoryRouter>
          <AuthProvider>
            <NewsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByText('Añadir Noticia')).not.toBeInTheDocument()
    })

    it('should show edit button when user has news.update permission', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <NewsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('edit-news-btn-1')).toBeInTheDocument()
    })

    it('should hide edit button when user lacks news.update permission', () => {
      mockCan = ['news.read', 'news.create', 'news.delete']

      render(
        <MemoryRouter>
          <AuthProvider>
            <NewsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByTestId('edit-news-btn-1')).not.toBeInTheDocument()
    })
  })
})
