import { test, expect } from '@playwright/test';

/**
 * Open the signup modal on the landing page and navigate to the registration form (step 2).
 * The modal opens via /?signup=true and shows intent selection first.
 */
async function openSignupModal(page: import('@playwright/test').Page) {
  await page.goto('/?signup=true');
  // Wait for the modal to appear
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
}

/** Click an intent card to advance to the registration form */
async function goToStep2(page: import('@playwright/test').Page) {
  await openSignupModal(page);
  await page.getByText('Business Owner').click();
  // Auto-advance fires after 380ms — wait for the form to appear
  await expect(page.getByPlaceholder('John Smith')).toBeVisible({ timeout: 5000 });
}

test.describe('Signup Flow', () => {
  test('signup modal opens with heading and intent selection', async ({ page }) => {
    await openSignupModal(page);
    await expect(page.getByRole('heading', { name: 'Get Started Free' })).toBeVisible();
    await expect(page.getByText('What best describes you?')).toBeVisible();
  });

  test('renders intent selection cards', async ({ page }) => {
    await openSignupModal(page);
    await expect(page.getByText('Accountant / Advisor')).toBeVisible();
    await expect(page.getByText('Business Owner')).toBeVisible();
    await expect(page.getByText('ACSP Provider')).toBeVisible();
    await expect(page.getByText('Company Secretary')).toBeVisible();
  });

  test('intent selection advances to form step', async ({ page }) => {
    await openSignupModal(page);
    await page.getByText('Business Owner').click();
    // Auto-advance after card click
    await expect(page.getByPlaceholder('John Smith')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Signing up as: Business Owner')).toBeVisible();
  });

  test('renders all form fields with correct placeholders', async ({ page }) => {
    await goToStep2(page);
    await expect(page.getByPlaceholder('John Smith')).toBeVisible();
    await expect(page.getByPlaceholder('john@company.co.uk')).toBeVisible();
    await expect(page.getByPlaceholder('Acme Ltd')).toBeVisible();
    await expect(page.getByPlaceholder('Minimum 8 characters')).toBeVisible();
  });

  test('renders form labels', async ({ page }) => {
    await goToStep2(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Full Name').first()).toBeVisible();
    await expect(dialog.getByText('Email').first()).toBeVisible();
    await expect(dialog.getByText('Company').first()).toBeVisible();
    await expect(dialog.getByText('Password').first()).toBeVisible();
  });

  test('renders Create Account button', async ({ page }) => {
    await goToStep2(page);
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('shows password strength indicator as user types', async ({ page }) => {
    await goToStep2(page);
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
    await goToStep2(page);
    const passwordInput = page.getByPlaceholder('Minimum 8 characters');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await passwordInput.fill('testpass123');
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
    await goToStep2(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('By creating an account, you agree to our')).toBeVisible();
    const termsLink = dialog.getByRole('link', { name: 'Terms' }).first();
    const privacyLink = dialog.getByRole('link', { name: 'Privacy Policy' });
    await expect(termsLink).toBeVisible();
    await expect(privacyLink).toBeVisible();
  });

  test('Terms link navigates to /terms', async ({ page }) => {
    await goToStep2(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('link', { name: 'Terms' }).first().click();
    await expect(page).toHaveURL('/terms');
  });

  test('shows Sign In link for existing users', async ({ page }) => {
    await openSignupModal(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Already have an account?')).toBeVisible();
    const signInLink = dialog.getByRole('link', { name: 'Sign in', exact: true });
    await expect(signInLink).toBeVisible();
  });

  test('Sign In link navigates to /login', async ({ page }) => {
    await openSignupModal(page);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('link', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL('/login');
  });

  test('form fields are fillable', async ({ page }) => {
    await goToStep2(page);
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
    await goToStep2(page);
    await page.getByPlaceholder('John Smith').fill('Test User');
    await page.getByPlaceholder('john@company.co.uk').fill('test@example.com');
    await page.getByPlaceholder('Minimum 8 characters').fill('short');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should show toast about password length
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible({ timeout: 5000 });
  });

  test('company required for accountant intent', async ({ page }) => {
    await openSignupModal(page);
    await page.getByText('Accountant / Advisor').click();
    // Wait for auto-advance to form
    await expect(page.getByPlaceholder('John Smith')).toBeVisible({ timeout: 5000 });
    // Company field should show required indicator
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Company').first()).toBeVisible();
    await expect(dialog.locator('.text-red-400').first()).toBeVisible();
  });

  test('skip intent step goes directly to form', async ({ page }) => {
    await openSignupModal(page);
    await page.getByText('Skip this step').click();
    await expect(page.getByPlaceholder('John Smith')).toBeVisible({ timeout: 5000 });
    // Company should show as optional when no intent selected
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('(optional)')).toBeVisible();
  });

  test('/signup redirects to landing page with signup modal', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForURL('/?signup=true', { timeout: 5000 });
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  });
});
