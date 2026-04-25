import { useMutation, type UseMutationResponse } from 'urql'

import type {
    CreateNewsMutationResult,
    UpdateNewsMutationResult,
    PublishNewsMutationResult,
    UnpublishNewsMutationResult,
    DeleteNewsMutationResult,
} from '../../../graphql/generated-types'

export const CREATE_NEWS_MUTATION = `
  mutation CreateNews($input: CreateNewsInput!) {
    createNews(input: $input) {
      id
      title
      content
      imageUrl
      published
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
      published
      createdAt
      updatedAt
    }
  }
`

export const PUBLISH_NEWS_MUTATION = `
  mutation PublishNews($id: ID!) {
    publishNews(id: $id) {
      id
      title
      content
      imageUrl
      published
      createdAt
      updatedAt
    }
  }
`

export const UNPUBLISH_NEWS_MUTATION = `
  mutation UnpublishNews($id: ID!) {
    unpublishNews(id: $id) {
      id
      title
      content
      imageUrl
      published
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

export function usePublishNewsMutation(): UseMutationResponse<PublishNewsMutationResult> {
    return useMutation<PublishNewsMutationResult>(PUBLISH_NEWS_MUTATION)
}

export function useUnpublishNewsMutation(): UseMutationResponse<UnpublishNewsMutationResult> {
    return useMutation<UnpublishNewsMutationResult>(UNPUBLISH_NEWS_MUTATION)
}
