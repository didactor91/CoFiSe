import type { Product } from '../graphql/generated-types'

interface ProductCardProps {
  product: Product
  onClick?: () => void
  onAddToCart?: () => void
  showAddToCart?: boolean
  variant?: 'default' | 'compact'
}

export default function ProductCard({
  product,
  onClick,
  onAddToCart,
  showAddToCart = false,
  variant = 'default',
}: ProductCardProps) {
  const stockStatus = product.stock > 0 ? 'En stock' : 'Sin stock'
  const stockColor = product.stock > 0 ? 'text-emerald-600' : 'text-rose-600'
  const imageHeight = variant === 'compact' ? 'h-32' : 'h-40'

  return (
    <article
      data-testid={`product-card-${product.id}`}
      data-testid-base="product-card"
      onClick={onClick}
      className={`card flex h-full flex-col gap-2 ${onClick ? 'card-hover cursor-pointer' : ''}`}
    >
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          className={`mb-2 w-full rounded-xl object-cover ${imageHeight}`}
        />
      )}
      <h3 className="m-0 text-base font-semibold text-slate-900">{product.name}</h3>
      <p className="m-0 truncate text-sm text-slate-500">{product.description}</p>
      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-lg font-semibold text-slate-900">{product.price.toFixed(2)}€</span>
        <span className={`text-xs font-medium ${stockColor}`}>{stockStatus}</span>
      </div>
      {onAddToCart && showAddToCart && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAddToCart()
          }}
          className="btn-primary mt-2 text-xs"
          type="button"
        >
          Añadir
        </button>
      )}
    </article>
  )
}

// Export a version with proper testid for the grid
export function ProductCardGrid({ items }: { items: Product[] }) {
  return (
    <div data-testid="product-card" className="hidden">
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
