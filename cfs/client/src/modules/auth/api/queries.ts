import { useQuery, type UseQueryResponse } from 'urql'

import type { MeQueryResult } from '../../../graphql/generated-types'

export const ME_QUERY = `
  query Me {
    me {
      id
      email
      role
      createdAt
    }
  }
`

export function useMeQuery(): UseQueryResponse<MeQueryResult> {
    return useQuery<MeQueryResult>({ query: ME_QUERY })
}
