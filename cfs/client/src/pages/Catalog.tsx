import { useState } from 'react'
import { useProductsQuery } from '../graphql/queries'
import ProductCard from '../components/ProductCard'
import OptionSelector from '../components/OptionSelector'
import CartDrawer from '../components/CartDrawer'
import { useCart } from '../context/CartContext'
import type { Product } from '../graphql/generated-types'
import type { ProductOption } from '../components/OptionSelector'
import theme from '../theme'

interface OptionState {
  product: Product
  options: ProductOption[]
}

export default function Catalog() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [optionState, setOptionState] = useState<OptionState | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [selectedOptionValueId, setSelectedOptionValueId] = useState<string | undefined>()
  const [optionError, setOptionError] = useState<string | undefined>()
  const [productsResult] = useProductsQuery()
  const { addToCart } = useCart()

  const { data } = productsResult
  const products = data?.products ?? []

  // Mock options data - in real app would come from GraphQL
  // This is structured to match the OptionSelector interface
  const mockOptions: Record<string, ProductOption[]> = {
    // Products with options would have their config here
  }

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
  }

  const handleAddToCart = (product: Product) => {
    const options = mockOptions[product.id] || []
    
    if (options.length > 0) {
      // Show option selector
      setOptionState({ product, options })
      setSelectedOptionValueId(undefined)
      setOptionError(undefined)
    } else {
      // No options - add directly to cart
      addToCart({
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        optionValueId: null,
        optionValueName: null,
        quantity: 1,
      })
      setCartOpen(true)
    }
  }

  const handleOptionSelect = (optionId: string, valueId: string) => {
    setSelectedOptionValueId(valueId)
    setOptionError(undefined)
  }

  const handleConfirmAddToCart = () => {
    if (!optionState) return

    const option = optionState.options[0] // Single selector per product
    if (option.required && !selectedOptionValueId) {
      setOptionError(`Selecciona un ${option.name.toLowerCase()}`)
      return
    }

    const selectedValue = option.values.find(v => v.id === selectedOptionValueId)

    addToCart({
      productId: optionState.product.id,
      productName: optionState.product.name,
      productPrice: optionState.product.price,
      optionValueId: selectedOptionValueId || null,
      optionValueName: selectedValue?.value || null,
      quantity: 1,
    })

    setOptionState(null)
    setSelectedOptionValueId(undefined)
    setCartOpen(true)
  }

  const handleCloseOptionSelector = () => {
    setOptionState(null)
    setSelectedOptionValueId(undefined)
    setOptionError(undefined)
  }

  const handleReservationSuccess = () => {
    setSelectedProduct(null)
    alert('Reserva creada exitosamente')
  }

  if (selectedProduct) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0a',
          padding: '2rem',
        }}
      >
        <button
          onClick={() => setSelectedProduct(null)}
          style={{
            background: 'transparent',
            border: '1px solid #d4af37',
            borderRadius: '4px',
            padding: '0.5rem 1rem',
            color: '#d4af37',
            cursor: 'pointer',
            marginBottom: '2rem',
          }}
        >
          ← Volver al catálogo
        </button>
        {/* For now, redirect to old flow - will be replaced by checkout in Phase 5 */}
        <div style={{ color: theme.colors.textSecondary }}>
          Reservas directas deshabilitadas durante desarrollo del carrito
        </div>
      </div>
    )
  }

  return (
    <div
      data-testid="catalog-page"
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        padding: '2rem',
      }}
    >
      <h1
        style={{
          color: '#d4af37',
          fontSize: '2rem',
          fontWeight: 600,
          marginBottom: '2rem',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Catálogo
      </h1>

      {products.length === 0 ? (
        <p
          style={{
            color: '#a0a0a0',
            fontSize: '1rem',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '3rem',
          }}
        >
          No hay productos disponibles
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {products.map((product) => (
            <div key={product.id} style={{ position: 'relative' }}>
              <ProductCard
                product={product}
                onClick={() => handleProductClick(product)}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddToCart(product)
                }}
                style={{
                  position: 'absolute',
                  bottom: theme.spacing.md,
                  right: theme.spacing.md,
                  background: theme.colors.accent,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.background,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                }}
              >
                Añadir al carrito
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Cart button (floating) */}
      <button
        onClick={() => setCartOpen(true)}
        aria-label="Abrir carrito"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: theme.colors.accent,
          border: 'none',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          color: theme.colors.background,
          fontSize: '1.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        🛒
      </button>

      {/* Option Selector Modal */}
      {optionState && (
        <>
          <div
            onClick={handleCloseOptionSelector}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 998,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.lg,
              width: '90%',
              maxWidth: '400px',
              zIndex: 999,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <h3
              style={{
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                marginBottom: theme.spacing.md,
                margin: 0,
              }}
            >
              Selecciona opción: {optionState.product.name}
            </h3>
            <OptionSelector
              productId={optionState.product.id}
              options={optionState.options}
              onSelect={handleOptionSelect}
              selectedValueId={selectedOptionValueId}
              error={optionError}
            />
            <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
              <button
                onClick={handleCloseOptionSelector}
                style={{
                  flex: 1,
                  padding: theme.spacing.md,
                  background: 'transparent',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.textSecondary,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAddToCart}
                style={{
                  flex: 1,
                  padding: theme.spacing.md,
                  background: theme.colors.accent,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  color: theme.colors.background,
                  fontWeight: theme.typography.fontWeight.bold,
                  cursor: 'pointer',
                }}
              >
                Añadir al carrito
              </button>
            </div>
          </div>
        </>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}