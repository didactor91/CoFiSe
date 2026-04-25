import { useQuery, type UseQueryResponse } from 'urql'

import type {
    ReservationMetricsQueryResult,
    ReservationStatus,
    ReservationsQueryResult,
} from '../../../graphql/generated-types'

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
      items {
        id
        reservationId
        productId
        productName
        optionValueId
        optionValue
        quantity
        unitPrice
      }
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

export function useReservationsQuery(options?: {
    status?: ReservationStatus
}): UseQueryResponse<ReservationsQueryResult> {
    return useQuery<ReservationsQueryResult>({
        query: RESERVATIONS_QUERY,
        variables: options?.status ? { status: options.status } : {},
    })
}

export const RESERVATION_METRICS_QUERY = `
  query ReservationMetrics($status: ReservationStatus) {
    reservationMetrics(status: $status) {
      totalReservations
      totalUnits
      byProduct {
        productId
        productName
        quantity
      }
      bySize {
        size
        quantity
      }
    }
  }
`

export function useReservationMetricsQuery(options?: {
    status?: ReservationStatus
}): UseQueryResponse<ReservationMetricsQueryResult> {
    return useQuery<ReservationMetricsQueryResult>({
        query: RESERVATION_METRICS_QUERY,
        variables: options?.status ? { status: options.status } : {},
    })
}
