import React, { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import {
  useCompetitionsQuery,
} from '../../modules/competitions/api/queries'
import {
  useUpdateCompetitionMutation,
} from '../../modules/competitions/api/mutations'
import type { MatchType, CompetitionStatus } from '../../modules/competitions/api/types'
import BracketView from '../../components/competitions/BracketView'
import { CompetitionForm } from '../admin/competitions/components'
import { Button } from '../../shared/ui/Button'
import { Panel } from '../../shared/ui/Panel'
import theme from '../../theme'

const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  SINGLE_LEG: 'Eliminatoria única',
  HOME_AND_AWAY: 'Ida y Vuelta',
}

const MATCH_TYPE_COLORS: Record<MatchType, string> = {
  SINGLE_LEG: '#64748b',
  HOME_AND_AWAY: '#22c55e',
}

const STATUS_LABELS: Record<CompetitionStatus, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activa',
  COMPLETED: 'Finalizada',
}

const STATUS_COLORS: Record<CompetitionStatus, string> = {
  DRAFT: '#64748b',
  ACTIVE: '#22c55e',
  COMPLETED: '#0f172a',
}

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export default function CompetitionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromAdmin = searchParams.get('from') === 'admin'

  const { can } = useAuth()
  // Use admin query when in admin mode to see all competitions including DRAFT
  const [competitionsResult, refetchCompetitions] = useCompetitionsQuery()
  const [, updateCompetitionMutation] = useUpdateCompetitionMutation()

  const canEdit = can('competition.update')

  // Find the competition from the results
  const competition = competitionsResult.data?.competitions?.find((c: any) => c.id === id)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleEdit = () => {
    setFormError(null)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFormError(null)
  }

  const handleSubmit = async (data: {
    name: string
    description: string
    matchType: 'SINGLE_LEG' | 'HOME_AND_AWAY'
  }) => {
    setFormError(null)

    try {
      const result = await updateCompetitionMutation({
        id: id!,
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
      await refetchCompetitions()
      setIsEditing(false)
    } catch (err: unknown) {
      setFormError(toErrorMessage(err, 'Error al guardar'))
    }
  }

  if (competitionsResult.fetching) {
    return (
      <div style={{ textAlign: 'center', padding: theme.spacing['2xl'] }}>
        <div style={{ fontSize: '2rem', marginBottom: theme.spacing.sm }}>⏳</div>
        <p style={{ color: theme.colors.textSecondary }}>Cargando...</p>
      </div>
    )
  }

  if (!competition) {
    return (
      <div style={{ textAlign: 'center', padding: theme.spacing['2xl'] }}>
        <p style={{ color: theme.colors.error, marginBottom: theme.spacing.md }}>
          Competición no encontrada
        </p>
        <button
          onClick={() => navigate('/')}
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

  // Edit mode - show form
  if (isEditing) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: `0 ${theme.spacing.xl}` }}>
        <Button
          onClick={handleCancelEdit}
          variant="secondary"
          style={{ marginBottom: theme.spacing.md }}
        >
          ← Volver
        </Button>

        <Panel style={{ padding: theme.spacing.lg }}>
          <h2 style={{ margin: 0, marginBottom: theme.spacing.lg }}>Editar Competición</h2>

          <CompetitionForm
            initialData={{
              id: competition.id,
              name: competition.name,
              description: competition.description ?? '',
              matchType: competition.matchType,
            }}
            onSubmit={handleSubmit}
            onCancel={handleCancelEdit}
            error={formError}
            submitLabel="Actualizar"
          />
        </Panel>
      </div>
    )
  }

  // View mode
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: `0 ${theme.spacing.xl}`,
    }}>
      {/* Back button */}
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

      {/* Header */}
      <div style={{ marginBottom: theme.spacing.xl }}>
        <h1 style={{
          color: theme.colors.text,
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          marginBottom: theme.spacing.md,
          fontFamily: theme.typography.fontFamily,
        }}>
          {competition.name}
        </h1>

        {/* Badges row */}
        <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap', marginBottom: theme.spacing.md }}>
          {/* Match type badge */}
          <span style={{
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            background: MATCH_TYPE_COLORS[competition.matchType] + '20',
            color: MATCH_TYPE_COLORS[competition.matchType],
            borderRadius: theme.borderRadius.sm,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
          }}>
            {MATCH_TYPE_LABELS[competition.matchType]}
          </span>

          {/* Status badge */}
          <span style={{
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            background: STATUS_COLORS[competition.status] + '20',
            color: STATUS_COLORS[competition.status],
            borderRadius: theme.borderRadius.sm,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
          }}>
            {STATUS_LABELS[competition.status]}
          </span>
        </div>

        {/* Description */}
        {competition.description && (
          <p style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.base,
            lineHeight: 1.6,
          }}>
            {competition.description}
          </p>
        )}
      </div>

      {/* Bracket View */}
      <div style={{
        background: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        border: `1px solid ${theme.colors.border}`,
      }}>
        <h2 style={{
          color: theme.colors.text,
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.semibold,
          marginBottom: theme.spacing.lg,
        }}>
          Eliminatoria
        </h2>
        <BracketView competition={competition} variant="public" />
      </div>
    </div>
  )
}