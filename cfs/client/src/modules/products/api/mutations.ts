import { useMutation, type UseMutationResponse } from 'urql'

import type {
    CreateProductMutationResult,
    UpdateProductMutationResult,
    DeleteProductMutationResult,
} from '../../../graphql/generated-types'

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

export const CREATE_PRODUCT_OPTION_MUTATION = `
  mutation CreateProductOption($input: CreateProductOptionInput!) {
    createProductOption(input: $input) {
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
`

export const UPDATE_PRODUCT_OPTION_MUTATION = `
  mutation UpdateProductOption($id: ID!, $input: UpdateProductOptionInput!) {
    updateProductOption(id: $id, input: $input) {
      id
      productId
      name
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

export function useCreateProductMutation(): UseMutationResponse<CreateProductMutationResult> {
    return useMutation<CreateProductMutationResult>(CREATE_PRODUCT_MUTATION)
}

export function useUpdateProductMutation(): UseMutationResponse<UpdateProductMutationResult> {
    return useMutation<UpdateProductMutationResult>(UPDATE_PRODUCT_MUTATION)
}

export function useDeleteProductMutation(): UseMutationResponse<DeleteProductMutationResult> {
    return useMutation<DeleteProductMutationResult>(DELETE_PRODUCT_MUTATION)
}

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
