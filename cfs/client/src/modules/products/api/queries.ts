import { useQuery, type UseQueryResponse } from 'urql'

import type { ProductsQueryResult } from '../../../graphql/generated-types'

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

export const PRODUCT_QUERY = `
  query Product($id: ID!) {
    product(id: $id) {
      id
      name
      description
      price
      stock
      limitedStock
      imageUrl
      options {
        id
        name
        required
        values {
          id
          value
          stock
        }
      }
    }
  }
`

export function useProductsQuery(): UseQueryResponse<ProductsQueryResult> {
    return useQuery<ProductsQueryResult>({ query: PRODUCTS_QUERY })
}

export function useProductQuery(id: string) {
    return useQuery({ query: PRODUCT_QUERY, variables: { id } })
}
