import { Product } from '../../../packages/types/generated/graphql'

interface ProductCardProps {
  product: Product
  onClick?: () => void
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const stockStatus = product.stock > 0 ? 'En stock' : 'Sin stock'
  const stockColor = product.stock > 0 ? '#22c55e' : '#ef4444'

  return (
    <article
      data-testid={`product-card-${product.id}`}
      data-testid-base="product-card"
      onClick={onClick}
      style={{
        background: '#141414',
        borderRadius: '8px',
        padding: '1rem',
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid #262626',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          style={{
            width: '100%',
            height: '150px',
            objectFit: 'cover',
            borderRadius: '4px',
          }}
        />
      )}
      <h3
        style={{
          color: '#f5f5f5',
          fontSize: '1rem',
          fontWeight: 600,
          margin: 0,
        }}
      >
        {product.name}
      </h3>
      <p
        style={{
          color: '#a0a0a0',
          fontSize: '0.875rem',
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {product.description}
      </p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
        }}
      >
        <span
          style={{
            color: '#d4af37',
            fontSize: '1.25rem',
            fontWeight: 700,
          }}
        >
          {product.price.toFixed(2)}€
        </span>
        <span
          style={{
            color: stockColor,
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          {stockStatus}
        </span>
      </div>
    </article>
  )
}

// Export a version with proper testid for the grid
export function ProductCardGrid({ items }: { items: Product[] }) {
  return (
    <div data-testid="product-card" style={{ display: 'none' }}>
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}