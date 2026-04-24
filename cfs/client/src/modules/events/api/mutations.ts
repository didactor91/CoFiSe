import { useMutation } from 'urql'

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
