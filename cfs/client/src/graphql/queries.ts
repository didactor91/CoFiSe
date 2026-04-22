import { useQuery, UseQueryResponse } from 'urql'
import {
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
} from '../../../packages/types/generated/graphql'

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
      imageUrl
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