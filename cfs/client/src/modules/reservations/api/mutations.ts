import { useMutation, type UseMutationResponse } from 'urql'

import type {
    CreateReservationMutationResult,
    Reservation,
    UpdateReservationStatusMutationResult,
} from '../../../graphql/generated-types'

export const CREATE_RESERVATION_MUTATION = `
  mutation CreateReservation($input: CreateReservationInput!) {
    createReservation(input: $input) {
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
    }
  }
`

export function useCreateReservationMutation(): UseMutationResponse<CreateReservationMutationResult> {
    return useMutation<CreateReservationMutationResult>(CREATE_RESERVATION_MUTATION)
}

export const UPDATE_RESERVATION_STATUS_MUTATION = `
  mutation UpdateReservationStatus($id: ID!, $status: ReservationStatus!) {
    updateReservationStatus(id: $id, status: $status) {
      id
      status
      updatedAt
    }
  }
`

export function useUpdateReservationStatusMutation(): UseMutationResponse<UpdateReservationStatusMutationResult> {
    return useMutation<UpdateReservationStatusMutationResult>(UPDATE_RESERVATION_STATUS_MUTATION)
}

export interface UpdateReservationMutationResult {
  updateReservation: Reservation
}

export interface UpdateReservationMutationVariables {
  id: string
  input: {
    name?: string
    email?: string
    phone?: string
    notes?: string
    items: Array<{
      productId: string
      quantity: number
      optionValueId?: string | null
    }>
  }
}

export const UPDATE_RESERVATION_MUTATION = `
  mutation UpdateReservation($id: ID!, $input: UpdateReservationInput!) {
    updateReservation(id: $id, input: $input) {
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
        limitedStock
        imageUrl
        createdAt
        updatedAt
      }
    }
  }
`

export function useUpdateReservationMutation(): UseMutationResponse<
  UpdateReservationMutationResult,
  UpdateReservationMutationVariables
> {
  return useMutation<UpdateReservationMutationResult, UpdateReservationMutationVariables>(
    UPDATE_RESERVATION_MUTATION
  )
}
