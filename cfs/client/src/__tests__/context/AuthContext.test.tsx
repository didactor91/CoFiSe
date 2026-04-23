import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../context/AuthContext'

// Mock the cookie functions
vi.mock('../../utils/cookies', () => ({
  getAuthToken: vi.fn(() => null),
  getRefreshToken: vi.fn(() => null),
  setAuthToken: vi.fn(),
  setRefreshToken: vi.fn(),
  removeAuthToken: vi.fn(),
  removeRefreshToken: vi.fn(),
  removeAllAuthTokens: vi.fn(),
}))

// Mock the graphql client with proper URQL mutation mock structure
vi.mock('../../graphql/client', () => ({
  graphqlClient: {
    mutation: vi.fn().mockReturnValue({
      toPromise: vi.fn().mockResolvedValue({
        data: {
          login: {
            token: 'fake-token',
            refreshToken: 'fake-refresh-token',
            user: {
              id: '1',
              email: 'admin@senacom.com',
              role: 'ADMIN',
              createdAt: new Date().toISOString(),
            },
          },
        },
        error: undefined,
      }),
    }),
  },
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('AuthContext', () => {
  describe('Initial State', () => {
    it('should provide user as null and token as null initially', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
    })

    it('should provide login, logout, and isAuthenticated functions', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      expect(result.current.login).toBeDefined()
      expect(result.current.logout).toBeDefined()
      expect(result.current.isAuthenticated).toBeDefined()
    })
  })

  describe('login()', () => {
    it('should set user and token when login is called', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        await result.current.login('admin@senacom.com', 'changeme123')
      })
      
      expect(result.current.user).toBeDefined()
      expect(result.current.user?.email).toBe('admin@senacom.com')
      expect(result.current.token).toBeDefined()
    })
  })

  describe('logout()', () => {
    it('should clear user and token when logout is called', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      // First login
      await act(async () => {
        await result.current.login('admin@senacom.com', 'changeme123')
      })
      
      expect(result.current.user).toBeDefined()
      
      // Then logout
      await act(async () => {
        result.current.logout()
      })
      
      expect(result.current.user).toBeNull()
      expect(result.current.token).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('should return false when not logged in', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should return true when logged in', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      
      await act(async () => {
        await result.current.login('admin@senacom.com', 'changeme123')
      })
      
      expect(result.current.isAuthenticated).toBe(true)
    })
  })
})