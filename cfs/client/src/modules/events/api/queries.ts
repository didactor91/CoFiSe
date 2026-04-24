import { useQuery } from 'urql'

export const EVENTS_QUERY = `
  query Events {
    events {
      id
      name
      description
      location
      startTime
      endTime
    }
  }
`

export const EVENT_QUERY = `
  query Event($id: ID!) {
    event(id: $id) {
      id
      name
      description
      location
      startTime
      endTime
      createdAt
      updatedAt
    }
  }
`

export const ALL_EVENTS_QUERY = `
  query AllEvents {
    allEvents {
      id
      name
      description
      location
      startTime
      endTime
      createdAt
      updatedAt
    }
  }
`

export function useEventsQuery() {
    return useQuery({ query: EVENTS_QUERY })
}

export function useEventQuery(id: string) {
    return useQuery({ query: EVENT_QUERY, variables: { id } })
}

export function useAllEventsQuery() {
    return useQuery({ query: ALL_EVENTS_QUERY })
}
