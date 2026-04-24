import { useQuery } from 'urql'
import type { UseQueryResponse } from 'urql'
import type { UsersQueryResult } from '../../../graphql/generated-types'

export const USERS_QUERY = `
  query Users {
    users {
      id
      email
      role
      createdAt
    }
  }
`

export const ROLES_QUERY = `
  query Roles {
    roles {
      id
      name
      permissions
      createdAt
      updatedAt
    }
  }
`

export function useUsersQuery(): UseQueryResponse<UsersQueryResult> {
    return useQuery<UsersQueryResult>({ query: USERS_QUERY })
}

export function useRolesQuery() {
    return useQuery({ query: ROLES_QUERY })
}
