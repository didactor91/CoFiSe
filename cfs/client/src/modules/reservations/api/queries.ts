import { useQuery } from 'urql'
import type { UseQueryResponse } from 'urql'
import type { ReservationStatus, ReservationsQueryResult } from '../../../graphql/generated-types'

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

export function useReservationsQuery(options?: {
    status?: ReservationStatus
}): UseQueryResponse<ReservationsQueryResult> {
    return useQuery<ReservationsQueryResult>({
        query: RESERVATIONS_QUERY,
        variables: options?.status ? { status: options.status } : {},
    })
}
