import { useMutation } from 'urql'
import type { UseMutationResponse } from 'urql'
import type {
    CreateNewsMutationResult,
    UpdateNewsMutationResult,
    DeleteNewsMutationResult,
} from '../../../graphql/generated-types'

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

export function useCreateNewsMutation(): UseMutationResponse<CreateNewsMutationResult> {
    return useMutation<CreateNewsMutationResult>(CREATE_NEWS_MUTATION)
}

export function useUpdateNewsMutation(): UseMutationResponse<UpdateNewsMutationResult> {
    return useMutation<UpdateNewsMutationResult>(UPDATE_NEWS_MUTATION)
}

export function useDeleteNewsMutation(): UseMutationResponse<DeleteNewsMutationResult> {
    return useMutation<DeleteNewsMutationResult>(DELETE_NEWS_MUTATION)
}
