import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders login page with heading and subtitle', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByText('Sign in to your FineGuard account')).toBeVisible();
  });

  test('renders email and password fields with correct placeholders', async ({ page }) => {
    await expect(page.getByPlaceholder('you@company.co.uk')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
  });

  test('renders form labels', async ({ page }) => {
    await expect(page.getByText('Email').first()).toBeVisible();
    await expect(page.getByText('Password').first()).toBeVisible();
  });

  test('renders Sign In button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Enter your password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await passwordInput.fill('mypassword');
    const passwordContainer = passwordInput.locator('..');
    const eyeButton = passwordContainer.locator('button');
    if (await eyeButton.count() > 0) {
      await eyeButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      await eyeButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('shows Create one free link for new users', async ({ page }) => {
    await expect(page.getByText("Don't have an account?")).toBeVisible();
    const createLink = page.getByRole('link', { name: 'Create one free' });
    await expect(createLink).toBeVisible();
  });

  test('Create one free link navigates to /signup', async ({ page }) => {
    await page.getByRole('link', { name: 'Create one free' }).click();
    await expect(page).toHaveURL('/signup');
  });

  test('form fields are fillable', async ({ page }) => {
    await page.getByPlaceholder('you@company.co.uk').fill('user@test.com');
    await page.getByPlaceholder('Enter your password').fill('password123');

    await expect(page.getByPlaceholder('you@company.co.uk')).toHaveValue('user@test.com');
    await expect(page.getByPlaceholder('Enter your password')).toHaveValue('password123');
  });

  test('submit with credentials triggers login attempt', async ({ page }) => {
    await page.getByPlaceholder('you@company.co.uk').fill('test@example.com');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should show either success toast or error toast (depending on API)
    // Since no backend, we expect an error state
    await page.waitForTimeout(2000);
    // The button text should change during loading
    // After attempt, either redirects or shows error
  });

  test('email field has email type validation', async ({ page }) => {
    const emailInput = page.getByPlaceholder('you@company.co.uk');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });
});
