import { useQuery } from 'urql'

export const PUBLIC_COMPETITIONS_QUERY = `
  query PublicCompetitions {
    publicCompetitions {
      id
      name
      description
      matchType
      status
      participantCount
      participants {
        id
        alias
      }
      matches {
        id
        round
        position
        participant1 {
          id
          alias
        }
        participant2 {
          id
          alias
        }
        homeScore1
        homeScore2
        awayScore1
        awayScore2
        status
        isBye
        winner {
          id
          alias
        }
      }
      createdAt
      updatedAt
    }
  }
`

export const PUBLIC_COMPETITION_QUERY = `
  query PublicCompetition($id: ID!) {
    publicCompetition(id: $id) {
      id
      name
      description
      matchType
      status
      participantCount
      participants {
        id
        alias
      }
      matches {
        id
        round
        position
        participant1 {
          id
          alias
        }
        participant2 {
          id
          alias
        }
        homeScore1
        homeScore2
        awayScore1
        awayScore2
        status
        isBye
        winner {
          id
          alias
        }
      }
      createdAt
      updatedAt
    }
  }
`

export function usePublicCompetitionsQuery() {
  return useQuery({ query: PUBLIC_COMPETITIONS_QUERY })
}

export function usePublicCompetitionQuery(id: string) {
  return useQuery({ query: PUBLIC_COMPETITION_QUERY, variables: { id } })
}

// Staff/Admin query for all competitions (including DRAFT)
export const COMPETITIONS_QUERY = `
  query Competitions {
    competitions {
      id
      name
      description
      matchType
      status
      participantCount
      participants {
        id
        alias
      }
      matches {
        id
        round
        position
        participant1 {
          id
          alias
        }
        participant2 {
          id
          alias
        }
        homeScore1
        homeScore2
        awayScore1
        awayScore2
        status
        isBye
        winner {
          id
          alias
        }
      }
      createdAt
      updatedAt
    }
  }
`

export function useCompetitionsQuery() {
  return useQuery({ query: COMPETITIONS_QUERY })
}
