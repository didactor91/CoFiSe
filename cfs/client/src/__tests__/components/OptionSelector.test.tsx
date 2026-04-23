import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OptionSelector from '../../components/OptionSelector'

// Mock theme
vi.mock('../theme', () => ({
  default: {
    colors: {
      accent: '#d4af37',
      text: '#f5f5f5',
      textSecondary: '#a0a0a0',
      border: '#262626',
      surface: '#141414',
      success: '#22c55e',
      error: '#ef4444',
      disabled: '#4a4a4a',
      disabledText: '#888888',
    },
    typography: {
      fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.25rem' },
      fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
    },
    spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem' },
    borderRadius: { sm: '4px', md: '8px' },
  },
}))

describe('OptionSelector', () => {
  const sizeOption = {
    id: 'opt1',
    name: 'Talla',
    type: 'SIZE' as const,
    required: true,
    values: [
      { id: 'ov1', value: 'S', stock: null },
      { id: 'ov2', value: 'M', stock: 10 },
      { id: 'ov3', value: 'L', stock: 5 },
      { id: 'ov4', value: 'XL', stock: 0 },
    ],
  }

  const colorOption = {
    id: 'opt2',
    name: 'Color',
    type: 'COLOR' as const,
    required: false,
    values: [
      { id: 'ov5', value: 'Rojo', stock: 20 },
      { id: 'ov6', value: 'Verde', stock: null },
      { id: 'ov7', value: 'Azul', stock: 0 },
    ],
  }

  // Helper to find button by value (stock suffix varies)
  const getButtonByValue = (value: string) => {
    const buttons = screen.getAllByRole('button')
    return buttons.find(btn => btn.textContent?.startsWith(value + ''))!
  }

  describe('Rendering', () => {
    it('should render SIZE option as chips/buttons', () => {
      const onSelect = vi.fn()
      render(
        <OptionSelector
          productId="p1"
          options={[sizeOption]}
          onSelect={onSelect}
        />
      )

      // SIZE chips should be rendered
      expect(getButtonByValue('S')).toBeInTheDocument()
      expect(getButtonByValue('M')).toBeInTheDocument()
      expect(getButtonByValue('L')).toBeInTheDocument()
      expect(getButtonByValue('XL')).toBeInTheDocument()
    })

    it('should render COLOR option with color names', () => {
      const onSelect = vi.fn()
      render(
        <OptionSelector
          productId="p1"
          options={[colorOption]}
          onSelect={onSelect}
        />
      )

      expect(getButtonByValue('Rojo')).toBeInTheDocument()
      expect(getButtonByValue('Verde')).toBeInTheDocument()
      expect(getButtonByValue('Azul')).toBeInTheDocument()
    })

    it('should display option name as label', () => {
      const onSelect = vi.fn()
      render(
        <OptionSelector
          productId="p1"
          options={[sizeOption]}
          onSelect={onSelect}
        />
      )

      expect(screen.getByText('Talla')).toBeInTheDocument()
    })
  })

  describe('Stock display', () => {
    it('should show "∞" symbol for NULL stock', () => {
      const onSelect = vi.fn()
      render(
        <OptionSelector
          productId="p1"
          options={[sizeOption]}
          onSelect={onSelect}
        />
      )

      // S has NULL stock - button should contain ∞ symbol
      const sButton = getButtonByValue('S')
      expect(sButton.textContent).toContain('∞')
    })

    it('should show number for finite stock', () => {
      const onSelect = vi.fn()
      render(
        <OptionSelector
          productId="p1"
          options={[sizeOption]}
          onSelect={onSelect}
        />
      )

      // M has stock of 10
      const mButton = getButtonByValue('M')
      expect(mButton.textContent).toContain('10')
    })

    it('should show "Sin stock" for zero stock', () => {
      const onSelect = vi.fn()
      render(
        <OptionSelector
          productId="p1"
          options={[sizeOption]}
          onSelect={onSelect}
        />
      )

      // XL has stock of 0 - should show Sin stock
      const xlButton = getButtonByValue('XL')
      expect(xlButton.textContent).toContain('Sin stock')
    })
  })

  describe('Selection behavior', () => {
    it('should call onSelect with optionId and valueId when a chip is clicked', () => {
      const onSelect = vi.fn()
      render(
        <OptionSelector
          productId="p1"
          options={[sizeOption]}
          onSelect={onSelect}
        />
      )

      fireEvent.click(getButtonByValue('M'))

      expect(onSelect).toHaveBeenCalledWith('opt1', 'ov2')
    })

    it('should mark selected chip with data-selected attribute', () => {
      const onSelect = vi.fn()
      render(
        <OptionSelector
          productId="p1"
          options={[sizeOption]}
          onSelect={onSelect}
          selectedValueId="ov2"
        />
      )

      const mButton = getButtonByValue('M')
      expect(mButton).toHaveAttribute('data-selected', 'true')
    })
  })

  describe('Disabled state for out-of-stock', () => {
    it('should disable chips with stock = 0', () => {
      const onSelect = vi.fn()
      render(
        <OptionSelector
          productId="p1"
          options={[sizeOption]}
          onSelect={onSelect}
        />
      )

      const xlButton = getButtonByValue('XL')
      expect(xlButton).toBeDisabled()
    })

    it('should allow clicks on available stock chips', () => {
      const onSelect = vi.fn()
      render(
        <OptionSelector
          productId="p1"
          options={[sizeOption]}
          onSelect={onSelect}
        />
      )

      fireEvent.click(getButtonByValue('M'))
      expect(onSelect).toHaveBeenCalled()
    })
  })

  describe('Required validation', () => {
    it('should NOT show error when required option has selection', () => {
      const onSelect = vi.fn()
      render(
        <OptionSelector
          productId="p1"
          options={[sizeOption]}
          onSelect={onSelect}
          selectedValueId="ov2"
        />
      )

      expect(screen.queryByText('Selecciona una talla')).not.toBeInTheDocument()
    })

    it('should show error when required option has no selection and error prop is provided', () => {
      const onSelect = vi.fn()
      render(
        <OptionSelector
          productId="p1"
          options={[sizeOption]}
          onSelect={onSelect}
          selectedValueId={undefined}
          error="Selecciona una talla"
        />
      )

      expect(screen.queryByText('Selecciona una talla')).toBeInTheDocument()
    })

    it('should show error message specific to option name', () => {
      const onSelect = vi.fn()
      render(
        <OptionSelector
          productId="p1"
          options={[sizeOption]}
          onSelect={onSelect}
          selectedValueId={undefined}
          error="Selecciona una talla"
        />
      )

      expect(screen.getByText('Selecciona una talla')).toBeInTheDocument()
    })

    it('should not show error for non-required options without selection', () => {
      const onSelect = vi.fn()
      render(
        <OptionSelector
          productId="p1"
          options={[colorOption]}
          onSelect={onSelect}
          selectedValueId={undefined}
        />
      )

      // No error should be shown for non-required option
      expect(screen.queryByText(/Selecciona/i)).not.toBeInTheDocument()
    })
  })

  describe('Multiple options', () => {
    it('should render multiple option groups', () => {
      const onSelect = vi.fn()
      render(
        <OptionSelector
          productId="p1"
          options={[sizeOption, colorOption]}
          onSelect={onSelect}
        />
      )

      // Both options should be visible
      expect(screen.getByText('Talla')).toBeInTheDocument()
      expect(screen.getByText('Color')).toBeInTheDocument()
    })
  })
})