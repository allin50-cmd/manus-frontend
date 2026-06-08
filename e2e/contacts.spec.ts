import { test, expect } from '@playwright/test'

const PASSCODE = 'demo1234'

test.describe('Contacts', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/login')
    await page.getByRole('button', { name: 'George' }).click()
    await page.getByPlaceholder('Enter passcode').fill(PASSCODE)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/dashboard')
    await page.goto('/contacts')
    await expect(page.getByRole('heading', { name: 'Contacts' })).toBeVisible()
  })

  test('shows contacts page with Add Contact button and search', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Add Contact' })).toBeVisible()
    await expect(page.getByPlaceholder(/search/i)).toBeVisible()
  })

  test('can add a new contact', async ({ page }) => {
    // Need a company first — skip if no companies exist
    await page.getByRole('button', { name: 'Add Contact' }).click()
    await expect(page.getByText('New Contact')).toBeVisible()

    const companySelect = page.locator('select').first()
    const options = await companySelect.locator('option').count()
    if (options <= 1) {
      // No companies seeded — just verify form opens and closes
      await page.getByRole('button', { name: 'Cancel' }).click()
      await expect(page.getByText('New Contact')).not.toBeVisible()
      return
    }

    await page.locator('input').first().fill('Test Contact E2E')
    await companySelect.selectOption({ index: 1 })
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Test Contact E2E')).toBeVisible()
  })

  test('search filters the contact list', async ({ page }) => {
    await page.getByPlaceholder(/search/i).fill('zzz_no_match_xyz')
    await expect(page.getByText('No contacts')).toBeVisible()
    await page.getByPlaceholder(/search/i).clear()
  })

  test('add form validates empty name', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Contact' }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Name is required')).toBeVisible()
  })
})
