import { test, expect } from './fixtures'

test.describe('Login Flow', () => {
  test('successful login stores JWT in cookie and redirects to admin', async ({ page }) => {
    await page.goto('/login')
    
    // Fill login form
    await page.fill('input[id="email"]', 'admin@senacom.com')
    await page.fill('input[id="password"]', 'changeme123')
    await page.click('button[type="submit"]')
    
    // Should redirect to /admin
    await expect(page).toHaveURL('/admin', { timeout: 10000 })
    
    // Auth cookie should be set
    const cookies = await page.context().cookies()
    expect(cookies.some(c => c.name === 'auth_token')).toBe(true)
  })

  test('failed login shows error message', async ({ page }) => {
    await page.goto('/login')
    
    // Fill with wrong credentials
    await page.fill('input[id="email"]', 'wrong@example.com')
    await page.fill('input[id="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Credenciales inválidas')).toBeVisible({ timeout: 5000 })
    
    // Should stay on login page
    await expect(page).toHaveURL('/login')
  })

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible()
    await expect(page.locator('h2:has-text("Iniciar Sesión")')).toBeVisible()
  })
})
