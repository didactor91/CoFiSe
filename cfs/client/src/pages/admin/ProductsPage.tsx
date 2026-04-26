import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type {
  CreateProductMutationResult,
  CreateProductOptionMutationResult,
  OptionValue,
  Product,
} from '../../graphql/generated-types'
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useCreateProductOptionMutation,
  useAddOptionValuesMutation,
  useDeleteProductOptionMutation,
} from '../../graphql/mutations'
import { useProductsQuery } from '../../graphql/queries'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../shared/ui/Button'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Panel } from '../../shared/ui/Panel'
import theme from '../../theme'

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

interface ProductFormState {
  name: string
  description: string
  price: string
  stock: string
  imageUrl: string
  hasOptions: boolean
  optionLabel: string
  optionValues: { value: string; stock: number | null }[]
  limitedStock: boolean
}

const emptyProductForm: ProductFormState = {
  name: '',
  description: '',
  price: '',
  stock: '',
  imageUrl: '',
  hasOptions: false,
  optionLabel: '',
  optionValues: [],
  limitedStock: true,
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [productsResult] = useProductsQuery()
  const [, createProductMutation] = useCreateProductMutation()
  const [, updateProductMutation] = useUpdateProductMutation()
  const [, deleteProductMutation] = useDeleteProductMutation()
  const [, createProductOptionMutation] = useCreateProductOptionMutation()
  const [, addOptionValuesMutation] = useAddOptionValuesMutation()
  const [, deleteProductOptionMutation] = useDeleteProductOptionMutation()

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
  const canEdit = can('product.update')
  const canDelete = can('product.delete')

  // Form state
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productFormError, setProductFormError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm)

  // Option value management within product form
  const handleToggleHasOptions = () => {
    setProductForm(prev => ({
      ...prev,
      hasOptions: !prev.hasOptions,
      optionValues: !prev.hasOptions ? prev.optionValues : [],
      optionLabel: !prev.hasOptions ? prev.optionLabel : '',
    }))
  }

  const handleOptionLabelChange = (label: string) => {
    setProductForm(prev => ({ ...prev, optionLabel: label }))
  }

  const handleAddOptionValue = () => {
    setProductForm(prev => ({
      ...prev,
      optionValues: [...prev.optionValues, { value: '', stock: null }],
    }))
  }

  const handleOptionValueChange = (index: number, field: 'value' | 'stock', rawVal: string) => {
    setProductForm(prev => {
      const newValues = [...prev.optionValues]
      if (field === 'value') {
        newValues[index] = { ...newValues[index], value: rawVal }
      } else {
        newValues[index] = { ...newValues[index], stock: rawVal === '' ? null : parseInt(rawVal, 10) || 0 }
      }
      return { ...prev, optionValues: newValues }
    })
  }

  const handleRemoveOptionValue = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      optionValues: prev.optionValues.filter((_, i) => i !== index),
    }))
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setProductForm(emptyProductForm)
    setProductFormError(null)
    setShowProductForm(true)
  }

  const handleEditProduct = (product: Product) => {
    let optionValues: { value: string; stock: number | null }[] = []
    let hasOptions = false
    let optionLabel = ''

    if (product.options && product.options.length > 0) {
      const opt = product.options[0]
      hasOptions = true
      optionLabel = opt.name
      optionValues = opt.values.map((v: OptionValue) => ({ value: v.value, stock: v.stock ?? null }))
    }

    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock !== null ? product.stock.toString() : '',
      imageUrl: product.imageUrl || '',
      hasOptions,
      optionLabel,
      optionValues,
      limitedStock: product.limitedStock,
    })
    setProductFormError(null)
    setShowProductForm(true)
  }

  const handleProductFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProductFormError(null)

    const price = parseFloat(productForm.price)
    const stock = parseInt(productForm.stock, 10)

    if (!productForm.name.trim()) {
      setProductFormError('El nombre es requerido')
      return
    }
    if (productForm.name.length > 500) {
      setProductFormError('El nombre debe tener 500 caracteres o menos')
      return
    }
    if (isNaN(price) || price <= 0) {
      setProductFormError('El precio debe ser mayor que 0')
      return
    }
    if (productForm.hasOptions) {
      if (!productForm.optionLabel.trim()) {
        setProductFormError('La etiqueta de la opción es requerida (ej: Talla, Color)')
        return
      }
      if (productForm.optionValues.length === 0) {
        setProductFormError('Debes añadir al menos un valor para la opción')
        return
      }
      for (const ov of productForm.optionValues) {
        if (!ov.value.trim()) {
          setProductFormError('Todos los valores deben tener texto')
          return
        }
      }
    } else {
      if (isNaN(stock) || stock < 0) {
        setProductFormError('El stock debe ser 0 o mayor')
        return
      }
    }

    try {
      if (editingProduct) {
        const result = await updateProductMutation({
          id: editingProduct.id,
          input: {
            name: productForm.name,
            description: productForm.description,
            price,
            stock: productForm.hasOptions ? 0 : stock,
            limitedStock: productForm.limitedStock,
            imageUrl: productForm.imageUrl || undefined
          }
        })
        if (result.error) {
          setProductFormError(result.error.message)
          return
        }

        // Handle options update
        if (productForm.hasOptions && productForm.optionValues.length > 0) {
          if (editingProduct.options && editingProduct.options.length > 0) {
            await deleteProductOptionMutation({ id: editingProduct.options[0].id })
          }
          const optResult = await createProductOptionMutation({
            input: {
              productId: editingProduct.id,
              name: productForm.optionLabel,
              required: true,
            }
          })
          if (optResult.error) {
            setProductFormError(optResult.error.message)
            return
          }
          const optionId = (optResult.data as CreateProductOptionMutationResult | undefined)?.createProductOption?.id
          if (optionId) {
            await addOptionValuesMutation({
              optionId,
              values: productForm.optionValues.map(ov => ({ value: ov.value, stock: ov.stock })),
            })
          }
        } else if (!productForm.hasOptions && editingProduct.options && editingProduct.options.length > 0) {
          await deleteProductOptionMutation({ id: editingProduct.options[0].id })
        }
      } else {
        const result = await createProductMutation({
          input: {
            name: productForm.name,
            description: productForm.description,
            price,
            stock: productForm.hasOptions ? 0 : stock,
            limitedStock: productForm.limitedStock,
            imageUrl: productForm.imageUrl || undefined
          }
        })
        if (result.error) {
          setProductFormError(result.error.message)
          return
        }

        if (productForm.hasOptions && productForm.optionValues.length > 0) {
          const productId = (result.data as CreateProductMutationResult | undefined)?.createProduct?.id
          if (productId) {
            const optResult = await createProductOptionMutation({
              input: {
                productId,
                name: productForm.optionLabel,
                required: true,
              }
            })
            if (optResult.error) {
              setProductFormError(optResult.error.message)
              return
            }
            const optionId = (optResult.data as CreateProductOptionMutationResult | undefined)?.createProductOption?.id
            if (optionId) {
              await addOptionValuesMutation({
                optionId,
                values: productForm.optionValues.map(ov => ({ value: ov.value, stock: ov.stock })),
              })
            }
          }
        }
      }

      setShowProductForm(false)
      setEditingProduct(null)
      setProductForm(emptyProductForm)
    } catch (err: unknown) {
      setProductFormError(toErrorMessage(err, 'Error al guardar el producto'))
    }
  }

  const handleDeleteProductClick = (productId: string) => {
    setDeleteConfirm(productId)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      const result = await deleteProductMutation({ id: deleteConfirm })
      if (result.error) {
        setProductFormError(result.error.message)
      }
    } catch (err: unknown) {
      setProductFormError(toErrorMessage(err, 'Error al eliminar el producto'))
    }
    setDeleteConfirm(null)
  }

  const handleCancelDelete = () => {
    setDeleteConfirm(null)
  }

  return (
    <div data-testid="products-page">
      <PageHeader
        title="Gestión de Productos"
        action={canCreate ? <Button onClick={handleAddProduct}>Añadir Producto</Button> : undefined}
      />

      {/* Product Form Modal */}
      {showProductForm && (
        <Panel style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
        <form
          data-testid="product-form"
          onSubmit={handleProductFormSubmit}
          style={{}}
        >
          {/* Basic Info Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: theme.spacing.md }}>
            <div>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                Nombre *
              </label>
              <input
                type="text"
                placeholder="Nombre del producto"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                required
                maxLength={500}
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
            <div>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                Precio (€) *
              </label>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                required
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
          </div>

          {/* Description */}
          <div style={{ marginTop: theme.spacing.md }}>
            <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
              Descripción *
            </label>
            <textarea
              placeholder="Descripción del producto"
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              required
              rows={3}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                background: theme.colors.background,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.sm,
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.sm,
                resize: 'vertical',
              }}
            />
          </div>

          {/* Image URL */}
          <div style={{ marginTop: theme.spacing.md }}>
            <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
              URL de Imagen (opcional)
            </label>
            <input
              type="text"
              placeholder="https://..."
              value={productForm.imageUrl}
              onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
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

          {/* Stock section - only if no options */}
          {!productForm.hasOptions && (
            <div style={{ marginTop: theme.spacing.md }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                <label style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>
                  Stock limitado
                </label>
                <input
                  type="checkbox"
                  checked={productForm.limitedStock}
                  onChange={(e) => setProductForm({ ...productForm, limitedStock: e.target.checked })}
                  style={{ marginLeft: theme.spacing.sm, width: '16px', height: '16px' }}
                />
              </div>
              {productForm.limitedStock && (
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  required
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
              )}
              {!productForm.limitedStock && (
                <p style={{ color: theme.colors.success, fontSize: theme.typography.fontSize.xs, fontStyle: 'italic' }}>
                  Stock infinito (sin límite)
                </p>
              )}
            </div>
          )}

          {/* Options toggle */}
          <div style={{ marginTop: theme.spacing.lg, paddingTop: theme.spacing.md, borderTop: `1px solid ${theme.colors.border}` }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={productForm.hasOptions}
                onChange={handleToggleHasOptions}
                style={{ marginRight: theme.spacing.sm, width: '18px', height: '18px' }}
              />
              <span style={{ color: theme.colors.text, fontWeight: theme.typography.fontWeight.medium }}>
                Añadir opciones de producto (talla, color, etc.)
              </span>
            </label>
            <p style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginTop: theme.spacing.xs, marginLeft: '26px' }}>
              Si activas esta opción, el stock se calculará como la suma del stock de cada valor de opción
            </p>
          </div>

          {/* Expanded options panel */}
          {productForm.hasOptions && (
            <div style={{
              marginTop: theme.spacing.md,
              padding: theme.spacing.md,
              background: theme.colors.background,
              borderRadius: theme.borderRadius.sm,
              border: `1px solid ${theme.colors.border}`
            }}>
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  Nombre de la opción
                </label>
                <input
                  type="text"
                  placeholder="Ej: Talla, Color, Medida..."
                  value={productForm.optionLabel}
                  onChange={(e) => handleOptionLabelChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    background: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.sm,
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.sm,
                  }}
                />
              </div>

              <div style={{ marginTop: theme.spacing.md }}>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  Valores de la opción
                </label>

                {productForm.optionValues.map((ov, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: theme.spacing.sm,
                      alignItems: 'center',
                      marginBottom: theme.spacing.sm,
                      padding: theme.spacing.sm,
                      background: theme.colors.surface,
                      borderRadius: theme.borderRadius.sm,
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Valor (ej: S, M, L, XL, Rojo)"
                      value={ov.value}
                      onChange={(e) => handleOptionValueChange(index, 'value', e.target.value)}
                      style={{
                        flex: 1,
                        padding: theme.spacing.xs,
                        background: theme.colors.background,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.sm,
                        color: theme.colors.text,
                        fontSize: theme.typography.fontSize.sm,
                      }}
                    />

                    <label style={{ display: 'flex', alignItems: 'center', fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={ov.stock !== null}
                        onChange={(e) => handleOptionValueChange(index, 'stock', e.target.checked ? '0' : '')}
                        style={{ marginRight: '4px', width: '14px', height: '14px' }}
                      />
                      Stock finito
                    </label>

                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={ov.stock === null ? '' : ov.stock}
                      onChange={(e) => handleOptionValueChange(index, 'stock', e.target.value)}
                      disabled={ov.stock === null}
                      style={{
                        width: '80px',
                        padding: theme.spacing.xs,
                        background: ov.stock === null ? theme.colors.border : theme.colors.background,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.sm,
                        color: ov.stock === null ? theme.colors.textSecondary : theme.colors.text,
                        fontSize: theme.typography.fontSize.sm,
                      }}
                    />

                    <Button
                      type="button"
                      onClick={() => handleRemoveOptionValue(index)}
                      variant="danger"
                      style={{ padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                    >
                      ×
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  onClick={handleAddOptionValue}
                  variant="ghost"
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                  }}
                >
                  + Añadir valor
                </Button>
              </div>
            </div>
          )}

          {productFormError && (
            <p style={{ color: theme.colors.error, marginTop: theme.spacing.md, fontSize: theme.typography.fontSize.sm }}>
              {productFormError}
            </p>
          )}

          <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <Button type="submit">
              {editingProduct ? 'Actualizar' : 'Crear'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => { setShowProductForm(false); setEditingProduct(null); }}>
              Cancelar
            </Button>
          </div>
        </form>
        </Panel>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          testId="delete-confirm-dialog"
          message="¿Eliminar producto? Esta acción no se puede deshacer."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
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
                      {canEdit && (
                        <Button
                          data-testid={`edit-product-btn-${product.id}`}
                          onClick={() => handleEditProduct(product)}
                          style={{ marginRight: theme.spacing.xs, padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                        >
                          Editar
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          data-testid={`delete-product-btn-${product.id}`}
                          onClick={() => handleDeleteProductClick(product.id)}
                          variant="secondary"
                          style={{ padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}
                        >
                          Eliminar
                        </Button>
                      )}
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
