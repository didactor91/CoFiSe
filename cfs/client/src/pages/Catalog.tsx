import { useState } from 'react'
import { useProductsQuery } from '../graphql/queries'
import ProductCard from '../components/ProductCard'
import ReservationForm from '../components/ReservationForm'
import { Product } from '../../../packages/types/generated/graphql'

export default function Catalog() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productsResult] = useProductsQuery()

  const { data } = productsResult
  const products = data?.products ?? []

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
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
        <ReservationForm product={selectedProduct} onSuccess={handleReservationSuccess} />
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
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => handleProductClick(product)}
            />
          ))}
        </div>
      )}
    </div>
  )
}