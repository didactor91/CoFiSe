import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ImageUpload } from '../../../components/ImageUpload'
import { useCreateEventMutation } from '../../../graphql/mutations'
import { useAuth } from '../../../hooks/useAuth'
import { Button } from '../../../shared/ui/Button'
import { Panel } from '../../../shared/ui/Panel'
import theme from '../../../theme'

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export default function EventNewPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [, createEventMutation] = useCreateEventMutation()

  const canCreate = can('event.create')
  const [eventForm, setEventForm] = useState({ name: '', description: '', location: '', startTime: '', endTime: '', imageUrl: '' })
  const [eventFormError, setEventFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEventFormError(null)

    if (!canCreate) {
      setEventFormError('No tienes permiso para crear eventos')
      return
    }

    if (!eventForm.name.trim()) {
      setEventFormError('El nombre es requerido')
      return
    }
    if (eventForm.name.length > 200) {
      setEventFormError('El nombre debe tener 200 caracteres o menos')
      return
    }
    if (!eventForm.location.trim()) {
      setEventFormError('El lugar es requerido')
      return
    }
    if (eventForm.location.length > 300) {
      setEventFormError('El lugar debe tener 300 caracteres o menos')
      return
    }
    if (!eventForm.startTime || !eventForm.endTime) {
      setEventFormError('Las fechas son requeridas')
      return
    }
    if (new Date(eventForm.endTime) <= new Date(eventForm.startTime)) {
      setEventFormError('La fecha de fin debe ser posterior a la fecha de inicio')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createEventMutation({
        input: {
          name: eventForm.name,
          description: eventForm.description || undefined,
          location: eventForm.location,
          startTime: new Date(eventForm.startTime).toISOString(),
          endTime: new Date(eventForm.endTime).toISOString(),
          imageUrl: eventForm.imageUrl || undefined,
        },
      })
      if (result.error) {
        setEventFormError(result.error.message)
        setIsSubmitting(false)
        return
      }
      navigate('/admin/events')
    } catch (err: unknown) {
      setEventFormError(toErrorMessage(err, 'Error al guardar'))
      setIsSubmitting(false)
    }
  }

  return (
    <div data-testid="event-new-page">
      <Panel style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
        <div style={{ marginBottom: theme.spacing.lg }}>
          <h2 style={{ margin: 0, marginBottom: theme.spacing.xs }}>Nuevo Evento</h2>
          <p style={{ margin: 0, color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
            Completa los datos del evento
          </p>
        </div>

        <form onSubmit={handleSubmit} data-testid="event-form">
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
                Lugar *
              </label>
              <input
                type="text"
                value={eventForm.location}
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                required
                maxLength={300}
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
          <div style={{ marginTop: theme.spacing.md }}>
            <label style={{ display: 'block', color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs }}>
              Descripción (opcional)
            </label>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
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
                Fecha/Hora fin *
              </label>
              <input
                type="datetime-local"
                value={eventForm.endTime}
                onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
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

          <div style={{ marginTop: theme.spacing.md }}>
            <ImageUpload
              entityType="EVENT"
              entityId={undefined}
              currentImageUrl={eventForm.imageUrl}
              onUploadComplete={(imageUrl) => setEventForm(prev => ({ ...prev, imageUrl }))}
            />
          </div>

          {eventFormError && (
            <p style={{ color: theme.colors.error, marginTop: theme.spacing.md, fontSize: theme.typography.fontSize.sm }}>
              {eventFormError}
            </p>
          )}
          <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/events')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}