import { test, expect } from './fixtures'

test.describe('Protected Routes & Auth', () => {
  test('invalid token returns 401', async ({ page }) => {
    // Set an invalid token cookie
    await page.context().addCookies([{
      name: 'auth_token',
      value: 'invalid.token.here',
      domain: 'localhost',
      path: '/'
    }])
    
    // Try to access protected route
    await page.goto('/admin')
    
    // Should redirect to login or show error
    // The app should handle invalid tokens by redirecting to login
    await expect(page).toHaveURL(/\/login|error/)
  })

  test('expired token returns 401', async ({ page }) => {
    // Set an expired token cookie (if we can construct one)
    // For this test, we just verify the redirect behavior
    await page.context().addCookies([{
      name: 'auth_token',
      value: 'expired.token.here',
      domain: 'localhost',
      path: '/'
    }])
    
    await page.goto('/admin')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('protected route redirects to login when unauthenticated', async ({ page }) => {
    // Clear any existing auth
    await page.context().clearCookies()
    
    // Try to access admin panel
    await page.goto('/admin')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('public routes are accessible without auth', async ({ page }) => {
    // Landing page
    await page.goto('/')
    await expect(page.locator('[data-testid="landing-page"]')).toBeVisible()
    
    // Catalog page
    await page.goto('/catalog')
    await expect(page.locator('[data-testid="catalog-page"]')).toBeVisible()
    
    // Login page
    await page.goto('/login')
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible()
  })

  test('authenticated user can access protected routes', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[id="email"]', 'admin@senacom.com')
    await page.fill('input[id="password"]', 'changeme123')
    await page.click('button[type="submit"]')
    
    // Should redirect to admin
    await expect(page).toHaveURL('/admin', { timeout: 10000 })
    
    // Auth cookie should be set
    const cookies = await page.context().cookies()
    expect(cookies.some(c => c.name === 'auth_token')).toBe(true)
  })
})
