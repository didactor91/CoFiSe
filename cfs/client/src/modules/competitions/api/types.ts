// Competition-related GraphQL types
// These types mirror the GraphQL schema for competitions

export enum MatchType {
  SINGLE_LEG = 'SINGLE_LEG',
  HOME_AND_AWAY = 'HOME_AND_AWAY',
}

export enum CompetitionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export enum MatchStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export interface Participant {
  id: string
  alias: string
  createdAt: string
}

export interface Match {
  id: string
  round: number
  position: number
  participant1: Participant | null
  participant2: Participant | null
  homeScore1: number | null
  homeScore2: number | null
  awayScore1: number | null
  awayScore2: number | null
  winner: Participant | null
  status: MatchStatus
  isBye: boolean
  createdAt: string
}

export interface Competition {
  id: string
  name: string
  description: string | null
  matchType: MatchType
  status: CompetitionStatus
  participantCount: number
  participants: Participant[]
  matches: Match[]
  createdAt: string
  updatedAt: string
}

export interface PublicCompetitionsQueryResult {
  publicCompetitions: Competition[]
}

export interface CompetitionQueryResult {
  competition: Competition | null
}
