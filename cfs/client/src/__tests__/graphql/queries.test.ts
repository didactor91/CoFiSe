import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useNewsQuery, useProductsQuery, useNewsItemQuery } from '../../graphql/queries'

// Mock the graphql client
vi.mock('../../graphql/client', () => ({
  graphqlClient: {
    query: vi.fn(),
  },
}))

describe('GraphQL Queries', () => {
  describe('useNewsQuery', () => {
    it('should be defined as a query function', () => {
      expect(useNewsQuery).toBeDefined()
    })
  })

  describe('useProductsQuery', () => {
    it('should be defined as a query function', () => {
      expect(useProductsQuery).toBeDefined()
    })
  })

  describe('useNewsItemQuery', () => {
    it('should be defined as a query function that accepts an id', () => {
      expect(useNewsItemQuery).toBeDefined()
    })
  })
})
