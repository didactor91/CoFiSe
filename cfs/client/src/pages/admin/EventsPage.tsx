import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type { Event } from '../../graphql/generated-types'
import { useDeleteEventMutation } from '../../graphql/mutations'
import { useAllEventsQuery } from '../../graphql/queries'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../../shared/ui/Button'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { PageHeader } from '../../shared/ui/PageHeader'
import { Panel } from '../../shared/ui/Panel'
import theme from '../../theme'

export default function EventsPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [eventsResult] = useAllEventsQuery()
  const [, deleteEventMutation] = useDeleteEventMutation()

  const events: Event[] = eventsResult.data?.allEvents ?? []

  // Search filter state
  const [searchQuery, setSearchQuery] = useState('')

  // Filter events based on search query
  const filteredEvents = searchQuery.trim()
    ? events.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : events

  const canCreate = can('event.create')
  const canDelete = can('event.delete')

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDeleteEventClick = (id: string) => {
    setDeleteConfirm(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteEventMutation({ id: deleteConfirm })
    } catch (err) {
      console.error('Error deleting event:', err)
    }
    setDeleteConfirm(null)
    eventsResult.refetch({ requestPolicy: 'network-only' })
  }

  return (
    <div data-testid="events-page">
      <PageHeader
        title="Gestión de Eventos"
        action={canCreate ? <Button onClick={() => navigate('/admin/events/new')}>Añadir Evento</Button> : undefined}
      />

      {deleteConfirm && (
        <ConfirmDialog
          testId="event-delete-confirm-dialog"
          message="¿Eliminar evento? Esta acción no se puede deshacer."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <Panel style={{ overflow: 'hidden' }}>
        {/* Search input */}
        <div style={{ padding: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}` }}>
          <input
            type="text"
            placeholder="Buscar eventos por nombre, descripción o lugar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="event-search-input"
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

        {filteredEvents.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
            {searchQuery ? 'No hay eventos que coincidan con la búsqueda' : 'No hay eventos. Haz clic en \'Añadir Evento\' para crear uno.'}
          </p>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">Nombre</th>
                  <th className="admin-th">Lugar</th>
                  <th className="admin-th">Fecha</th>
                  <th className="admin-th text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id} onClick={() => navigate(`/events/${event.id}?from=admin`)} className="admin-row cursor-pointer">
                    <td className="admin-td font-medium text-slate-800">{event.name}</td>
                    <td className="admin-td text-xs text-slate-500">{event.location}</td>
                    <td className="admin-td text-xs text-slate-500">
                      {new Date(event.startTime).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="admin-td text-right">
                      {canDelete && (
                        <Button
                          data-testid={`delete-event-btn-${event.id}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteEventClick(event.id)
                          }}
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