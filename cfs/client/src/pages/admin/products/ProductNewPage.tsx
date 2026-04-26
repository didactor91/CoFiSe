import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ImageUpload } from '../../../components/ImageUpload'
import type {
  CreateProductMutationResult,
  CreateProductOptionMutationResult,
  OptionValue,
} from '../../../graphql/generated-types'
import {
  useCreateProductMutation,
  useCreateProductOptionMutation,
  useAddOptionValuesMutation,
} from '../../../graphql/mutations'
import { useAuth } from '../../../hooks/useAuth'
import { Button } from '../../../shared/ui/Button'
import { Panel } from '../../../shared/ui/Panel'
import theme from '../../../theme'

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

export default function ProductNewPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [, createProductMutation] = useCreateProductMutation()
  const [, createProductOptionMutation] = useCreateProductOptionMutation()
  const [, addOptionValuesMutation] = useAddOptionValuesMutation()

  const canCreate = can('product.create')
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm)
  const [productFormError, setProductFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Option value management
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
    setProductFormError(null)

    if (!canCreate) {
      setProductFormError('No tienes permiso para crear productos')
      return
    }

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

    setIsSubmitting(true)

    try {
      const result = await createProductMutation({
        input: {
          name: productForm.name,
          description: productForm.description,
          price,
          stock: productForm.hasOptions ? 0 : stock,
          limitedStock: productForm.limitedStock,
          imageUrl: productForm.imageUrl || undefined,
        },
      })
      if (result.error) {
        setProductFormError(result.error.message)
        setIsSubmitting(false)
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
            },
          })
          if (optResult.error) {
            setProductFormError(optResult.error.message)
            setIsSubmitting(false)
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

      navigate('/admin/products')
    } catch (err: unknown) {
      setProductFormError(toErrorMessage(err, 'Error al guardar el producto'))
      setIsSubmitting(false)
    }
  }

  return (
    <div data-testid="product-new-page">
      <Panel style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
        <div style={{ marginBottom: theme.spacing.lg }}>
          <h2 style={{ margin: 0, marginBottom: theme.spacing.xs }}>Nuevo Producto</h2>
          <p style={{ margin: 0, color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
            Completa los datos del producto
          </p>
        </div>

        <form onSubmit={handleSubmit} data-testid="product-form">
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

          {/* Image */}
          <div style={{ marginTop: theme.spacing.md }}>
            <ImageUpload
              entityType="PRODUCT"
              entityId={undefined}
              currentImageUrl={productForm.imageUrl}
              onUploadComplete={(imageUrl) => setProductForm(prev => ({ ...prev, imageUrl }))}
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
              border: `1px solid ${theme.colors.border}`,
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/products')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}