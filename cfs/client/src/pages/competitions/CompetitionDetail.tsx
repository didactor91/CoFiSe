import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { usePublicCompetitionQuery } from '../../modules/competitions/api/queries'
import type { MatchType, CompetitionStatus } from '../../modules/competitions/api/types'
import BracketView from '../../components/competitions/BracketView'
import theme from '../../theme'

const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  SINGLE_LEG: 'Eliminatoria única',
  HOME_AND_AWAY: 'Ida y Vuelta',
}

const MATCH_TYPE_COLORS: Record<MatchType, string> = {
  SINGLE_LEG: '#64748b',  // slate
  HOME_AND_AWAY: '#22c55e', // green/emerald
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

export default function CompetitionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [result] = usePublicCompetitionQuery(id!)

  if (result.fetching) {
    return (
      <div style={{ textAlign: 'center', padding: theme.spacing['2xl'] }}>
        <div style={{ fontSize: '2rem', marginBottom: theme.spacing.sm }}>⏳</div>
        <p style={{ color: theme.colors.textSecondary }}>Cargando...</p>
      </div>
    )
  }

  if (result.error || !result.data?.publicCompetition) {
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

  const { publicCompetition: competition } = result.data

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
