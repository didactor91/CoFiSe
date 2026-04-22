import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import NewsCard from '../../components/NewsCard'

describe('NewsCard Component', () => {
  const mockNews = {
    id: '1',
    title: 'Noticia de Prueba',
    content: 'Este es el contenido completo de la noticia de prueba.',
    imageUrl: null,
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-04-20T10:00:00Z',
  }

  describe('Rendering', () => {
    it('should display news title', () => {
      render(<NewsCard news={mockNews} />)

      expect(screen.getByText('Noticia de Prueba')).toBeInTheDocument()
    })

    it('should display news content excerpt', () => {
      render(<NewsCard news={mockNews} />)

      // Should show truncated content (100 chars)
      expect(screen.getByText(/Este es el contenido completo/i)).toBeInTheDocument()
    })

    it('should display formatted date', () => {
      render(<NewsCard news={mockNews} />)

      // Should show formatted date in Spanish
      expect(screen.getByText(/20 de abril de 2026/i)).toBeInTheDocument()
    })
  })

  describe('Click Interaction', () => {
    it('should be clickable when onClick is provided', () => {
      const handleClick = vi.fn()
      render(<NewsCard news={mockNews} onClick={handleClick} />)

      screen.getByTestId('news-card-1').click()
      expect(handleClick).toHaveBeenCalled()
    })

    it('should not have cursor pointer when onClick is not provided', () => {
      render(<NewsCard news={mockNews} />)

      const card = screen.getByTestId('news-card-1')
      expect(card).not.toHaveStyle({ cursor: 'pointer' })
    })
  })
})