import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react'
import type { ReactNode } from 'react'
import type { User } from '../graphql/generated-types'
import { graphqlClient } from '../graphql/client'
import { LOGIN_MUTATION, REFRESH_TOKEN_MUTATION } from '../graphql/mutations'
import { ME_QUERY } from '../graphql/queries'
import { setAuthToken, setRefreshToken, removeAllAuthTokens, getAuthToken, getRefreshToken } from '../utils/cookies'
import { hasPermission as serverHasPermission, type Permission } from '../auth/permissions'

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
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = getAuthToken()
    const storedRefreshToken = getRefreshToken()

    if (storedToken) {
      setToken(storedToken)
      if (storedRefreshToken) {
        refreshAccessToken(storedRefreshToken)
      } else {
        validateTokenAndFetchUser(storedToken)
      }
    } else if (storedRefreshToken) {
      refreshAccessToken(storedRefreshToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  const validateTokenAndFetchUser = async (token: string) => {
    try {
      const result = await graphqlClient.query(ME_QUERY, {}).toPromise()

      if (result.error || !result.data?.me) {
        const storedRefreshToken = getRefreshToken()
        if (storedRefreshToken) {
          refreshAccessToken(storedRefreshToken)
        } else {
          removeAllAuthTokens()
          setUser(null)
          setToken(null)
          setIsLoading(false)
        }
        return
      }

      setUser(result.data.me)
      setIsLoading(false)
    } catch (err) {
      const storedRefreshToken = getRefreshToken()
      if (storedRefreshToken) {
        refreshAccessToken(storedRefreshToken)
      } else {
        removeAllAuthTokens()
        setUser(null)
        setToken(null)
        setIsLoading(false)
      }
    }
  }

  const refreshAccessToken = async (refreshToken: string) => {
    try {
      const result = await graphqlClient.mutation(REFRESH_TOKEN_MUTATION, { refreshToken }).toPromise()
      
      if (result.error) {
        removeAllAuthTokens()
        setUser(null)
        setToken(null)
        setIsLoading(false)
        return
      }
      
      if (result.data?.refreshToken) {
        const { token: newToken, refreshToken: newRefreshToken, user: newUser } = result.data.refreshToken
        setToken(newToken)
        setUser(newUser)
        setAuthToken(newToken)
        setRefreshToken(newRefreshToken)
      } else {
        removeAllAuthTokens()
        setUser(null)
        setToken(null)
        setIsLoading(false)
      }
    } catch (err) {
      removeAllAuthTokens()
      setUser(null)
      setToken(null)
      setIsLoading(false)
    }
  }

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
