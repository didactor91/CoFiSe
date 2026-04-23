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

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from cookies on mount
  useEffect(() => {
    const storedToken = getAuthToken()
    const storedRefreshToken = getRefreshToken()

    if (storedToken) {
      setToken(storedToken)
    }

    if (storedToken && storedRefreshToken) {
      // Both tokens exist - use refresh to get fresh tokens + user
      refreshAccessToken(storedRefreshToken)
    } else if (storedToken) {
      // Only access token - validate with me query
      validateTokenAndFetchUser(storedToken)
    } else if (storedRefreshToken) {
      // Only refresh token - use it to get everything
      refreshAccessToken(storedRefreshToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  const validateTokenAndFetchUser = async (token: string) => {
    try {
      const result = await graphqlClient.query(ME_QUERY, {}).toPromise()

      if (result.error || !result.data?.me) {
        // Token invalid - try refresh token if available
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

      // Token valid, user fetched
      setUser(result.data.me)
      setIsLoading(false)
    } catch (err) {
      // Network error or other failure - try refresh
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
        return
      }
      
      if (result.data?.refreshToken) {
        const { token: newToken, refreshToken: newRefreshToken, user: newUser } = result.data.refreshToken
        setToken(newToken)
        setUser(newUser)
        setAuthToken(newToken)
        setRefreshToken(newRefreshToken)
      }
    } catch (err) {
      removeAllAuthTokens()
      setUser(null)
      setToken(null)
    } finally {
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

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, isLoading }}>
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