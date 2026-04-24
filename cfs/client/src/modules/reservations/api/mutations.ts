import { useMutation } from 'urql'
import type { UseMutationResponse } from 'urql'
import type { CreateReservationMutationResult } from '../../../graphql/generated-types'

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
