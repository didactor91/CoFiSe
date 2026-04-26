import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '../../../components/layout/Footer'

describe('Footer Component', () => {
  describe('Copyright Text', () => {
    it('should render CFS copyright with current year', () => {
      const currentYear = new Date().getFullYear()
      render(<Footer />)

      expect(screen.getByText(new RegExp(`© ${currentYear} CFS`, 'i'))).toBeInTheDocument()
    })

    it('should render "Todos los derechos reservados." text', () => {
      render(<Footer />)

      expect(screen.getByText(/Todos los derechos reservados/i)).toBeInTheDocument()
    })

    it('should display full copyright text', () => {
      const currentYear = new Date().getFullYear()
      render(<Footer />)

      // The full text spans multiple elements due to year interpolation
      const copyrightElement = screen.getByRole('contentinfo')
      expect(copyrightElement).toHaveTextContent(`© ${currentYear}`)
      expect(copyrightElement).toHaveTextContent('CFS')
      expect(copyrightElement).toHaveTextContent('Todos los derechos reservados.')
    })
  })

  describe('Styling', () => {
    it('should use app-shell class for consistent container', () => {
      render(<Footer />)

      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveClass('app-shell')
    })

    it('should center the text', () => {
      render(<Footer />)

      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveClass('text-center')
    })
  })
})
