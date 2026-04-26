import { useMemo } from 'react'

interface Match {
  id: string
  round: number
  position: number
  participant1?: { id: string; alias: string } | null
  participant2?: { id: string; alias: string } | null
  homeScore1?: number | null
  homeScore2?: number | null
  awayScore1?: number | null
  awayScore2?: number | null
  winner?: { id: string; alias: string } | null
  status: string
  isBye: boolean
}

interface BracketPreviewProps {
  matches: Match[]
  rounds: number
}

const MATCH_WIDTH = 160
const MATCH_HEIGHT = 48
const ROUND_GAP = 60
const MATCH_GAP = 16

export function BracketPreview({ matches, rounds }: BracketPreviewProps) {
  const roundsData = useMemo(() => {
    const result: Match[][] = []
    for (let r = 1; r <= rounds; r++) {
      const roundMatches = matches.filter(m => m.round === r)
      const sorted = [...roundMatches].sort((a, b) => a.position - b.position)
      result.push(sorted)
    }
    return result
  }, [matches, rounds])

  const containerWidth = rounds * (MATCH_WIDTH + ROUND_GAP)
  const maxMatchesInRound = roundsData.length > 0 ? Math.max(...roundsData.map(r => r.length)) : 0
  const containerHeight = maxMatchesInRound * (MATCH_HEIGHT + MATCH_GAP) + MATCH_GAP

  if (matches.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.875rem',
      }}>
        La parrilla se generará al añadir participantes
      </div>
    )
  }

  return (
    <div style={{
      overflowX: 'auto',
      padding: '1rem',
    }}>
      <svg
        width={containerWidth}
        height={containerHeight}
        style={{ display: 'block', minWidth: containerWidth }}
      >
        {roundsData.map((roundMatches, roundIndex) => {
          const roundY = MATCH_GAP / 2
          const matchSpacing = MATCH_HEIGHT + MATCH_GAP

          return roundMatches.map((match, matchIndex) => {
            const x = roundIndex * (MATCH_WIDTH + ROUND_GAP)
            const y = roundY + matchIndex * matchSpacing

            const p1Name = match.participant1?.alias ?? '-'
            const p2Name = match.participant2?.alias ?? (match.isBye ? 'Pasa directamente' : '-')
            const p1Score = match.homeScore1 ?? null
            const p2Score = match.homeScore2 ?? null

            const isP1Winner = match.winner?.id === match.participant1?.id
            const isP2Winner = match.winner?.id === match.participant2?.id

            return (
              <g key={match.id}>
                {/* Connector line to next round */}
                {roundIndex < rounds - 1 && matchIndex % 2 === 0 && (
                  <path
                    d={`M ${x + MATCH_WIDTH} ${y + MATCH_HEIGHT / 2}
                        L ${x + MATCH_WIDTH + ROUND_GAP / 2} ${y + MATCH_HEIGHT / 2}`}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    fill="none"
                  />
                )}

                {/* Match card background */}
                <rect
                  x={x}
                  y={y}
                  width={MATCH_WIDTH}
                  height={MATCH_HEIGHT}
                  rx="4"
                  fill={match.isBye ? '#f1f5f9' : '#ffffff'}
                  stroke={isP1Winner || isP2Winner ? '#22c55e' : '#e2e8f0'}
                  strokeWidth="1"
                  strokeDasharray={match.isBye ? '4 2' : undefined}
                />

                {/* Participant 1 */}
                <text
                  x={x + 8}
                  y={y + 18}
                  fontSize="11"
                  fill={isP1Winner ? '#15803d' : '#0f172a'}
                  fontWeight={isP1Winner ? '600' : '400'}
                >
                  {p1Name.length > 16 ? p1Name.slice(0, 14) + '...' : p1Name}
                </text>

                {/* Participant 1 score */}
                {p1Score !== null && (
                  <text
                    x={x + MATCH_WIDTH - 8}
                    y={y + 18}
                    fontSize="11"
                    fill={isP1Winner ? '#15803d' : '#0f172a'}
                    textAnchor="end"
                    fontWeight="600"
                  >
                    {p1Score}
                  </text>
                )}

                {/* Divider line */}
                <line
                  x1={x}
                  y1={y + MATCH_HEIGHT / 2}
                  x2={x + MATCH_WIDTH}
                  y2={y + MATCH_HEIGHT / 2}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />

                {/* Participant 2 */}
                <text
                  x={x + 8}
                  y={y + MATCH_HEIGHT - 6}
                  fontSize="11"
                  fill={isP2Winner ? '#15803d' : '#0f172a'}
                  fontWeight={isP2Winner ? '600' : '400'}
                >
                  {p2Name.length > 16 ? p2Name.slice(0, 14) + '...' : p2Name}
                </text>

                {/* Participant 2 score */}
                {p2Score !== null && (
                  <text
                    x={x + MATCH_WIDTH - 8}
                    y={y + MATCH_HEIGHT - 6}
                    fontSize="11"
                    fill={isP2Winner ? '#15803d' : '#0f172a'}
                    textAnchor="end"
                    fontWeight="600"
                  >
                    {p2Score}
                  </text>
                )}

                {/* Round label */}
                {matchIndex === 0 && (
                  <text
                    x={x + MATCH_WIDTH / 2}
                    y={-8}
                    fontSize="10"
                    fill="#94a3b8"
                    textAnchor="middle"
                  >
                    {roundIndex === rounds - 1 ? 'Final' : roundIndex === rounds - 2 ? 'Semifinales' : `Ronda ${roundIndex + 1}`}
                  </text>
                )}
              </g>
            )
          })
        })}
      </svg>
    </div>
  )
}

export default BracketPreview