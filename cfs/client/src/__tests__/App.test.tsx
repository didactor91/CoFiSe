import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

// Mock auth context to control authentication state
vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: null,
    token: null,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false,
  }),
}))

// Mock pages
vi.mock('../pages/Landing', () => ({
  default: () => <div data-testid="landing-page">Landing Page</div>,
}))
vi.mock('../pages/Catalog', () => ({
  default: () => <div data-testid="catalog-page">Catalog Page</div>,
}))
vi.mock('../pages/ControlPanel', () => ({
  default: () => <div data-testid="control-panel-page">Control Panel</div>,
}))
vi.mock('../pages/Login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}))

const renderWithRouter = (initialRoute: string) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  )
}

describe('App Routing', () => {
  describe('Route /', () => {
    it('should render Landing page', () => {
      renderWithRouter('/')
      
      expect(screen.getByTestId('landing-page')).toBeInTheDocument()
      expect(screen.getByTestId('landing-page')).toHaveTextContent('Landing Page')
    })
  })

  describe('Route /catalog', () => {
    it('should render Catalog page', () => {
      renderWithRouter('/catalog')
      
      expect(screen.getByTestId('catalog-page')).toBeInTheDocument()
      expect(screen.getByTestId('catalog-page')).toHaveTextContent('Catalog Page')
    })
  })

  describe('Route /login', () => {
    it('should render Login page', () => {
      renderWithRouter('/login')
      
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
      expect(screen.getByTestId('login-page')).toHaveTextContent('Login Page')
    })
  })

  describe('Route /admin', () => {
    it('should redirect to /login when not authenticated', () => {
      renderWithRouter('/admin')
      
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })
})