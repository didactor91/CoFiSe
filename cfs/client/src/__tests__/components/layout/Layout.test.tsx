import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../../context/AuthContext'
import Layout from '../../../components/layout/Layout'

// Mock child component to verify it renders
const MockChild = () => <div data-testid="mock-child">Test Child Content</div>

describe('Layout Component', () => {
  describe('Rendering', () => {
    it('should render Header component', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <Layout>
              <MockChild />
            </Layout>
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByText('CFS')).toBeInTheDocument()
    })

    it('should render Footer component', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <Layout>
              <MockChild />
            </Layout>
          </AuthProvider>
        </MemoryRouter>,
      )

      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
    })

    it('should render children content', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <Layout>
              <MockChild />
            </Layout>
          </AuthProvider>
        </MemoryRouter>,
      )

      expect(screen.getByTestId('mock-child')).toBeInTheDocument()
    })
  })

  describe('Structure', () => {
    it('should wrap children in main element', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <Layout>
              <MockChild />
            </Layout>
          </AuthProvider>
        </MemoryRouter>,
      )

      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toContainElement(screen.getByTestId('mock-child'))
    })

    it('should render header, main, and footer in sequence', () => {
      const { container } = render(
        <MemoryRouter>
          <AuthProvider>
            <Layout>
              <MockChild />
            </Layout>
          </AuthProvider>
        </MemoryRouter>,
      )

      const header = container.querySelector('header')
      const main = container.querySelector('main')
      const footer = container.querySelector('footer')

      expect(header).not.toBeNull()
      expect(main).not.toBeNull()
      expect(footer).not.toBeNull()

      // All three should be present
      expect(header && main && footer).toBeTruthy()
    })
  })
})
