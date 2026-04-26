import type { Match, Participant, MatchStatus } from '../../modules/competitions/api/types'
import theme from '../../theme'

interface MatchCardProps {
  match: Match
  variant?: 'admin' | 'public'
  matchType?: 'SINGLE_LEG' | 'HOME_AND_AWAY'
  onClick?: (match: Match) => void
}

export default function MatchCard({ match, variant = 'public', matchType = 'SINGLE_LEG', onClick }: MatchCardProps) {
  const { participant1, participant2, status, isBye, winner, homeScore1, homeScore2, awayScore1, awayScore2 } = match

  const isCompleted = status === 'COMPLETED'
  const winnerId = winner?.id

  const getParticipantDisplay = (p: Participant | null) => {
    if (!p) return 'TBD'
    return p.alias
  }

  const isWinner = (participant: Participant | null) => {
    if (!participant || !winnerId) return false
    return participant.id === winnerId
  }

  const isLoser = (participant: Participant | null) => {
    if (!participant || !winnerId || !isCompleted) return false
    return participant.id !== winnerId
  }

  // BYE state
  if (isBye) {
    return (
      <div
        style={{
          border: `2px dashed ${theme.colors.disabled}`,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
          background: theme.colors.surface,
        }}
      >
        <p style={{
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.sm,
          fontStyle: 'italic',
        }}>
          Pasa directamente
        </p>
        <p style={{
          color: theme.colors.text,
          fontWeight: theme.typography.fontWeight.semibold,
          marginTop: theme.spacing.xs,
        }}>
          {getParticipantDisplay(participant1)}
        </p>
      </div>
    )
  }

  const renderScore = () => {
    if (!isCompleted) {
      return (
        <div style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }}>
          vs
        </div>
      )
    }

    if (matchType === 'SINGLE_LEG') {
      return (
        <div style={{
          fontWeight: theme.typography.fontWeight.bold,
          fontSize: theme.typography.fontSize.lg,
        }}>
          {homeScore1} - {homeScore2}
        </div>
      )
    }

    // HOME_AND_AWAY
    const aggregate1 = (homeScore1 ?? 0) + (awayScore2 ?? 0)
    const aggregate2 = (homeScore2 ?? 0) + (awayScore1 ?? 0)

    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontWeight: theme.typography.fontWeight.bold,
          fontSize: theme.typography.fontSize.lg,
        }}>
          {homeScore1} - {homeScore2}
        </div>
        <div style={{
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.textSecondary,
        }}>
          Ida
        </div>
        <div style={{
          fontWeight: theme.typography.fontWeight.bold,
          fontSize: theme.typography.fontSize.lg,
          marginTop: theme.spacing.xs,
        }}>
          {awayScore1} - {awayScore2}
        </div>
        <div style={{
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.textSecondary,
        }}>
          Vuelta
        </div>
        <div style={{
          marginTop: theme.spacing.xs,
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          background: theme.colors.success + '20',
          borderRadius: theme.borderRadius.sm,
          fontWeight: theme.typography.fontWeight.semibold,
        }}>
          {aggregate1} - {aggregate2}
        </div>
      </div>
    )
  }

  const participant1Name = getParticipantDisplay(participant1)
  const participant2Name = getParticipantDisplay(participant2)

  return (
    <div
      onClick={() => onClick?.(match)}
      style={{
        border: `1px solid ${isCompleted ? theme.colors.success : theme.colors.border}`,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        background: theme.colors.surface,
        cursor: onClick ? 'pointer' : 'default',
        minWidth: '140px',
      }}
    >
      {/* Participant 1 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: theme.spacing.sm,
        borderBottom: `1px solid ${theme.colors.border}`,
        marginBottom: theme.spacing.sm,
      }}>
        <span style={{
          color: isWinner(participant1) ? theme.colors.success : isLoser(participant1) ? theme.colors.disabledText : theme.colors.text,
          fontWeight: isWinner(participant1) ? theme.typography.fontWeight.bold : theme.typography.fontWeight.normal,
        }}>
          {participant1Name}
        </span>
      </div>

      {/* Participant 2 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          color: isWinner(participant2) ? theme.colors.success : isLoser(participant2) ? theme.colors.disabledText : theme.colors.text,
          fontWeight: isWinner(participant2) ? theme.typography.fontWeight.bold : theme.typography.fontWeight.normal,
        }}>
          {participant2Name}
        </span>
      </div>

      {/* Score display */}
      {(isCompleted || variant === 'admin') && (
        <div style={{
          marginTop: theme.spacing.sm,
          paddingTop: theme.spacing.sm,
          borderTop: `1px solid ${theme.colors.border}`,
          textAlign: 'center',
        }}>
          {renderScore()}
        </div>
      )}
    </div>
  )
}
