import { useQuery } from 'urql'
import type { UseQueryResponse } from 'urql'
import type {
  News,
  Product,
  Reservation,
  User,
  ReservationStatus,
  NewsQueryResult,
  ProductsQueryResult,
  NewsItemQueryResult,
  AllNewsQueryResult,
  ReservationsQueryResult,
  UsersQueryResult,
  MeQueryResult,
} from '../graphql/generated-types'

export const NEWS_QUERY = `
  query News {
    news {
      id
      title
      content
      imageUrl
      createdAt
      updatedAt
    }
  }
`

export const PRODUCTS_QUERY = `
  query Products {
    products {
      id
      name
      description
      price
      stock
      limitedStock
      imageUrl
      createdAt
      updatedAt
      options {
        id
        productId
        name
        required
        values {
          id
          optionId
          value
          stock
        }
      }
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
      createdAt
      updatedAt
    }
  }
`

export const EVENTS_QUERY = `
  query Events {
    events {
      id
      name
      description
      location
      startTime
      endTime
    }
  }
`

export const EVENT_QUERY = `
  query Event($id: ID!) {
    event(id: $id) {
      id
      name
      description
      location
      startTime
      endTime
      createdAt
      updatedAt
    }
  }
`

export const ALL_EVENTS_QUERY = `
  query AllEvents {
    allEvents {
      id
      name
      description
      location
      startTime
      endTime
      createdAt
      updatedAt
    }
  }
`

export const RESERVATIONS_QUERY = `
  query Reservations($status: ReservationStatus) {
    reservations(status: $status) {
      id
      productId
      quantity
      name
      email
      phone
      notes
      status
      createdAt
      updatedAt
      product {
        id
        name
        description
        price
        stock
        imageUrl
        createdAt
        updatedAt
      }
    }
  }
`

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

export function useNewsQuery(): UseQueryResponse<NewsQueryResult> {
  return useQuery<NewsQueryResult>({ query: NEWS_QUERY })
}

export function useProductsQuery(): UseQueryResponse<ProductsQueryResult> {
  return useQuery<ProductsQueryResult>({ query: PRODUCTS_QUERY })
}

export function useNewsItemQuery(id: string): UseQueryResponse<NewsItemQueryResult> {
  return useQuery<NewsItemQueryResult>({ query: NEWS_ITEM_QUERY, variables: { id } })
}

export function useAllNewsQuery(): UseQueryResponse<AllNewsQueryResult> {
  return useQuery<AllNewsQueryResult>({ query: ALL_NEWS_QUERY })
}

export function useReservationsQuery(options?: {
  status?: ReservationStatus
}): UseQueryResponse<ReservationsQueryResult> {
  return useQuery<ReservationsQueryResult>({
    query: RESERVATIONS_QUERY,
    variables: options?.status ? { status: options.status } : {},
  })
}

export function useUsersQuery(): UseQueryResponse<UsersQueryResult> {
  return useQuery<UsersQueryResult>({ query: USERS_QUERY })
}

export function useMeQuery(): UseQueryResponse<MeQueryResult> {
  return useQuery<MeQueryResult>({ query: ME_QUERY })
}

// Event queries
export function useEventsQuery() {
  return useQuery({ query: EVENTS_QUERY })
}

export function useEventQuery(id: string) {
  return useQuery({ query: EVENT_QUERY, variables: { id } })
}

export function useAllEventsQuery() {
  return useQuery({ query: ALL_EVENTS_QUERY })
}