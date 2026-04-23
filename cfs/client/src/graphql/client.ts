import { Client, cacheExchange, fetchExchange } from 'urql'
import { getAuthToken } from '../utils/cookies'

// Note: fetchOptions is called per-request by urql
export const graphqlClient = new Client({
  url: '/api/graphql',
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const token = getAuthToken()
    return {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include', // Important: send cookies on cross-origin requests
    }
  },
})