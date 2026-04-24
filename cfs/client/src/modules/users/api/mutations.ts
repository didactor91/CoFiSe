import { useMutation } from 'urql'
import type { UseMutationResponse } from 'urql'
import type {
    User,
    CreateUserMutationResult,
    DeleteUserMutationResult,
} from '../../../graphql/generated-types'

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

export const UPDATE_USER_MUTATION = `
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
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

export const CREATE_ROLE_MUTATION = `
  mutation CreateRole($input: CreateRoleInput!) {
    createRole(input: $input) {
      id
      name
      permissions
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_ROLE_MUTATION = `
  mutation UpdateRole($id: ID!, $input: UpdateRoleInput!) {
    updateRole(id: $id, input: $input) {
      id
      name
      permissions
      createdAt
      updatedAt
    }
  }
`

export const DELETE_ROLE_MUTATION = `
  mutation DeleteRole($id: ID!) {
    deleteRole(id: $id)
  }
`

export function useCreateUserMutation(): UseMutationResponse<{ createUser: User }> {
    return useMutation(CREATE_USER_MUTATION)
}

export function useUpdateUserMutation() {
    return useMutation(UPDATE_USER_MUTATION)
}

export function useDeleteUserMutation(): UseMutationResponse<DeleteUserMutationResult> {
    return useMutation<DeleteUserMutationResult>(DELETE_USER_MUTATION)
}

export function useCreateRoleMutation() {
    return useMutation(CREATE_ROLE_MUTATION)
}

export function useUpdateRoleMutation() {
    return useMutation(UPDATE_ROLE_MUTATION)
}

export function useDeleteRoleMutation() {
    return useMutation(DELETE_ROLE_MUTATION)
}
