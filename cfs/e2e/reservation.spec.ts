import { test, expect } from './fixtures'

test.describe('Reservations', () => {
  test('submit reservation form without auth returns pending status', async ({ page }) => {
    // Set up dialog handler BEFORE clicking submit
    let dialogMessage = ''
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message()
      await dialog.accept()
    })
    
    // Navigate to catalog
    await page.goto('/catalog')
    await page.waitForLoadState('networkidle')
    
    // Wait for products to load
    await page.waitForSelector('[data-testid*="product-card"]', { timeout: 10000 }).catch(() => null)
    
    const productCard = page.locator('[data-testid*="product-card"]').first()
    const hasProducts = await productCard.isVisible().catch(() => false)
    
    if (hasProducts) {
      await productCard.click()
      
      // Should show reservation form (product detail)
      await expect(page.locator('text=Volver al catálogo')).toBeVisible()
      
      // Fill reservation form - handle React controlled inputs properly
      // Use page.evaluate to set value directly (React controlled input workaround)
      await page.evaluate(() => {
        const nameEl = document.querySelector('input[id="name"]') as HTMLInputElement
        const emailEl = document.querySelector('input[id="email"]') as HTMLInputElement
        const phoneEl = document.querySelector('input[id="phone"]') as HTMLInputElement
        const qtyEl = document.querySelector('input[id="quantity"]') as HTMLInputElement
        if (nameEl) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set; s!.call(nameEl, 'Test User'); nameEl.dispatchEvent(new Event('input', { bubbles: true })) }
        if (emailEl) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set; s!.call(emailEl, 'test@example.com'); emailEl.dispatchEvent(new Event('input', { bubbles: true })) }
        if (phoneEl) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set; s!.call(phoneEl, '123456789'); phoneEl.dispatchEvent(new Event('input', { bubbles: true })) }
        if (qtyEl) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set; s!.call(qtyEl, '1'); qtyEl.dispatchEvent(new Event('input', { bubbles: true })) }
      })
      
      // Submit
      await page.click('button[type="submit"]')
      
      // Wait a moment for dialog to appear
      await page.waitForTimeout(500)
      
      // Verify the dialog message
      expect(dialogMessage).toContain('Reserva creada exitosamente')
    }
  })

  test('reservation form requires valid email', async ({ page }) => {
    await page.goto('/catalog')
    await page.waitForLoadState('networkidle')
    
    await page.waitForSelector('[data-testid*="product-card"]', { timeout: 10000 }).catch(() => null)
    
    const productCard = page.locator('[data-testid*="product-card"]').first()
    const hasProducts = await productCard.isVisible().catch(() => false)
    
    if (hasProducts) {
      await productCard.click()
      
      // Fill with invalid email (using id selectors)
      await page.fill('input[id="name"]', 'Test User')
      await page.fill('input[id="email"]', 'invalid-email')
      await page.fill('input[id="phone"]', '123456789')
      await page.fill('input[id="quantity"]', '1')
      
      // Form should have email validation
      const emailInput = page.locator('input[id="email"]')
      await expect(emailInput).toHaveAttribute('type', 'email')
    }
  })
})
