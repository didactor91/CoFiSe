import { useMutation } from 'urql'
import type { UseMutationResponse } from 'urql'
import type {
  AuthPayload,
  CreateReservationInput,
  Reservation,
  LoginMutationResult,
  CreateReservationMutationResult,
  CreateUserInput,
  User,
  DeleteUserMutationResult,
  CreateProductInput,
  UpdateProductInput,
  CreateProductMutationResult,
  UpdateProductMutationResult,
  DeleteProductMutationResult,
} from '../graphql/generated-types'

export const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        role
        createdAt
      }
    }
  }
`

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

export const CREATE_USER_MUTATION = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      role
      createdAt
    }
  }
`

export const DELETE_USER_MUTATION = `
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`

export const CREATE_PRODUCT_MUTATION = `
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
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

export const UPDATE_PRODUCT_MUTATION = `
  mutation UpdateProduct($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
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

export const DELETE_PRODUCT_MUTATION = `
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`

export function useLoginMutation(): UseMutationResponse<LoginMutationResult> {
  return useMutation<LoginMutationResult>(LOGIN_MUTATION)
}

export function useCreateReservationMutation(): UseMutationResponse<CreateReservationMutationResult> {
  return useMutation<CreateReservationMutationResult>(CREATE_RESERVATION_MUTATION)
}

export function useCreateUserMutation(): UseMutationResponse<{ createUser: User }> {
  return useMutation(CREATE_USER_MUTATION)
}

export function useDeleteUserMutation(): UseMutationResponse<DeleteUserMutationResult> {
  return useMutation<DeleteUserMutationResult>(DELETE_USER_MUTATION)
}

export function useCreateProductMutation(): UseMutationResponse<CreateProductMutationResult> {
  return useMutation<CreateProductMutationResult>(CREATE_PRODUCT_MUTATION)
}

export function useUpdateProductMutation(): UseMutationResponse<UpdateProductMutationResult> {
  return useMutation<UpdateProductMutationResult>(UPDATE_PRODUCT_MUTATION)
}

export function useDeleteProductMutation(): UseMutationResponse<DeleteProductMutationResult> {
  return useMutation<DeleteProductMutationResult>(DELETE_PRODUCT_MUTATION)
}