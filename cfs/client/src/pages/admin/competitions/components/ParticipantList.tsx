import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'

interface Participant {
  id: string
  alias: string
}

interface ParticipantListProps {
  competitionId: string
  participants: Participant[]
  participantCount: number
  isEditable: boolean
  onAddParticipants: (aliases: string[]) => Promise<void>
  onRemoveParticipant: (participantId: string) => Promise<void>
}

export function ParticipantList({
  competitionId,
  participants,
  participantCount,
  isEditable,
  onAddParticipants,
  onRemoveParticipant,
}: ParticipantListProps) {
  const [newAlias, setNewAlias] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canAddMore = participants.length < participantCount

  const handleAdd = async () => {
    const trimmed = newAlias.trim()
    if (!trimmed) return

    setError(null)
    setIsAdding(true)

    try {
      await onAddParticipants([trimmed])
      setNewAlias('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al añadir participante')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemove = async (participantId: string) => {
    setError(null)
    try {
      await onRemoveParticipant(participantId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar participante')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
      }}>
        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Participantes: {participants.length}/{participantCount}
        </span>
        {canAddMore && isEditable && (
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Puedes añadir {participantCount - participants.length} más
          </span>
        )}
      </div>

      {error && (
        <p style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '0.75rem' }}>{error}</p>
      )}

      {participants.length === 0 ? (
        <p style={{ color: '#64748b', fontSize: '0.875rem', fontStyle: 'italic' }}>
          No hay participantes aún
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {participants.map((p) => (
            <li
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem',
                marginBottom: '0.25rem',
                background: '#f8fafc',
                borderRadius: '4px',
              }}
            >
              <span style={{ fontSize: '0.875rem', color: '#0f172a' }}>{p.alias}</span>
              {isEditable && (
                <button
                  onClick={() => handleRemove(p.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                  }}
                >
                  Eliminar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canAddMore && isEditable && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <input
            type="text"
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nombre del participante"
            maxLength={100}
            disabled={isAdding}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '0.875rem',
            }}
          />
          <Button
            onClick={handleAdd}
            disabled={isAdding || !newAlias.trim()}
            style={{ padding: '0.5rem 1rem' }}
          >
            Añadir
          </Button>
        </div>
      )}
    </div>
  )
}

export default ParticipantList