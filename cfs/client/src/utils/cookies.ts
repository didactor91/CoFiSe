const AUTH_TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof document === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  if (typeof document === 'undefined') return
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function setRefreshToken(token: string): void {
  if (typeof document === 'undefined') return
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function removeAuthToken(): void {
  if (typeof document === 'undefined') return
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function removeRefreshToken(): void {
  if (typeof document === 'undefined') return
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function removeAllAuthTokens(): void {
  removeAuthToken()
  removeRefreshToken()
}