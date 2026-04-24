import { useMutation } from 'urql'
import type { UseMutationResponse } from 'urql'
import type { LoginMutationResult } from '../../../graphql/generated-types'

export const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      refreshToken
      user {
        id
        email
        role
        createdAt
      }
    }
  }
`

export const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      token
      refreshToken
      user {
        id
        email
        role
        createdAt
      }
    }
  }
`

export function useLoginMutation(): UseMutationResponse<LoginMutationResult> {
    return useMutation<LoginMutationResult>(LOGIN_MUTATION)
}
