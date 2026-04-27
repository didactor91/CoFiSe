import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Product } from '../../graphql/generated-types'
import { useDeleteProductMutation } from '../../graphql/mutations'
import { useProductsQuery } from '../../graphql/queries'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../shared/ui/Button'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Panel } from '../../shared/ui/Panel'
import theme from '../../theme'

export default function ProductsPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [productsResult] = useProductsQuery()
  const [, deleteProductMutation] = useDeleteProductMutation()

  const products: Product[] = productsResult.data?.products ?? []

  // Search filter state
  const [searchQuery, setSearchQuery] = useState('')

  // Filter products based on search query
  const filteredProducts = searchQuery.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products

  // Permissions
  const canCreate = can('product.create')

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDeleteProductClick = (productId: string) => {
    setDeleteConfirm(productId)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      await deleteProductMutation({ id: deleteConfirm })
    } catch (err) {
      console.error('Error deleting product:', err)
    }
    setDeleteConfirm(null)
    productsResult.refetch({ requestPolicy: 'network-only' })
  }

  return (
    <div data-testid="products-page">
      <PageHeader
        title="Gestión de Productos"
        action={canCreate ? <Button onClick={() => navigate('/admin/products/new')}>Añadir Producto</Button> : undefined}
      />

      {deleteConfirm && (
        <ConfirmDialog
          testId="delete-confirm-dialog"
          message="¿Eliminar producto? Esta acción no se puede deshacer."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Product List Table */}
      <Panel style={{ overflow: 'hidden' }}>
        {/* Search input */}
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}` }}>
          <input
            type="text"
            placeholder="Buscar productos por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="product-search-input"
            style={{
              width: '100%',
              padding: theme.spacing.sm,
              background: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.sm,
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.sm,
            }}
          />
        </div>

        {filteredProducts.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
            {searchQuery ? 'No hay productos que coincidan con la búsqueda' : 'No hay productos. Haz clic en \'Añadir Producto\' para crear uno.'}
          </p>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">Nombre</th>
                  <th className="admin-th">Precio</th>
                  <th className="admin-th">Stock</th>
                  <th className="admin-th text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}?from=admin`)}
                    className="admin-row cursor-pointer"
                  >
                    <td className="admin-td font-medium text-slate-800">{product.name}</td>
                    <td className="admin-td">€{product.price.toFixed(2)}</td>
                    <td
                      className="admin-td"
                      style={{
                        color: !product.limitedStock ? theme.colors.success : (product.stock === 0 ? theme.colors.error : theme.colors.text),
                        fontWeight: product.stock === 0 ? theme.typography.fontWeight.bold : undefined
                      }}
                    >
                      {!product.limitedStock ? 'Ilimitado' : (product.stock === 0 ? '⚠️ 0' : product.stock)}
                    </td>
                    <td className="admin-td text-right">
                      <Button
                        data-testid={`delete-product-btn-${product.id}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProductClick(product.id)
                        }}
                        variant="secondary"
                        style={{ padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                      >
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}