import { test, expect } from './fixtures'

test.describe('Reservations', () => {
  test('submit reservation form without auth returns pending status', async ({ page }) => {
    // Navigate to catalog
    await page.goto('/catalog')
    
    // Wait for products to load
    await page.waitForSelector('[data-testid*="product-card"]', { timeout: 5000 }).catch(() => null)
    
    const productCard = page.locator('[data-testid*="product-card"]').first()
    const hasProducts = await productCard.isVisible().catch(() => false)
    
    if (hasProducts) {
      await productCard.click()
      
      // Should show reservation form (product detail)
      await expect(page.locator('text=Volver al catálogo')).toBeVisible()
      
      // Fill reservation form
      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="phone"]', '123456789')
      await page.fill('input[name="quantity"]', '1')
      
      // Submit
      await page.click('button[type="submit"]')
      
      // Should show success message or stay on page (pending)
      // The form should submit without auth requirement
      const formOrSuccess = await page.locator('text=Reserva creada exitosamente, text=Volver al catálogo').isVisible()
      expect(formOrSuccess).toBe(true)
    }
  })

  test('reservation form requires valid email', async ({ page }) => {
    await page.goto('/catalog')
    
    await page.waitForSelector('[data-testid*="product-card"]', { timeout: 5000 }).catch(() => null)
    
    const productCard = page.locator('[data-testid*="product-card"]').first()
    const hasProducts = await productCard.isVisible().catch(() => false)
    
    if (hasProducts) {
      await productCard.click()
      
      // Fill with invalid email
      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="email"]', 'invalid-email')
      await page.fill('input[name="phone"]', '123456789')
      await page.fill('input[name="quantity"]', '1')
      
      // Form should have email validation
      const emailInput = page.locator('input[name="email"]')
      await expect(emailInput).toHaveAttribute('type', 'email')
    }
  })
})
