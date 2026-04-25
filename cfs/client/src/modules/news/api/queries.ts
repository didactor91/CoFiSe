import { useQuery, type UseQueryResponse } from 'urql'

import type { NewsQueryResult, NewsItemQueryResult, AllNewsQueryResult } from '../../../graphql/generated-types'

export const NEWS_QUERY = `
  query News {
    news {
      id
      title
      content
      imageUrl
      published
      createdAt
      updatedAt
    }
  }
`

export const NEWS_ITEM_QUERY = `
  query NewsItem($id: ID!) {
    newsItem(id: $id) {
      id
      title
      content
      imageUrl
      published
      createdAt
      updatedAt
    }
  }
`

export const ALL_NEWS_QUERY = `
  query AllNews {
    allNews {
      id
      title
      content
      imageUrl
      published
      createdAt
      updatedAt
    }
  }
`

export function useNewsQuery(): UseQueryResponse<NewsQueryResult> {
    return useQuery<NewsQueryResult>({ query: NEWS_QUERY })
}

export function useNewsItemQuery(id: string): UseQueryResponse<NewsItemQueryResult> {
    return useQuery<NewsItemQueryResult>({ query: NEWS_ITEM_QUERY, variables: { id } })
}

export function useAllNewsQuery(): UseQueryResponse<AllNewsQueryResult> {
    return useQuery<AllNewsQueryResult>({ query: ALL_NEWS_QUERY })
}
