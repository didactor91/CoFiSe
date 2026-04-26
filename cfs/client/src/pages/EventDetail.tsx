import React, { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'

import { ImageUpload } from '../components/ImageUpload'
import { useEventQuery } from '../graphql/queries'
import { useUpdateEventMutation } from '../graphql/mutations'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../shared/ui/Button'
import { Panel } from '../shared/ui/Panel'
import theme from '../theme'

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromAdmin = searchParams.get('from') === 'admin'

  const { can } = useAuth()
  const [result] = useEventQuery(id!)
  const [, updateEventMutation] = useUpdateEventMutation()

  const canEdit = can('event.update')

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [eventForm, setEventForm] = useState({ name: '', description: '', location: '', startTime: '', endTime: '', imageUrl: '' })
  const [formError, setFormError] = useState<string | null>(null)

  const handleEdit = () => {
    if (!result.data?.event) return
    const { event } = result.data
    setEventForm({
      name: event.name,
      description: event.description || '',
      location: event.location,
      startTime: event.startTime.slice(0, 16),
      endTime: event.endTime.slice(0, 16),
      imageUrl: event.imageUrl || '',
    })
    setFormError(null)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!eventForm.name.trim()) {
      setFormError('El nombre es requerido')
      return
    }
    if (eventForm.name.length > 200) {
      setFormError('El nombre debe tener 200 caracteres o menos')
      return
    }
    if (!eventForm.location.trim()) {
      setFormError('El lugar es requerido')
      return
    }
    if (!eventForm.startTime || !eventForm.endTime) {
      setFormError('Las fechas son requeridas')
      return
    }
    if (new Date(eventForm.endTime) <= new Date(eventForm.startTime)) {
      setFormError('La fecha de fin debe ser posterior a la fecha de inicio')
      return
    }

    try {
      const updateResult = await updateEventMutation({
        id: id!,
        input: {
          name: eventForm.name,
          description: eventForm.description || undefined,
          location: eventForm.location,
          startTime: new Date(eventForm.startTime).toISOString(),
          endTime: new Date(eventForm.endTime).toISOString(),
          imageUrl: eventForm.imageUrl || undefined,
        },
      })
      if (updateResult.error) {
        setFormError(updateResult.error.message)
        return
      }
      setIsEditing(false)
    } catch (err: unknown) {
      setFormError(toErrorMessage(err, 'Error al guardar'))
    }
  }

  const formatDateRange = () => {
    if (!result.data?.event) return ''
    const startDate = new Date(result.data.event.startTime)
    const endDate = new Date(result.data.event.endTime)

    const dateStr = startDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const startTime = startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const endTime = endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

    return `${dateStr}, ${startTime} - ${endTime}`
  }

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

  // Edit mode - show form
  if (isEditing) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: `0 ${theme.spacing.xl}` }}>
        <Panel style={{ padding: theme.spacing.lg }}>
          <h2 style={{ margin: 0, marginBottom: theme.spacing.lg }}>Editar Evento</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: theme.spacing.md }}>
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  required
                  maxLength={200}
                  style={{ width: '100%', padding: theme.spacing.sm, background: theme.colors.background, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, fontSize: theme.typography.fontSize.sm }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  Lugar *
                </label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  required
                  maxLength={300}
                  style={{ width: '100%', padding: theme.spacing.sm, background: theme.colors.background, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, fontSize: theme.typography.fontSize.sm }}
                />
              </div>
            </div>

            <div style={{ marginTop: theme.spacing.md }}>
              <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                Descripción (opcional)
              </label>
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: theme.spacing.sm, background: theme.colors.background, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, fontSize: theme.typography.fontSize.sm, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  Fecha/Hora inicio *
                </label>
                <input
                  type="datetime-local"
                  value={eventForm.startTime}
                  onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                  required
                  style={{ width: '100%', padding: theme.spacing.sm, background: theme.colors.background, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, fontSize: theme.typography.fontSize.sm }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
                  Fecha/Hora fin *
                </label>
                <input
                  type="datetime-local"
                  value={eventForm.endTime}
                  onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                  required
                  style={{ width: '100%', padding: theme.spacing.sm, background: theme.colors.background, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.sm, color: theme.colors.text, fontSize: theme.typography.fontSize.sm }}
                />
              </div>
            </div>

            <div style={{ marginTop: theme.spacing.md }}>
              <ImageUpload
                entityType="EVENT"
                entityId={id}
                currentImageUrl={eventForm.imageUrl}
                onUploadComplete={(imageUrl) => setEventForm(prev => ({ ...prev, imageUrl }))}
              />
            </div>

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