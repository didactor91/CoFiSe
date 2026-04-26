import { useMutation } from 'urql'

export const CREATE_COMPETITION_MUTATION = `
  mutation CreateCompetition($input: CreateCompetitionInput!) {
    createCompetition(input: $input) {
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
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_COMPETITION_MUTATION = `
  mutation UpdateCompetition($id: ID!, $input: UpdateCompetitionInput!) {
    updateCompetition(id: $id, input: $input) {
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
      createdAt
      updatedAt
    }
  }
`

export const DELETE_COMPETITION_MUTATION = `
  mutation DeleteCompetition($id: ID!) {
    deleteCompetition(id: $id)
  }
`

export const ADD_PARTICIPANTS_MUTATION = `
  mutation AddParticipants($input: AddParticipantsInput!) {
    addParticipants(input: $input) {
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
      createdAt
      updatedAt
    }
  }
`

export const GENERATE_BRACKET_MUTATION = `
  mutation GenerateBracket($competitionId: ID!) {
    generateBracket(competitionId: $competitionId) {
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
        winner {
          id
          alias
        }
        status
        isBye
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`

export const SET_MATCH_RESULT_MUTATION = `
  mutation SetMatchResult($input: SetMatchResultInput!) {
    setMatchResult(input: $input) {
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
      winner {
        id
        alias
      }
      status
      isBye
      createdAt
    }
  }
`

export function useCreateCompetitionMutation() {
  return useMutation(CREATE_COMPETITION_MUTATION)
}

export function useUpdateCompetitionMutation() {
  return useMutation(UPDATE_COMPETITION_MUTATION)
}

export function useDeleteCompetitionMutation() {
  return useMutation(DELETE_COMPETITION_MUTATION)
}

export function useAddParticipantsMutation() {
  return useMutation(ADD_PARTICIPANTS_MUTATION)
}

export function useGenerateBracketMutation() {
  return useMutation(GENERATE_BRACKET_MUTATION)
}

export function useSetMatchResultMutation() {
  return useMutation(SET_MATCH_RESULT_MUTATION)
}