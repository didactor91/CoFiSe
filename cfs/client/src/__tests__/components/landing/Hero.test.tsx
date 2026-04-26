import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Hero from '../../../components/landing/Hero'

describe('Hero Component', () => {
  describe('Content', () => {
    it('should render headline "Bienvenido a CFS"', () => {
      render(
        <MemoryRouter>
          <Hero />
        </MemoryRouter>,
      )

      expect(screen.getByText('Bienvenido a CFS')).toBeInTheDocument()
    })

    it('should render subtext about exploring the catalog', () => {
      render(
        <MemoryRouter>
          <Hero />
        </MemoryRouter>,
      )

      expect(screen.getByText(/Explora nuestro catálogo/i)).toBeInTheDocument()
    })
  })

  describe('CTA Buttons', () => {
    it('should render "Ver catálogo" button linking to /catalog', () => {
      render(
        <MemoryRouter>
          <Hero />
        </MemoryRouter>,
      )

      const catalogoLink = screen.getByText('Ver catálogo').closest('a')
      expect(catalogoLink).toHaveAttribute('href', '/catalog')
    })

    it('should render "Iniciar sesión" button linking to /login', () => {
      render(
        <MemoryRouter>
          <Hero />
        </MemoryRouter>,
      )

      const loginLink = screen.getByText('Iniciar sesión').closest('a')
      expect(loginLink).toHaveAttribute('href', '/login')
    })
  })

  describe('Styling', () => {
    it('should apply gradient background class', () => {
      render(
        <MemoryRouter>
          <Hero />
        </MemoryRouter>,
      )

      const heroSection = screen.getByTestId('hero-section')
      expect(heroSection).toHaveClass('bg-gradient-to-br', 'from-slate-900', 'via-slate-800', 'to-slate-900')
    })

    it('should render inside a section element', () => {
      render(
        <MemoryRouter>
          <Hero />
        </MemoryRouter>,
      )

      const section = screen.getByTestId('hero-section')
      expect(section.tagName).toBe('SECTION')
    })
  })
})
