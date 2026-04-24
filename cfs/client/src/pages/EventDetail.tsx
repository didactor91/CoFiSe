import React from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useEventQuery } from '../graphql/queries'
import theme from '../theme'

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromAdmin = searchParams.get('from') === 'admin'

  const [result] = useEventQuery(id!)

  if (result.fetching) {
    return (
      <div style={{ textAlign: 'center', padding: theme.spacing['2xl'] }}>
        <div style={{ fontSize: '2rem', marginBottom: theme.spacing.sm }}>⏳</div>
        <p style={{ color: theme.colors.textSecondary }}>Cargando...</p>
      </div>
    )
  }

  if (result.error || !result.data?.event) {
    return (
      <div style={{ textAlign: 'center', padding: theme.spacing['2xl'] }}>
        <p style={{ color: theme.colors.error, marginBottom: theme.spacing.md }}>Evento no encontrado</p>
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

  const { event } = result.data

  const formatDateRange = () => {
    const startDate = new Date(event.startTime)
    const endDate = new Date(event.endTime)
    
    const dateStr = startDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    
    const startTime = startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const endTime = endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    
    return `${dateStr}, ${startTime} - ${endTime}`
  }

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
        marginBottom: theme.spacing.md,
        fontFamily: theme.typography.fontFamily,
      }}>
        {event.name}
      </h1>

      <p style={{
        color: theme.colors.textSecondary,
        fontSize: theme.typography.fontSize.base,
        marginBottom: theme.spacing.sm,
      }}>
        📍 {event.location}
      </p>

      <p style={{
        color: theme.colors.accent,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        marginBottom: theme.spacing.lg,
      }}>
        🗓 {formatDateRange()}
      </p>

      {event.description && (
        <p style={{
          color: theme.colors.text,
          fontSize: theme.typography.fontSize.base,
          lineHeight: 1.6,
        }}>
          {event.description}
        </p>
      )}
    </div>
  )
}