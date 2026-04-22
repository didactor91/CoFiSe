import { describe, it, expect } from 'vitest'
import { useLoginMutation, useCreateReservationMutation } from '../../graphql/mutations'

describe('GraphQL Mutations', () => {
  describe('useLoginMutation', () => {
    it('should be defined as a mutation function', () => {
      expect(useLoginMutation).toBeDefined()
    })
  })

  describe('useCreateReservationMutation', () => {
    it('should be defined as a mutation function', () => {
      expect(useCreateReservationMutation).toBeDefined()
    })
  })
})