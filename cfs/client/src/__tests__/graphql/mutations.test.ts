import { describe, it, expect } from 'vitest'
import { useLoginMutation, useCreateReservationMutation, useCreateNewsMutation, useUpdateNewsMutation, useDeleteNewsMutation } from '../../graphql/mutations'

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

  describe('useCreateNewsMutation', () => {
    it('should be defined as a mutation function', () => {
      expect(useCreateNewsMutation).toBeDefined()
    })
  })

  describe('useUpdateNewsMutation', () => {
    it('should be defined as a mutation function', () => {
      expect(useUpdateNewsMutation).toBeDefined()
    })
  })

  describe('useDeleteNewsMutation', () => {
    it('should be defined as a mutation function', () => {
      expect(useDeleteNewsMutation).toBeDefined()
    })
  })
})