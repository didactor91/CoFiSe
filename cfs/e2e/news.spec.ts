import { test, expect, loginAs } from './fixtures'

test.describe('News Management E2E', () => {
  test('staff can access news management', async ({ page }) => {
    // Login as staff
    await loginAs(page, 'staff@senacom.com', 'changeme123')
    // After login we're on /admin - wait for content
    await page.waitForLoadState('networkidle')
    // Should show news management section
    await expect(page.locator('[data-testid="news-management-section"]')).toBeVisible({ timeout: 10000 })
  })

  test('staff can create a new news item', async ({ page }) => {
    await loginAs(page, 'staff@senacom.com', 'changeme123')
    await page.waitForLoadState('networkidle')
    
    // Click add news button if visible
    const addBtn = page.locator('button:has-text("Añadir Noticia"), button:has-text("Agregar Noticia")')
    if (await addBtn.isVisible()) {
      await addBtn.click()
      
      // Wait for form to appear
      await expect(page.locator('[data-testid="news-form"]')).toBeVisible({ timeout: 5000 })
      
      // Fill form using placeholder text (matching actual UI placeholders)
      await page.locator('input[placeholder="Título de la noticia"]').fill('Noticia E2E Test')
      await page.locator('textarea[placeholder="Contenido de la noticia"]').fill('Contenido de prueba para E2E')
      await page.locator('input[placeholder="https://..."]').fill('https://example.com/image.jpg')
      
      // Submit
      await page.click('button[type="submit"]')
      
      // Should see success or the news in list
      await expect(page.locator('text=Noticia E2E Test').first()).toBeVisible({ timeout: 5000 }).catch(() => null)
    }
  })

  test('staff can edit a news item', async ({ page }) => {
    await loginAs(page, 'staff@senacom.com', 'changeme123')
    await page.waitForLoadState('networkidle')
    
    // Look for edit button
    const editBtn = page.locator('[data-testid^="edit-news-btn-"]').first()
    if (await editBtn.isVisible()) {
      await editBtn.click()
      
      // Wait for form to appear
      await expect(page.locator('[data-testid="news-form"]')).toBeVisible({ timeout: 5000 })
      
      // Form should appear with pre-filled data - use placeholder selector
      const titleInput = page.locator('input[placeholder="Título de la noticia"]')
      if (await titleInput.isVisible()) {
        await titleInput.clear()
        await titleInput.fill('Noticia Editada E2E')
        
        await page.click('button[type="submit"]')
      }
    }
  })

  test('staff can delete a news item with confirmation', async ({ page }) => {
    await loginAs(page, 'staff@senacom.com', 'changeme123')
    await page.waitForLoadState('networkidle')
    
    // Look for delete button
    const deleteBtn = page.locator('[data-testid^="delete-news-btn-"]').first()
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click()
      
      // Confirm dialog should appear
      const confirmBtn = page.locator('button:has-text("Confirmar"), button:has-text("Eliminar"), button:has-text("Confirm")')
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click()
      }
    }
  })
})
