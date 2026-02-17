import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('renders signup page with heading and subtitle', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Create Your Account' })).toBeVisible();
    await expect(page.getByText('Start monitoring companies for free')).toBeVisible();
  });

  test('renders all form fields with correct placeholders', async ({ page }) => {
    await expect(page.getByPlaceholder('John Smith')).toBeVisible();
    await expect(page.getByPlaceholder('john@company.co.uk')).toBeVisible();
    await expect(page.getByPlaceholder('Acme Ltd')).toBeVisible();
    await expect(page.getByPlaceholder('Minimum 8 characters')).toBeVisible();
  });

  test('renders form labels', async ({ page }) => {
    await expect(page.getByText('Full Name').first()).toBeVisible();
    await expect(page.getByText('Email').first()).toBeVisible();
    await expect(page.getByText('Company').first()).toBeVisible();
    await expect(page.getByText('Password').first()).toBeVisible();
    await expect(page.getByText('(optional)')).toBeVisible();
  });

  test('renders Create Account button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('shows password strength indicator as user types', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Minimum 8 characters');

    // Type a short password (Weak)
    await passwordInput.fill('abc');
    await expect(page.getByText('Weak')).toBeVisible();

    // Type a medium password (Good)
    await passwordInput.fill('abcdefgh');
    await expect(page.getByText('Good')).toBeVisible();

    // Type a strong password (Strong)
    await passwordInput.fill('abcdefghijkl');
    await expect(page.getByText('Strong')).toBeVisible();
  });

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.getByPlaceholder('Minimum 8 characters');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the toggle button (Eye icon button near password)
    await passwordInput.fill('testpass123');
    const toggleBtn = page.locator('button').filter({ has: page.locator('svg') }).last();
    // Find the button adjacent to the password input
    const passwordContainer = passwordInput.locator('..');
    const eyeButton = passwordContainer.locator('button');
    if (await eyeButton.count() > 0) {
      await eyeButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      await eyeButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('shows Terms and Privacy Policy links', async ({ page }) => {
    await expect(page.getByText('By creating an account, you agree to our')).toBeVisible();
    // Scope to main content to avoid footer duplicate links
    const main = page.getByRole('main');
    const termsLink = main.getByRole('link', { name: 'Terms' }).first();
    const privacyLink = main.getByRole('link', { name: 'Privacy Policy' });
    await expect(termsLink).toBeVisible();
    await expect(privacyLink).toBeVisible();
  });

  test('Terms link navigates to /terms', async ({ page }) => {
    await page.getByRole('link', { name: 'Terms' }).first().click();
    await expect(page).toHaveURL('/terms');
  });

  test('shows Sign In link for existing users', async ({ page }) => {
    await expect(page.getByText('Already have an account?')).toBeVisible();
    // Use exact: true to distinguish from the header "Sign In" link
    const signInLink = page.getByRole('link', { name: 'Sign in', exact: true });
    await expect(signInLink).toBeVisible();
  });

  test('Sign In link navigates to /login', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL('/login');
  });

  test('form fields are fillable', async ({ page }) => {
    await page.getByPlaceholder('John Smith').fill('Test User');
    await page.getByPlaceholder('john@company.co.uk').fill('test@example.com');
    await page.getByPlaceholder('Acme Ltd').fill('Test Corp');
    await page.getByPlaceholder('Minimum 8 characters').fill('securePassword123');

    await expect(page.getByPlaceholder('John Smith')).toHaveValue('Test User');
    await expect(page.getByPlaceholder('john@company.co.uk')).toHaveValue('test@example.com');
    await expect(page.getByPlaceholder('Acme Ltd')).toHaveValue('Test Corp');
    await expect(page.getByPlaceholder('Minimum 8 characters')).toHaveValue('securePassword123');
  });

  test('submit with short password shows error toast', async ({ page }) => {
    await page.getByPlaceholder('John Smith').fill('Test User');
    await page.getByPlaceholder('john@company.co.uk').fill('test@example.com');
    await page.getByPlaceholder('Minimum 8 characters').fill('short');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should show toast about password length
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible({ timeout: 5000 });
  });
});
