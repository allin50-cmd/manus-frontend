import { test, expect } from '@playwright/test';

test.describe('Header Navigation', () => {
  test('renders logo and brand name', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header').getByText('FineGuard').first()).toBeVisible();
  });

  test('shows public nav links', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    for (const label of ['Home', 'About', 'Pricing', 'VaultLine', 'UltAi', 'Contact']) {
      await expect(header.getByRole('link', { name: label }).first()).toBeVisible();
    }
  });

  test('shows Sign In and Get Started when logged out', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header.getByRole('link', { name: 'Sign In' }).first()).toBeVisible();
    await expect(header.getByRole('link', { name: 'Get Started' }).first()).toBeVisible();
  });

  test('navigates to About page', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'About' }).first().click();
    await expect(page).toHaveURL('/about');
    await expect(page.getByText('Compliance protection')).toBeVisible();
  });

  test('navigates to Pricing page', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'Pricing' }).first().click();
    await expect(page).toHaveURL('/pricing');
    await expect(page.getByText('Protect your companies')).toBeVisible();
  });

  test('navigates to Contact page', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'Contact' }).first().click();
    await expect(page).toHaveURL('/contact');
    await expect(page.getByText("We'd love to")).toBeVisible();
  });

  test('Sign In link goes to /login', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'Sign In' }).first().click();
    await expect(page).toHaveURL('/login');
  });

  test('Get Started link goes to /signup', async ({ page }) => {
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: 'Get Started' }).first().click();
    await expect(page).toHaveURL('/signup');
  });
});

test.describe('Footer', () => {
  test('renders brand and description', async ({ page }) => {
    await page.goto('/about');
    const footer = page.locator('footer');
    await expect(footer.getByText('FineGuard').first()).toBeVisible();
    await expect(footer.getByText('Enterprise compliance monitoring')).toBeVisible();
  });

  test('renders product links', async ({ page }) => {
    await page.goto('/about');
    const footer = page.locator('footer');
    for (const link of ['VaultLine Cloud', 'UltAi Intake', 'Pricing']) {
      await expect(footer.getByRole('link', { name: link })).toBeVisible();
    }
  });

  test('renders company links', async ({ page }) => {
    await page.goto('/about');
    const footer = page.locator('footer');
    for (const link of ['About Us', 'Our Team', 'Contact', 'Book a Demo']) {
      await expect(footer.getByRole('link', { name: link })).toBeVisible();
    }
  });

  test('renders legal links', async ({ page }) => {
    await page.goto('/about');
    const footer = page.locator('footer');
    for (const link of ['Privacy Policy', 'Terms of Service', 'Help Center']) {
      await expect(footer.getByRole('link', { name: link })).toBeVisible();
    }
  });

  test('shows copyright text', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('footer').getByText(/© \d{4} FineGuard Ltd/)).toBeVisible();
  });

  test('footer Privacy Policy link navigates correctly', async ({ page }) => {
    await page.goto('/about');
    await page.locator('footer').getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page).toHaveURL('/privacy');
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  });

  test('footer Terms of Service link navigates correctly', async ({ page }) => {
    await page.goto('/about');
    await page.locator('footer').getByRole('link', { name: 'Terms of Service' }).click();
    await expect(page).toHaveURL('/terms');
    await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('shows hamburger menu on mobile', async ({ page }) => {
    await page.goto('/');
    // The mobile menu button should be visible
    await expect(page.locator('header button').first()).toBeVisible();
  });

  test('opens mobile menu and shows nav links', async ({ page }) => {
    await page.goto('/');
    // Click the hamburger/menu button in the header
    await page.locator('header button').first().click();
    await page.waitForTimeout(500);
    // After opening, the mobile menu should show navigation links
    // Use locator scoped to header's mobile menu area
    const mobileLinks = page.locator('header a');
    await expect(mobileLinks.first()).toBeVisible();
    const count = await mobileLinks.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
