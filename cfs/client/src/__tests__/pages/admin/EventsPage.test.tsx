import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import EventsPage from '../../../pages/admin/EventsPage'
import { AuthProvider } from '../../../context/AuthContext'

// Mutable state for controlling mock user and data
let mockUser: { id: string; email: string; role: 'ADMIN' | 'STAFF'; createdAt: string } | null = null
let mockCan: string[] = []
const mockEvents = [
  { id: '1', name: 'Event 1', description: 'Description 1', location: 'Location 1', startTime: '2026-04-25T10:00:00Z', endTime: '2026-04-25T12:00:00Z', createdAt: '', updatedAt: '' },
  { id: '2', name: 'Event 2', description: 'Description 2', location: 'Location 2', startTime: '2026-04-26T14:00:00Z', endTime: '2026-04-26T16:00:00Z', createdAt: '', updatedAt: '' },
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
  useAllEventsQuery: () => [
    { data: { allEvents: mockEvents }, fetching: false, error: null },
    (() => {}) as any,
  ],
}))

vi.mock('../../../graphql/mutations', () => ({
  useCreateEventMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
  useUpdateEventMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
  useDeleteEventMutation: () => [
    (() => {}) as any,
    { fetching: false, error: null },
  ],
}))

describe('EventsPage', () => {
  beforeEach(() => {
    mockUser = { id: '1', email: 'admin@test.com', role: 'ADMIN', createdAt: '2026-04-01T00:00:00Z' }
    mockCan = ['event.read', 'event.create', 'event.update', 'event.delete']
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render events page', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <EventsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('events-page')).toBeInTheDocument()
    })

    it('should render events list', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <EventsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('Event 1')).toBeInTheDocument()
      expect(screen.getByText('Event 2')).toBeInTheDocument()
    })

    it('should display event names', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <EventsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      const eventItems = screen.getAllByText(/Event \d/)
      expect(eventItems.length).toBe(2)
    })
  })

  describe('Permission checks', () => {
    it('should show add event button when user has event.create permission', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <EventsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByText('Añadir Evento')).toBeInTheDocument()
    })

    it('should hide add event button when user lacks event.create permission', () => {
      mockCan = ['event.read', 'event.update', 'event.delete']

      render(
        <MemoryRouter>
          <AuthProvider>
            <EventsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByText('Añadir Evento')).not.toBeInTheDocument()
    })

    it('should show edit button when user has event.update permission', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <EventsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('edit-event-btn-1')).toBeInTheDocument()
    })

    it('should hide edit button when user lacks event.update permission', () => {
      mockCan = ['event.read', 'event.create', 'event.delete']

      render(
        <MemoryRouter>
          <AuthProvider>
            <EventsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByTestId('edit-event-btn-1')).not.toBeInTheDocument()
    })

    it('should show delete button when user has event.delete permission (ADMIN)', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <EventsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.getByTestId('delete-event-btn-1')).toBeInTheDocument()
    })

    it('should hide delete button when user lacks event.delete permission (STAFF)', () => {
      mockCan = ['event.read', 'event.create', 'event.update']

      render(
        <MemoryRouter>
          <AuthProvider>
            <EventsPage />
          </AuthProvider>
        </MemoryRouter>
      )

      expect(screen.queryByTestId('delete-event-btn-1')).not.toBeInTheDocument()
    })
  })
})