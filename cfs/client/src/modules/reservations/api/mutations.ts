import { useMutation, type UseMutationResponse } from 'urql'

import type {
    CreateReservationMutationResult,
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
