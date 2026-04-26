import type { Competition } from '../../../../modules/competitions/api/queries'
import { Button } from '../../../../shared/ui/Button'

type CompetitionStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED'
type MatchType = 'SINGLE_LEG' | 'HOME_AND_AWAY'

interface CompetitionCardProps {
  competition: Competition
  isEditable: boolean
  isDeletable: boolean
  onEdit: () => void
  onDelete: () => void
  onManageParticipants: () => void
  onGenerateBracket: () => void
  onEnterResults: () => void
}

const statusLabels: Record<CompetitionStatus, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activa',
  COMPLETED: 'Completada',
}

const statusColors: Record<CompetitionStatus, string> = {
  DRAFT: '#64748b',
  ACTIVE: '#22c55e',
  COMPLETED: '#0f172a',
}

const matchTypeLabels: Record<MatchType, string> = {
  SINGLE_LEG: 'Eliminatoria única',
  HOME_AND_AWAY: 'Ida y Vuelta',
}

export function CompetitionCard({
  competition,
  isEditable,
  isDeletable,
  onEdit,
  onDelete,
  onManageParticipants,
  onGenerateBracket,
  onEnterResults,
}: CompetitionCardProps) {
  const canGenerateBracket = competition.status === 'DRAFT' && competition.participants.length >= 2
  const canEnterResults = competition.status === 'ACTIVE'

  return (
    <div
      style={{
        padding: '1rem',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        marginBottom: '0.75rem',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '0.75rem',
      }}>
        <div>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: '#0f172a',
            margin: 0,
            marginBottom: '0.25rem',
          }}>
            {competition.name}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{
              fontSize: '0.75rem',
              color: statusColors[competition.status as CompetitionStatus],
              fontWeight: 500,
            }}>
              {statusLabels[competition.status as CompetitionStatus]}
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {matchTypeLabels[competition.matchType as MatchType]}
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {competition.participants.length}/{competition.participantCount} participantes
            </span>
          </div>
        </div>
      </div>

      {competition.description && (
        <p style={{
          fontSize: '0.875rem',
          color: '#64748b',
          margin: 0,
          marginBottom: '0.75rem',
        }}>
          {competition.description.length > 100
            ? competition.description.slice(0, 100) + '...'
            : competition.description}
        </p>
      )}

      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        paddingTop: '0.75rem',
        borderTop: '1px solid #e2e8f0',
      }}>
        <Button
          onClick={onManageParticipants}
          variant="ghost"
          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
        >
          Participantes
        </Button>

        {canGenerateBracket && (
          <Button
            onClick={onGenerateBracket}
            variant="ghost"
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
          >
            Generar Parrilla
          </Button>
        )}

        {canEnterResults && (
          <Button
            onClick={onEnterResults}
            variant="ghost"
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
          >
            Resultados
          </Button>
        )}

        {isEditable && (
          <Button
            onClick={onEdit}
            variant="ghost"
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
          >
            Editar
          </Button>
        )}

        {isDeletable && (
          <Button
            onClick={onDelete}
            variant="ghost"
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', color: '#ef4444' }}
          >
            Eliminar
          </Button>
        )}
      </div>
    </div>
  )
}

export default CompetitionCard