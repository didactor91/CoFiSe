import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from '../../../components/layout/Header'

// Mock useAuth hook
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../../hooks/useAuth'

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Logo', () => {
    it('should render CFS logo text', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        can: vi.fn(),
      })

      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
      )

      expect(screen.getByText('CFS')).toBeInTheDocument()
    })

    it('should link logo to home path /', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        can: vi.fn(),
      })

      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
      )

      const logoLink = screen.getByText('CFS').closest('a')
      expect(logoLink).toHaveAttribute('href', '/')
    })
  })

  describe('Navigation Links', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        can: vi.fn(),
      })
    })

    it('should render Inicio navigation link', () => {
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
      )

      const inicioLink = screen.getByText('Inicio').closest('a')
      expect(inicioLink).toHaveAttribute('href', '/')
    })

    it('should render Catálogo navigation link', () => {
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
      )

      const catalogoLink = screen.getByText('Catálogo').closest('a')
      expect(catalogoLink).toHaveAttribute('href', '/catalog')
    })
  })

  describe('Auth State - Unauthenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        can: vi.fn(),
      })
    })

    it('should show "Iniciar sesión" link when unauthenticated', () => {
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
      )

      expect(screen.getByText('Iniciar sesión')).toBeInTheDocument()
    })

    it('should link "Iniciar sesión" to /login', () => {
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
      )

      const loginLink = screen.getByText('Iniciar sesión').closest('a')
      expect(loginLink).toHaveAttribute('href', '/login')
    })
  })

  describe('Auth State - Authenticated', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'ADMIN' as const,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    }

    it('should show user email when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        can: vi.fn(),
      })

      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
      )

      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('should truncate long email (>20 chars) with ellipsis', () => {
      const longEmailUser = {
        ...mockUser,
        email: 'verylongemailaddress12345@example.com',
      }

      mockUseAuth.mockReturnValue({
        user: longEmailUser,
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        can: vi.fn(),
      })

      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
      )

      const emailText = screen.getByText(/…/)
      expect(emailText.textContent?.length).toBeLessThanOrEqual(23) // 20 + "…"
    })

    it('should show "Cerrar sesión" button when authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        can: vi.fn(),
      })

      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
      )

      expect(screen.getByText('Cerrar sesión')).toBeInTheDocument()
    })

    it('should call logout when "Cerrar sesión" button is clicked', () => {
      const logoutMock = vi.fn()
      mockUseAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: logoutMock,
        can: vi.fn(),
      })

      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
      )

      screen.getByText('Cerrar sesión').click()
      expect(logoutMock).toHaveBeenCalled()
    })
  })
})
