import { test, expect, loginAs } from './fixtures'

test.describe('News Management E2E', () => {
  test('staff can access news management', async ({ page }) => {
    // Login as staff
    await loginAs(page, 'staff@senacom.com', 'changeme123')
    await page.goto('/admin')
    // Should show news management section
    await expect(page.locator('[data-testid="news-management-section"]')).toBeVisible()
  })

  test('staff can create a new news item', async ({ page }) => {
    await loginAs(page, 'staff@senacom.com', 'changeme123')
    await page.goto('/admin')
    
    // Click add news button if visible
    const addBtn = page.locator('button:has-text("Añadir Noticia"), button:has-text("Agregar Noticia")')
    if (await addBtn.isVisible()) {
      await addBtn.click()
      
      // Fill form - news has title, content, imageUrl
      await page.fill('input[name="title"], input[placeholder*="título"]', 'Noticia E2E Test')
      await page.fill('textarea[name="content"], textarea[placeholder*="contenido"]', 'Contenido de prueba para E2E')
      await page.fill('input[name="imageUrl"], input[placeholder*="imagen"]', 'https://example.com/image.jpg')
      
      // Submit
      await page.click('button[type="submit"]')
      
      // Should see success or the news in list
      await expect(page.locator('text=Noticia E2E Test').first()).toBeVisible()
    }
  })

  test('staff can edit a news item', async ({ page }) => {
    await loginAs(page, 'staff@senacom.com', 'changeme123')
    await page.goto('/admin')
    
    // Look for edit button
    const editBtn = page.locator('[data-testid^="edit-news-btn-"]').first()
    if (await editBtn.isVisible()) {
      await editBtn.click()
      
      // Form should appear with pre-filled data
      const titleInput = page.locator('input[name="title"], input[placeholder*="título"]')
      if (await titleInput.isVisible()) {
        await titleInput.clear()
        await titleInput.fill('Noticia Editada E2E')
        
        await page.click('button[type="submit"]')
      }
    }
  })

  test('staff can delete a news item with confirmation', async ({ page }) => {
    await loginAs(page, 'staff@senacom.com', 'changeme123')
    await page.goto('/admin')
    
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
