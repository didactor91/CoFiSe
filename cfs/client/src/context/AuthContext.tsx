/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'

import { hasPermission as serverHasPermission, type Permission } from '../auth/permissions'
import { graphqlClient } from '../graphql/client'
import type { User } from '../graphql/generated-types'
import { LOGIN_MUTATION, REFRESH_TOKEN_MUTATION } from '../graphql/mutations'
import { ME_QUERY } from '../graphql/queries'
import { setAuthToken, setRefreshToken, removeAllAuthTokens, getAuthToken, getRefreshToken } from '../utils/cookies'

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
  can: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => getAuthToken())
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return Boolean(getAuthToken() || getRefreshToken())
  })
  const hasInitialized = useRef(false)

  const clearAuthState = useCallback(() => {
    removeAllAuthTokens()
    setUser(null)
    setToken(null)
    setIsLoading(false)
  }, [])

  const refreshAccessToken = useCallback(async (refreshToken: string) => {
    try {
      const result = await graphqlClient.mutation(REFRESH_TOKEN_MUTATION, { refreshToken }).toPromise()

      if (result.error || !result.data?.refreshToken) {
        clearAuthState()
        return
      }

      const { token: newToken, refreshToken: newRefreshToken, user: newUser } = result.data.refreshToken
      setToken(newToken)
      setUser(newUser)
      setAuthToken(newToken)
      setRefreshToken(newRefreshToken)
      setIsLoading(false)
    } catch {
      clearAuthState()
    }
  }, [clearAuthState])

  const validateTokenAndFetchUser = useCallback(async () => {
    try {
      const result = await graphqlClient.query(ME_QUERY, {}).toPromise()

      if (result.error || !result.data?.me) {
        const storedRefreshToken = getRefreshToken()
        if (storedRefreshToken) {
          await refreshAccessToken(storedRefreshToken)
        } else {
          clearAuthState()
        }
        return
      }

      setUser(result.data.me)
      setIsLoading(false)
    } catch {
      const storedRefreshToken = getRefreshToken()
      if (storedRefreshToken) {
        await refreshAccessToken(storedRefreshToken)
      } else {
        clearAuthState()
      }
    }
  }, [clearAuthState, refreshAccessToken])

  // Initialize auth state on mount and token changes.
  useEffect(() => {
    if (hasInitialized.current) {
      return
    }
    hasInitialized.current = true

    const storedRefreshToken = getRefreshToken()
    if (token) {
      if (storedRefreshToken) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void refreshAccessToken(storedRefreshToken)
      } else {
        void validateTokenAndFetchUser()
      }
      return
    }

    if (storedRefreshToken) {
      void refreshAccessToken(storedRefreshToken)
    }
  }, [token, refreshAccessToken, validateTokenAndFetchUser])

  const login = useCallback(async (email: string, password: string) => {
    const result = await graphqlClient.mutation(LOGIN_MUTATION, { email, password }).toPromise()
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    if (result.data?.login) {
      const { token: newToken, refreshToken: newRefreshToken, user: newUser } = result.data.login
      setToken(newToken)
      setUser(newUser)
      setAuthToken(newToken)
      setRefreshToken(newRefreshToken)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    removeAllAuthTokens()
  }, [])

  const isAuthenticated = !!token && !!user

  /**
   * Check if current user has a specific permission
   */
  const can = useCallback((permission: Permission): boolean => {
    if (!user) return false
    return serverHasPermission(user.role as 'ADMIN' | 'STAFF', permission)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, isLoading, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
