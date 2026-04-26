import type { Match, Competition } from '../../modules/competitions/api/types'
import MatchCard from './MatchCard'
import theme from '../../theme'

interface BracketViewProps {
  competition: Competition
  variant?: 'admin' | 'public'
  onMatchClick?: (match: Match) => void
}

// SVG layout constants
const COLUMN_WIDTH = 220
const MATCH_WIDTH = 180
const MATCH_HEIGHT = 80
const GAP = 20
const PADDING = 40

export default function BracketView({ competition, variant = 'public', onMatchClick }: BracketViewProps) {
  const { matches, matchType } = competition

  if (!matches || matches.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: theme.spacing['2xl'],
        color: theme.colors.textSecondary,
      }}>
        No hay partidos disponibles
      </div>
    )
  }

  // Calculate number of rounds
  const maxRound = Math.max(...matches.map(m => m.round))
  const rounds = maxRound

  // Group matches by round
  const matchesByRound: Map<number, Match[]> = new Map()
  for (let round = 1; round <= rounds; round++) {
    matchesByRound.set(round, matches.filter(m => m.round === round))
  }

  // Calculate container dimensions
  const containerWidth = rounds * COLUMN_WIDTH + PADDING * 2
  const matchesInRound1 = matchesByRound.get(1)?.length || 0
  const containerHeight = matchesInRound1 * MATCH_HEIGHT + (matchesInRound1 - 1) * GAP + PADDING * 2

  // Calculate Y position for a match in a given round
  const getMatchY = (round: number, position: number, matchCount: number): number => {
    const totalHeight = matchCount * MATCH_HEIGHT + (matchCount - 1) * GAP
    const spacing = (containerHeight - totalHeight) / (matchCount + 1)
    return spacing + position * (MATCH_HEIGHT + GAP)
  }

  // Calculate connector lines
  const getConnectorPath = (round: number, position: number): string => {
    if (round >= rounds) return ''

    const currentMatches = matchesByRound.get(round) || []
    const nextMatches = matchesByRound.get(round + 1) || []

    const currentMatchCount = currentMatches.length
    const nextMatchCount = nextMatches.length

    const currentY = getMatchY(round, position, currentMatchCount) + MATCH_HEIGHT / 2
    const currentX = PADDING + (round - 1) * COLUMN_WIDTH + MATCH_WIDTH

    const nextPosition = Math.floor(position / 2)
    const nextY = getMatchY(round + 1, nextPosition, nextMatchCount) + MATCH_HEIGHT / 2
    const nextX = PADDING + round * COLUMN_WIDTH

    // Horizontal line from current match, then vertical, then horizontal to next
    const midX = currentX + (nextX - currentX) / 2

    return `M ${currentX} ${currentY} H ${midX} V ${nextY} H ${nextX}`
  }

  const renderConnectors = () => {
    const connectors: JSX.Element[] = []

    for (let round = 1; round < rounds; round++) {
      const currentMatches = matchesByRound.get(round) || []
      currentMatches.forEach((match, position) => {
        const path = getConnectorPath(round, position)
        if (path) {
          connectors.push(
            <path
              key={`connector-${round}-${position}`}
              d={path}
              stroke={theme.colors.border}
              strokeWidth={2}
              fill="none"
            />
          )
        }
      })
    }

    return connectors
  }

  const renderRound = (round: number) => {
    const roundMatches = matchesByRound.get(round) || []
    if (roundMatches.length === 0) return null

    const columnX = PADDING + (round - 1) * COLUMN_WIDTH

    return (
      <g key={`round-${round}`}>
        {/* Round label */}
        <text
          x={columnX + MATCH_WIDTH / 2}
          y={20}
          textAnchor="middle"
          fill={theme.colors.textSecondary}
          fontSize={theme.typography.fontSize.sm}
          fontWeight={theme.typography.fontWeight.semibold}
        >
          {round === rounds ? 'Final' : `Jornada ${round}`}
        </text>

        {/* Match cards */}
        {roundMatches.map((match, position) => {
          const matchCount = roundMatches.length
          const y = getMatchY(round, position, matchCount)

          return (
            <foreignObject
              key={match.id}
              x={columnX}
              y={y}
              width={MATCH_WIDTH}
              height={MATCH_HEIGHT}
            >
              <MatchCard
                match={match}
                variant={variant}
                matchType={matchType === 'HOME_AND_AWAY' ? 'HOME_AND_AWAY' : 'SINGLE_LEG'}
                onClick={variant === 'admin' && onMatchClick ? () => onMatchClick(match) : undefined}
              />
            </foreignObject>
          )
        })}
      </g>
    )
  }

  return (
    <div style={{
      overflowX: 'auto',
      padding: theme.spacing.md,
    }}>
      <svg
        width={containerWidth}
        height={containerHeight}
        style={{
          display: 'block',
          minWidth: containerWidth,
        }}
      >
        {/* Connector lines */}
        {renderConnectors()}

        {/* Rounds and matches */}
        {Array.from({ length: rounds }, (_, i) => renderRound(i + 1))}
      </svg>
    </div>
  )
}
