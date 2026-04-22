import {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react'
import type { ReactNode } from 'react'
import type { User } from '../../../packages/types/generated/graphql'
import { graphqlClient } from '../graphql/client'
import { LOGIN_MUTATION } from '../graphql/mutations'
import { setAuthToken, removeAuthToken } from '../utils/cookies'

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string) => {
    const result = await graphqlClient.mutation(LOGIN_MUTATION, { email, password }).toPromise()
    
    if (result.error) {
      throw new Error(result.error.message)
    }
    
    if (result.data?.login) {
      const { token: newToken, user: newUser } = result.data.login
      setToken(newToken)
      setUser(newUser)
      setAuthToken(newToken)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    removeAuthToken()
  }, [])

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
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