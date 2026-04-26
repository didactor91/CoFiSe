import { useState } from 'react'

import { useAuth } from '../../../hooks/useAuth'
import {
  useAllCompetitionsQuery,
  useCreateCompetitionMutation,
  useUpdateCompetitionMutation,
  useDeleteCompetitionMutation,
  useAddParticipantsMutation,
  useGenerateBracketMutation,
  useSetMatchResultMutation,
} from '../../../modules/competitions/api/queries'
import type { Competition, Match } from '../../../modules/competitions/api/queries'
import { Button } from '../../../shared/ui/Button'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Panel } from '../../../shared/ui/Panel'
import theme from '../../../theme'

import {
  CompetitionForm,
  CompetitionCard,
  ParticipantList,
  BracketPreview,
  MatchResultModal,
} from './components'

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export default function CompetitionsPage() {
  const { can } = useAuth()
  const [competitionsResult, refetchCompetitions] = useAllCompetitionsQuery()
  const [, createCompetitionMutation] = useCreateCompetitionMutation()
  const [, updateCompetitionMutation] = useUpdateCompetitionMutation()
  const [, deleteCompetitionMutation] = useDeleteCompetitionMutation()
  const [, addParticipantsMutation] = useAddParticipantsMutation()
  const [, generateBracketMutation] = useGenerateBracketMutation()
  const [, setMatchResultMutation] = useSetMatchResultMutation()

  const competitions: Competition[] = competitionsResult.data?.allCompetitions ?? []

  const canCreate = can('competition.create')
  const canEdit = can('competition.update')
  const canDelete = can('competition.delete')

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')
  const filteredCompetitions = searchQuery.trim()
    ? competitions.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : competitions

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Participant management state
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [showParticipants, setShowParticipants] = useState(false)

  // Results modal state
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Competition form submit
  const handleCompetitionFormSubmit = async (data: {
    name: string
    description: string
    matchType: 'SINGLE_LEG' | 'HOME_AND_AWAY'
  }) => {
    setFormError(null)
    try {
      if (editingCompetition) {
        const result = await updateCompetitionMutation({
          id: editingCompetition.id,
          input: {
            name: data.name,
            description: data.description || undefined,
            matchType: data.matchType,
          },
        })
        if (result.error) {
          setFormError(result.error.message)
          return
        }
      } else {
        const result = await createCompetitionMutation({
          input: {
            name: data.name,
            description: data.description || undefined,
            matchType: data.matchType,
            participantCount: 8, // default
          },
        })
        if (result.error) {
          setFormError(result.error.message)
          return
        }
      }
      setShowForm(false)
      setEditingCompetition(null)
      await refetchCompetitions()
    } catch (err: unknown) {
      setFormError(toErrorMessage(err, 'Error al guardar'))
    }
  }

  // Edit competition
  const handleEditCompetition = (competition: Competition) => {
    setEditingCompetition(competition)
    setShowForm(true)
  }

  // Delete competition
  const handleDeleteCompetition = (id: string) => {
    setDeleteConfirm(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteCompetitionMutation({ id: deleteConfirm })
    } catch (err: unknown) {
      setFormError(toErrorMessage(err, 'Error al eliminar'))
    }
    setDeleteConfirm(null)
    await refetchCompetitions()
  }

  // Participant management
  const handleManageParticipants = (competition: Competition) => {
    setSelectedCompetition(competition)
    setShowParticipants(true)
  }

  const handleAddParticipants = async (competitionId: string, aliases: string[]) => {
    const result = await addParticipantsMutation({
      input: { competitionId, aliases },
    })
    if (result.error) {
      throw new Error(result.error.message)
    }
    await refetchCompetitions()
    // Update selected competition
    if (selectedCompetition) {
      setSelectedCompetition(result.data?.addParticipants ?? selectedCompetition)
    }
  }

  const handleRemoveParticipant = async (competitionId: string, participantId: string) => {
    // Note: In a real app, you'd have a removeParticipant mutation
    // For now, we'll just show an error since that mutation doesn't exist
    throw new Error('Funcionalidad no implementada')
  }

  // Generate bracket
  const handleGenerateBracket = async (competition: Competition) => {
    try {
      await generateBracketMutation({ competitionId: competition.id })
      await refetchCompetitions()
    } catch (err: unknown) {
      setFormError(toErrorMessage(err, 'Error al generar parrilla'))
    }
  }

  // Match result
  const handleEnterResults = (competition: Competition) => {
    // Find first pending match
    const firstPending = competition.matches?.find(m => m.status === 'PENDING' && !m.isBye)
    if (firstPending) {
      setSelectedMatch(firstPending)
    }
  }

  const handleSetMatchResult = async (data: {
    homeScore1: number
    homeScore2: number
    awayScore1?: number
    awayScore2?: number
    manualWinnerId?: string
  }) => {
    if (!selectedMatch) return

    const result = await setMatchResultMutation({
      input: {
        matchId: selectedMatch.id,
        homeScore1: data.homeScore1,
        homeScore2: data.homeScore2,
        awayScore1: data.awayScore1,
        awayScore2: data.awayScore2,
        manualWinnerId: data.manualWinnerId ? data.manualWinnerId : undefined,
      },
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    setSelectedMatch(null)
    await refetchCompetitions()
    // Update selected competition
    if (selectedCompetition) {
      const updated = competitions.find(c => c.id === selectedCompetition.id)
      if (updated) setSelectedCompetition(updated)
    }
  }

  return (
    <div data-testid="competitions-page">
      <PageHeader
        title="Gestión de Competiciones"
        action={canCreate ? (
          <Button onClick={() => { setEditingCompetition(null); setShowForm(true) }}>
            Nueva Competición
          </Button>
        ) : undefined}
      />

      {/* Competition Form */}
      {showForm && (
        <Panel style={{ padding: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>
            {editingCompetition ? 'Editar Competición' : 'Nueva Competición'}
          </h3>
          <CompetitionForm
            initialData={editingCompetition ? {
              id: editingCompetition.id,
              name: editingCompetition.name,
              description: editingCompetition.description ?? '',
              matchType: editingCompetition.matchType,
            } : undefined}
            onSubmit={handleCompetitionFormSubmit}
            onCancel={() => { setShowForm(false); setEditingCompetition(null) }}
            error={formError}
            submitLabel={editingCompetition ? 'Actualizar' : 'Crear'}
          />
        </Panel>
      )}

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
              isEditable={canEdit}
              isDeletable={canDelete}
              onEdit={() => handleEditCompetition(competition)}
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
              Añadir participante
            </h4>
            <ParticipantList
              competitionId={selectedCompetition.id}
              participants={selectedCompetition.participants}
              participantCount={selectedCompetition.participantCount}
              isEditable={selectedCompetition.status === 'DRAFT'}
              onAddParticipants={(aliases) => handleAddParticipants(selectedCompetition.id, aliases)}
              onRemoveParticipant={(participantId) =>
                handleRemoveParticipant(selectedCompetition.id, participantId)
              }
            />
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
          onSubmit={handleSetMatchResult}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  )
}