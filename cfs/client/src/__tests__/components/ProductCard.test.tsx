import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductCard from '../../components/ProductCard'

describe('ProductCard Component', () => {
  const mockProduct = {
    id: '1',
    name: 'Producto de Prueba',
    description: 'Descripción del producto de prueba',
    price: 99.99,
    stock: 10,
    imageUrl: null,
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-04-20T10:00:00Z',
  }

  describe('Rendering', () => {
    it('should display product name', () => {
      render(<ProductCard product={mockProduct} />)

      expect(screen.getByText('Producto de Prueba')).toBeInTheDocument()
    })

    it('should display product price', () => {
      render(<ProductCard product={mockProduct} />)

      expect(screen.getByText('99.99€')).toBeInTheDocument()
    })

    it('should display stock status when in stock', () => {
      render(<ProductCard product={mockProduct} />)

      expect(screen.getByText('En stock')).toBeInTheDocument()
    })

    it('should display "Sin stock" when out of stock', () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 }
      render(<ProductCard product={outOfStockProduct} />)

      expect(screen.getByText('Sin stock')).toBeInTheDocument()
    })

    it('should display product image when available', () => {
      const productWithImage = {
        ...mockProduct,
        imageUrl: 'http://example.com/image.jpg',
      }
      render(<ProductCard product={productWithImage} />)

      const image = screen.getByAltText('Producto de Prueba')
      expect(image).toHaveAttribute('src', 'http://example.com/image.jpg')
    })
  })

  describe('Click Interaction', () => {
    it('should be clickable when onClick is provided', () => {
      const handleClick = vi.fn()
      render(<ProductCard product={mockProduct} onClick={handleClick} />)

      screen.getByTestId('product-card-1').click()
      expect(handleClick).toHaveBeenCalled()
    })
  })
})
