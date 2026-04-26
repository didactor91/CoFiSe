import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../../hooks/useAuth'
import {
  useCompetitionsQuery,
} from '../../../modules/competitions/api/queries'
import {
  useDeleteCompetitionMutation,
} from '../../../modules/competitions/api/mutations'
import type { Competition } from '../../../modules/competitions/api/queries'
import { Button } from '../../../shared/ui/Button'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Panel } from '../../../shared/ui/Panel'
import theme from '../../../theme'

import {
  CompetitionCard,
  ParticipantList,
  BracketPreview,
  MatchResultModal,
} from './components'

export default function CompetitionsPage() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const [competitionsResult, refetchCompetitions] = useCompetitionsQuery()
  const [, deleteCompetitionMutation] = useDeleteCompetitionMutation()

  const competitions: Competition[] = competitionsResult.data?.competitions ?? []

  const canCreate = can('competition.create')
  const canDelete = can('competition.delete')

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')
  const filteredCompetitions = searchQuery.trim()
    ? competitions.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : competitions

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Participant management state
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [showParticipants, setShowParticipants] = useState(false)

  // Results modal state
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null)

  const handleDeleteCompetition = (id: string) => {
    setDeleteConfirm(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteCompetitionMutation({ id: deleteConfirm })
    } catch (err) {
      console.error('Error deleting competition:', err)
    }
    setDeleteConfirm(null)
    await refetchCompetitions()
  }

  // Participant management
  const handleManageParticipants = (competition: Competition) => {
    setSelectedCompetition(competition)
    setShowParticipants(true)
  }

  const handleGenerateBracket = async (competition: Competition) => {
    // This is handled in the detail page now
    navigate(`/competitions/${competition.id}?from=admin`)
  }

  // Match result
  const handleEnterResults = (competition: Competition) => {
    // Find first pending match
    const firstPending = competition.matches?.find((m: any) => m.status === 'PENDING' && !m.isBye)
    if (firstPending) {
      setSelectedMatch(firstPending)
    }
  }

  return (
    <div data-testid="competitions-page">
      <PageHeader
        title="Gestión de Competiciones"
        action={canCreate ? (
          <Button onClick={() => navigate('/admin/competitions/new')}>
            Nueva Competición
          </Button>
        ) : undefined}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          testId="competition-delete-confirm"
          message="¿Eliminar competición? Esta acción no se puede deshacer."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Search */}
      <Panel style={{ marginBottom: theme.spacing.lg }}>
        <div style={{ padding: theme.spacing.md }}>
          <input
            type="text"
            placeholder="Buscar competiciones por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="competition-search-input"
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
      </Panel>

      {/* Competition List */}
      {filteredCompetitions.length === 0 ? (
        <Panel>
          <p style={{ color: theme.colors.textSecondary, padding: theme.spacing.md, textAlign: 'center' }}>
            {searchQuery
              ? 'No hay competiciones que coincidan con la búsqueda'
              : 'No hay competiciones. Haz clic en "Nueva Competición" para crear una.'}
          </p>
        </Panel>
      ) : (
        <div>
          {filteredCompetitions.map((competition) => (
            <CompetitionCard
              key={competition.id}
              competition={competition}
              isEditable={false}
              isDeletable={canDelete}
              onEdit={() => navigate(`/competitions/${competition.id}?from=admin`)}
              onDelete={() => handleDeleteCompetition(competition.id)}
              onManageParticipants={() => handleManageParticipants(competition)}
              onGenerateBracket={() => handleGenerateBracket(competition)}
              onEnterResults={() => handleEnterResults(competition)}
            />
          ))}
        </div>
      )}

      {/* Participant Management Panel */}
      {showParticipants && selectedCompetition && (
        <Panel style={{ marginTop: theme.spacing.lg, padding: theme.spacing.lg }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.md,
          }}>
            <h3 style={{ margin: 0, fontWeight: 600 }}>
              Participantes: {selectedCompetition.name}
            </h3>
            <Button variant="secondary" onClick={() => setShowParticipants(false)}>
              Cerrar
            </Button>
          </div>

          <div style={{ marginBottom: theme.spacing.lg }}>
            <h4 style={{ fontSize: '0.875rem', color: theme.colors.textSecondary, marginBottom: '0.5rem' }}>
              Participantes
            </h4>
            <p style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
              {selectedCompetition.participants.length} / {selectedCompetition.participantCount}
            </p>
          </div>

          {/* Bracket Preview */}
          {selectedCompetition.matches && selectedCompetition.matches.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.875rem', color: theme.colors.textSecondary, marginBottom: '0.5rem' }}>
                Parrilla
              </h4>
              <BracketPreview
                matches={selectedCompetition.matches}
                rounds={Math.ceil(Math.log2(selectedCompetition.participantCount))}
              />
            </div>
          )}
        </Panel>
      )}

      {/* Match Result Modal */}
      {selectedMatch && selectedCompetition && (
        <MatchResultModal
          match={selectedMatch}
          matchType={selectedCompetition.matchType as 'SINGLE_LEG' | 'HOME_AND_AWAY'}
          onSubmit={async () => {}}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  )
}