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
  CreateNewsInput,
  UpdateNewsInput,
  CreateNewsMutationResult,
  UpdateNewsMutationResult,
  DeleteNewsMutationResult,
} from '../graphql/generated-types'

export const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      refreshToken
      user {
        id
        email
        role
        createdAt
      }
    }
  }
`

export const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      token
      refreshToken
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

export const CREATE_NEWS_MUTATION = `
  mutation CreateNews($input: CreateNewsInput!) {
    createNews(input: $input) {
      id
      title
      content
      imageUrl
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_NEWS_MUTATION = `
  mutation UpdateNews($id: ID!, $input: UpdateNewsInput!) {
    updateNews(id: $id, input: $input) {
      id
      title
      content
      imageUrl
      createdAt
      updatedAt
    }
  }
`

export const DELETE_NEWS_MUTATION = `
  mutation DeleteNews($id: ID!) {
    deleteNews(id: $id)
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

export function useCreateNewsMutation(): UseMutationResponse<CreateNewsMutationResult> {
  return useMutation<CreateNewsMutationResult>(CREATE_NEWS_MUTATION)
}

export function useUpdateNewsMutation(): UseMutationResponse<UpdateNewsMutationResult> {
  return useMutation<UpdateNewsMutationResult>(UPDATE_NEWS_MUTATION)
}

export function useDeleteNewsMutation(): UseMutationResponse<DeleteNewsMutationResult> {
  return useMutation<DeleteNewsMutationResult>(DELETE_NEWS_MUTATION)
}

// Event mutations
export const CREATE_EVENT_MUTATION = `
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      name
      description
      location
      startTime
      endTime
    }
  }
`

export const UPDATE_EVENT_MUTATION = `
  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      id
      name
      description
      location
      startTime
      endTime
    }
  }
`

export const DELETE_EVENT_MUTATION = `
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`

export function useCreateEventMutation() {
  return useMutation(CREATE_EVENT_MUTATION)
}

export function useUpdateEventMutation() {
  return useMutation(UPDATE_EVENT_MUTATION)
}

export function useDeleteEventMutation() {
  return useMutation(DELETE_EVENT_MUTATION)
}

// Product Option mutations
export const CREATE_PRODUCT_OPTION_MUTATION = `
  mutation CreateProductOption($input: CreateProductOptionInput!) {
    createProductOption(input: $input) {
      id
      productId
      name
      type
      required
      values {
        id
        optionId
        value
        stock
      }
    }
  }
`

export const UPDATE_PRODUCT_OPTION_MUTATION = `
  mutation UpdateProductOption($id: ID!, $input: UpdateProductOptionInput!) {
    updateProductOption(id: $id, input: $input) {
      id
      productId
      name
      type
      required
    }
  }
`

export const DELETE_PRODUCT_OPTION_MUTATION = `
  mutation DeleteProductOption($id: ID!) {
    deleteProductOption(id: $id)
  }
`

export const ADD_OPTION_VALUES_MUTATION = `
  mutation AddOptionValues($optionId: ID!, $values: [OptionValueInput!]!) {
    addOptionValues(optionId: $optionId, values: $values) {
      id
      productId
      name
      type
      required
      values {
        id
        optionId
        value
        stock
      }
    }
  }
`

export const UPDATE_OPTION_VALUE_MUTATION = `
  mutation UpdateOptionValue($id: ID!, $value: String, $stock: Int) {
    updateOptionValue(id: $id, value: $value, stock: $stock) {
      id
      optionId
      value
      stock
    }
  }
`

export const DELETE_OPTION_VALUE_MUTATION = `
  mutation DeleteOptionValue($id: ID!) {
    deleteOptionValue(id: $id)
  }
`

export function useCreateProductOptionMutation() {
  return useMutation(CREATE_PRODUCT_OPTION_MUTATION)
}

export function useUpdateProductOptionMutation() {
  return useMutation(UPDATE_PRODUCT_OPTION_MUTATION)
}

export function useDeleteProductOptionMutation() {
  return useMutation(DELETE_PRODUCT_OPTION_MUTATION)
}

export function useAddOptionValuesMutation() {
  return useMutation(ADD_OPTION_VALUES_MUTATION)
}

export function useUpdateOptionValueMutation() {
  return useMutation(UPDATE_OPTION_VALUE_MUTATION)
}

export function useDeleteOptionValueMutation() {
  return useMutation(DELETE_OPTION_VALUE_MUTATION)
}