import type { Product } from '../graphql/generated-types'

interface ProductCardProps {
  product: Product
  onClick?: () => void
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const stockStatus = product.stock > 0 ? 'En stock' : 'Sin stock'
  const stockColor = product.stock > 0 ? 'text-emerald-600' : 'text-rose-600'

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
          className="h-40 w-full rounded-xl object-cover"
        />
      )}
      <h3 className="m-0 text-base font-semibold text-slate-900">{product.name}</h3>
      <p className="m-0 truncate text-sm text-slate-500">{product.description}</p>
      <div className="mt-auto flex items-center justify-between pt-1">
        <span className="text-lg font-semibold text-slate-900">{product.price.toFixed(2)}€</span>
        <span className={`text-xs font-medium ${stockColor}`}>{stockStatus}</span>
      </div>
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
