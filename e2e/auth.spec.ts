import { test, expect } from '@playwright/test'

const PERSON = 'George'
const PASSCODE = 'demo1234'
const WRONG_PASSCODE = 'notthepassword'

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/login')
  })

  test('shows login page with person picker and passcode field', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'UltraCore SheetOps' })).toBeVisible()
    await expect(page.getByRole('button', { name: PERSON })).toBeVisible()
    await expect(page.getByPlaceholder('Enter passcode')).toBeVisible()
  })

  test('rejects wrong passcode', async ({ page }) => {
    await page.getByRole('button', { name: PERSON }).click()
    await page.getByPlaceholder('Enter passcode').fill(WRONG_PASSCODE)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page.getByText('Incorrect passcode')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('logs in with correct passcode and lands on dashboard', async ({ page }) => {
    await page.getByRole('button', { name: PERSON }).click()
    await page.getByPlaceholder('Enter passcode').fill(PASSCODE)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/dashboard')
    // person name appears as nav link to settings
    await expect(page.getByRole('link', { name: PERSON })).toBeVisible()
  })

  test('redirects already-authenticated user away from /login', async ({ page }) => {
    await page.getByRole('button', { name: PERSON }).click()
    await page.getByPlaceholder('Enter passcode').fill(PASSCODE)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/dashboard')

    await page.goto('/login')
    await expect(page).toHaveURL('/dashboard')
  })

  test('redirects unauthenticated user to /login from protected route', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Logout', () => {
  test('logs out and returns to login page', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/login')
    await page.getByRole('button', { name: PERSON }).click()
    await page.getByPlaceholder('Enter passcode').fill(PASSCODE)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('/dashboard')

    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL('/login')

    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })
})
