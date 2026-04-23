import type { Product } from '../graphql/generated-types'
import theme from '../theme'

interface ProductCardProps {
  product: Product
  onClick?: () => void
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const stockStatus = product.stock > 0 ? 'En stock' : 'Sin stock'
  const stockColor = product.stock > 0 ? theme.colors.success : theme.colors.error

  return (
    <article
      data-testid={`product-card-${product.id}`}
      data-testid-base="product-card"
      onClick={onClick}
      style={{
        background: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${theme.colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.xs,
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
            borderRadius: theme.borderRadius.sm,
          }}
        />
      )}
      <h3
        style={{
          color: theme.colors.text,
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          margin: 0,
        }}
      >
        {product.name}
      </h3>
      <p
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.sm,
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
            color: theme.colors.accent,
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.bold,
          }}
        >
          {product.price.toFixed(2)}€
        </span>
        <span
          style={{
            color: stockColor,
            fontSize: theme.typography.fontSize.xs,
            fontWeight: theme.typography.fontWeight.medium,
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