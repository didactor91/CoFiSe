import { Client, cacheExchange, fetchExchange } from 'urql'
import { getAuthToken } from '../utils/cookies'

export const graphqlClient = new Client({
  url: '/api/graphql',
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const token = getAuthToken()
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  },
})