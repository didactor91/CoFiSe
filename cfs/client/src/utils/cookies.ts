const AUTH_COOKIE_NAME = 'auth_token'
const REFRESH_COOKIE_NAME = 'refresh_token'

export function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === AUTH_COOKIE_NAME) {
      return decodeURIComponent(value)
    }
  }
  return null
}

export function getRefreshToken(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === REFRESH_COOKIE_NAME) {
      return decodeURIComponent(value)
    }
  }
  return null
}

export function setAuthToken(token: string): void {
  if (typeof document === 'undefined') return
  const maxAge = 60 * 60 * 24 // 24 hours in seconds
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Strict`
}

export function setRefreshToken(token: string): void {
  if (typeof document === 'undefined') return
  const maxAge = 60 * 60 * 24 * 30 // 30 days in seconds
  document.cookie = `${REFRESH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Strict`
}

export function removeAuthToken(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`
}

export function removeRefreshToken(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${REFRESH_COOKIE_NAME}=; path=/; max-age=0`
}

export function removeAllAuthTokens(): void {
  removeAuthToken()
  removeRefreshToken()
}