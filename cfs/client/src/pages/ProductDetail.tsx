import React from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'

import { useProductQuery } from '../graphql/queries'
import theme from '../theme'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromAdmin = searchParams.get('from') === 'admin'

  const [result] = useProductQuery(id!)

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