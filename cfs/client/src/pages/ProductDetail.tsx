import React, { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'

import { ImageUpload } from '../components/ImageUpload'
import type {
  CreateProductOptionMutationResult,
  OptionValue,
} from '../graphql/generated-types'
import {
  useUpdateProductMutation,
  useCreateProductOptionMutation,
  useAddOptionValuesMutation,
  useDeleteProductOptionMutation,
} from '../graphql/mutations'
import { useProductQuery } from '../graphql/queries'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../shared/ui/Button'
import { Panel } from '../shared/ui/Panel'
import theme from '../theme'

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

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromAdmin = searchParams.get('from') === 'admin'

  const { can } = useAuth()
  const [result] = useProductQuery(id!)
  const [, updateProductMutation] = useUpdateProductMutation()
  const [, createProductOptionMutation] = useCreateProductOptionMutation()
  const [, addOptionValuesMutation] = useAddOptionValuesMutation()
  const [, deleteProductOptionMutation] = useDeleteProductOptionMutation()

  const canEdit = can('product.update')

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm)
  const [formError, setFormError] = useState<string | null>(null)

  const handleEdit = () => {
    if (!result.data?.product) return
    const product = result.data.product

    let optionValues: { value: string; stock: number | null }[] = []
    let hasOptions = false
    let optionLabel = ''

    if (product.options && product.options.length > 0) {
      const opt = product.options[0]
      hasOptions = true
      optionLabel = opt.name
      optionValues = opt.values.map((v: OptionValue) => ({ value: v.value, stock: v.stock ?? null }))
    }

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
    setFormError(null)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFormError(null)
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const price = parseFloat(productForm.price)
    const stock = parseInt(productForm.stock, 10)

    if (!productForm.name.trim()) {
      setFormError('El nombre es requerido')
      return
    }
    if (productForm.name.length > 500) {
      setFormError('El nombre debe tener 500 caracteres o menos')
      return
    }
    if (isNaN(price) || price <= 0) {
      setFormError('El precio debe ser mayor que 0')
      return
    }
    if (productForm.hasOptions) {
      if (!productForm.optionLabel.trim()) {
        setFormError('La etiqueta de la opción es requerida')
        return
      }
      if (productForm.optionValues.length === 0) {
        setFormError('Debes añadir al menos un valor para la opción')
        return
      }
    } else {
      if (isNaN(stock) || stock < 0) {
        setFormError('El stock debe ser 0 o mayor')
        return
      }
    }

    try {
      const updateResult = await updateProductMutation({
        id: id!,
        input: {
          name: productForm.name,
          description: productForm.description,
          price,
          stock: productForm.hasOptions ? 0 : stock,
          limitedStock: productForm.limitedStock,
          imageUrl: productForm.imageUrl || undefined,
        },
      })
      if (updateResult.error) {
        setFormError(updateResult.error.message)
        return
      }

      const product = result.data?.product
      if (productForm.hasOptions && productForm.optionValues.length > 0) {
        if (product?.options && product.options.length > 0) {
          await deleteProductOptionMutation({ id: product.options[0].id })
        }
        const optResult = await createProductOptionMutation({
          input: {
            productId: id!,
            name: productForm.optionLabel,
            required: true,
          },
        })
        if (optResult.error) {
          setFormError(optResult.error.message)
          return
        }
        const optionId = (optResult.data as CreateProductOptionMutationResult | undefined)?.createProductOption?.id
        if (optionId) {
          await addOptionValuesMutation({
            optionId,
            values: productForm.optionValues.map(ov => ({ value: ov.value, stock: ov.stock })),
          })
        }
      } else if (!productForm.hasOptions && product?.options && product.options.length > 0) {
        await deleteProductOptionMutation({ id: product.options[0].id })
      }

      setIsEditing(false)
      // Refetch will happen automatically
    } catch (err: unknown) {
      setFormError(toErrorMessage(err, 'Error al guardar'))
    }
  }

  if (result.fetching) {
    return (
      <div style={{ textAlign: 'center', padding: theme.spacing['2xl'] }}>
        <div style={{ fontSize: '2rem', marginBottom: theme.spacing.sm }}>⏳</div>
        <p style={{ color: theme.colors.textSecondary }}>Cargando...</p>
      </div>
    )
  }

  if (result.error || !result.data?.product) {
    return (
      <div style={{ textAlign: 'center', padding: theme.spacing['2xl'] }}>
        <p style={{ color: theme.colors.error, marginBottom: theme.spacing.md }}>Producto no encontrado</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            background: theme.colors.accent,
            color: theme.colors.background,
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            cursor: 'pointer',
          }}
        >
          Volver
        </button>
      </div>
    )
  }

  const { product } = result.data

  const getStockBadge = () => {
    if (product.limitedStock === false) {
      return { text: 'Stock infinito', color: theme.colors.textSecondary }
    }
    if (product.stock === 0) {
      return { text: 'Sin stock', color: theme.colors.error }
    }
    return { text: 'En stock', color: theme.colors.success }
  }

  const stockBadge = getStockBadge()

  // Edit mode - show form
  if (isEditing) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: `0 ${theme.spacing.xl}` }}>
        <Panel style={{ padding: theme.spacing.lg }}>
          <h2 style={{ margin: 0, marginBottom: theme.spacing.lg }}>Editar Producto</h2>

          <form onSubmit={handleSubmit}>
            {/* Basic Info Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: theme.spacing.md }}>
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                  maxLength={500}
                  style={{ width: '100%', padding: theme.spacing.sm, background: theme.colors.background, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, fontSize: theme.typography.fontSize.sm }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  Precio (€) *
                </label>
                <input
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  required
                  step="0.01"
                  min="0.01"
                  style={{ width: '100%', padding: theme.spacing.sm, background: theme.colors.background, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, fontSize: theme.typography.fontSize.sm }}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginTop: theme.spacing.md }}>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                Descripción *
              </label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                required
                rows={3}
                style={{ width: '100%', padding: theme.spacing.sm, background: theme.colors.background, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, fontSize: theme.typography.fontSize.sm, resize: 'vertical' }}
              />
            </div>

            {/* Image */}
            <div style={{ marginTop: theme.spacing.md }}>
              <ImageUpload
                entityType="PRODUCT"
                entityId={id}
                currentImageUrl={productForm.imageUrl}
                onUploadComplete={(imageUrl) => setProductForm(prev => ({ ...prev, imageUrl }))}
              />
            </div>

            {/* Stock */}
            {!productForm.hasOptions && (
              <div style={{ marginTop: theme.spacing.md }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                  <label style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>Stock limitado</label>
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
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    min="0"
                    style={{ width: '100%', padding: theme.spacing.sm, background: theme.colors.background, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, fontSize: theme.typography.fontSize.sm }}
                  />
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
                  Añadir opciones de producto
                </span>
              </label>
            </div>

            {/* Options panel */}
            {productForm.hasOptions && (
              <div style={{ marginTop: theme.spacing.md, padding: theme.spacing.md, background: theme.colors.background, borderRadius: theme.borderRadius.sm, border: `1px solid ${theme.colors.border}` }}>
                <div>
                  <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                    Nombre de la opción
                  </label>
                  <input
                    type="text"
                    value={productForm.optionLabel}
                    onChange={(e) => handleOptionLabelChange(e.target.value)}
                    placeholder="Ej: Talla, Color..."
                    style={{ width: '100%', padding: theme.spacing.sm, background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, fontSize: theme.typography.fontSize.sm }}
                  />
                </div>
                <div style={{ marginTop: theme.spacing.md }}>
                  {productForm.optionValues.map((ov, index) => (
                    <div key={index} style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center', marginBottom: theme.spacing.sm }}>
                      <input
                        type="text"
                        value={ov.value}
                        onChange={(e) => handleOptionValueChange(index, 'value', e.target.value)}
                        placeholder="Valor"
                        style={{ flex: 1, padding: theme.spacing.xs, background: theme.colors.background, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, fontSize: theme.typography.fontSize.sm }}
                      />
                      <input
                        type="number"
                        value={ov.stock === null ? '' : ov.stock}
                        onChange={(e) => handleOptionValueChange(index, 'stock', e.target.value)}
                        placeholder="Stock"
                        style={{ width: '80px', padding: theme.spacing.xs, background: theme.colors.background, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, fontSize: theme.typography.fontSize.sm }}
                      />
                      <Button type="button" variant="danger" onClick={() => handleRemoveOptionValue(index)} style={{ padding: `${theme.spacing.xs} ${theme.spacing.sm}` }}>×</Button>
                    </div>
                  ))}
                  <Button type="button" variant="ghost" onClick={handleAddOptionValue}>+ Añadir valor</Button>
                </div>
              </div>
            )}

            {formError && (
              <p style={{ color: theme.colors.error, marginTop: theme.spacing.md, fontSize: theme.typography.fontSize.sm }}>{formError}</p>
            )}

            <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
              <Button type="submit">Actualizar</Button>
              <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancelar</Button>
            </div>
          </form>
        </Panel>
      </div>
    )
  }

  // View mode
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: `0 ${theme.spacing.xl}`,
    }}>
      {fromAdmin && (
        <div style={{
          display: 'inline-block',
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          background: theme.colors.warning,
          color: theme.colors.background,
          borderRadius: theme.borderRadius.sm,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          marginBottom: theme.spacing.md,
        }}>
          Modo Admin
        </div>
      )}

      <button
        onClick={() => navigate(-1)}
        style={{
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          background: theme.colors.surface,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.sm,
          cursor: 'pointer',
          marginBottom: theme.spacing.lg,
        }}
      >
        ← Volver
      </button>

      {fromAdmin && canEdit && (
        <Button onClick={handleEdit} style={{ marginBottom: theme.spacing.lg, marginLeft: theme.spacing.sm }}>
          Editar
        </Button>
      )}

      <h1 style={{
        color: theme.colors.text,
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.lg,
        fontFamily: theme.typography.fontFamily,
      }}>
        {product.name}
      </h1>

      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          style={{
            width: '100%',
            maxHeight: '400px',
            objectFit: 'cover',
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing.lg,
          }}
        />
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
      }}>
        <span style={{
          color: theme.colors.accent,
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
        }}>
          {product.price.toFixed(2)}€
        </span>
        <span style={{
          color: stockBadge.color,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
        }}>
          {stockBadge.text}
        </span>
      </div>

      {product.options && product.options.length > 0 && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          {product.options.map((option) => (
            <div key={option.id} style={{ marginBottom: theme.spacing.sm }}>
              <span style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.sm,
              }}>
                {option.name}:
              </span>
              <div style={{ display: 'flex', gap: theme.spacing.xs, marginTop: theme.spacing.xs, flexWrap: 'wrap' }}>
                {option.values.map((val) => (
                  <span
                    key={val.id}
                    style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      background: theme.colors.surface,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text,
                    }}
                  >
                    {val.value}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {product.description && (
        <p style={{
          color: theme.colors.text,
          fontSize: theme.typography.fontSize.base,
          lineHeight: 1.6,
        }}>
          {product.description}
        </p>
      )}
    </div>
  )
}