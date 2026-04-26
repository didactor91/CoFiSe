import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import CartDrawer from '../components/CartDrawer'
import Layout from '../components/layout/Layout'
import OptionSelector, { type ProductOption } from '../components/OptionSelector'
import ProductCard from '../components/ProductCard'
import { useCart } from '../context/CartContext'
import type { Product } from '../graphql/generated-types'
import { useProductsQuery } from '../graphql/queries'

interface OptionState {
  product: Product
  options: ProductOption[]
}

export default function Catalog() {
  const navigate = useNavigate()
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

  if (selectedProduct) {
    return (
      <Layout>
        <div className="app-shell min-h-svh">
          <button
            onClick={() => setSelectedProduct(null)}
            className="btn-secondary mb-8"
          >
            ← Volver al catálogo
          </button>
          <div className="card text-slate-600">
            Reservas directas deshabilitadas durante desarrollo del carrito
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="app-shell min-h-svh">
        <button
          onClick={() => navigate('/')}
          className="btn-secondary mb-6"
        >
          ← Inicio
        </button>

        <h1 className="mb-8 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Catálogo</h1>

        {products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm italic text-slate-500">No hay productos disponibles</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product)}
                onAddToCart={() => handleAddToCart(product)}
                showAddToCart={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cart button (floating) */}
      <button
        onClick={() => setCartOpen(true)}
        aria-label="Abrir carrito"
        className="btn-primary fixed right-4 bottom-4 z-40 flex h-14 w-14 items-center justify-center rounded-full p-0 text-xl shadow-lg shadow-slate-400/30 sm:right-8 sm:bottom-8"
      >
        🛒
      </button>

      {/* Option Selector Modal */}
      {optionState && (
        <>
          <div
            onClick={handleCloseOptionSelector}
            className="fixed inset-0 z-[998] bg-slate-900/50 backdrop-blur-sm"
          />
          <div
            className="fixed top-1/2 left-1/2 z-[999] w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
          >
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Selecciona opción: {optionState.product.name}
            </h3>
            <OptionSelector
              productId={optionState.product.id}
              options={optionState.options}
              onSelect={handleOptionSelect}
              selectedValueId={selectedOptionValueId}
              error={optionError}
            />
            <div className="mt-5 flex gap-2">
              <button
                onClick={handleCloseOptionSelector}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAddToCart}
                className="btn-primary flex-1"
              >
                Añadir al carrito
              </button>
            </div>
          </div>
        </>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </Layout>
  )
}
