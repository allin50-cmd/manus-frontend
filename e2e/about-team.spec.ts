import { test, expect } from '@playwright/test';

test.describe('About Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
  });

  test('renders hero section', async ({ page }) => {
    await expect(page.getByText('About FineGuard')).toBeVisible();
    await expect(page.getByText('Compliance protection')).toBeVisible();
    await expect(page.getByText('built for the UK')).toBeVisible();
  });

  test('renders stats bar', async ({ page }) => {
    await expect(page.getByText('10,000+')).toBeVisible();
    await expect(page.getByText('99.9%')).toBeVisible();
    await expect(page.getByText(/2min/)).toBeVisible();
    await expect(page.getByText('500+').first()).toBeVisible();

    await expect(page.getByText(/Companies Monitored/i).first()).toBeVisible();
    await expect(page.getByText(/Uptime SLA/i)).toBeVisible();
    await expect(page.getByText(/Alert Response Time/i)).toBeVisible();
    await expect(page.getByText(/Partner Firms/i).first()).toBeVisible();
  });

  test('renders Our Story section', async ({ page }) => {
    await expect(page.getByText('Our Story')).toBeVisible();
    await expect(page.getByText('FineGuard was born inside a London accountancy')).toBeVisible();
  });

  test('renders timeline / Our Journey section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Our Journey' })).toBeVisible();
    await expect(page.getByText('Founded').first()).toBeVisible();
    await expect(page.getByText('Launch').first()).toBeVisible();
    await expect(page.getByText('VaultLine Suite').first()).toBeVisible();
  });

  test('renders values section', async ({ page }) => {
    await expect(page.getByText('Our Values')).toBeVisible();
    await expect(page.getByText('Precision').first()).toBeVisible();
    await expect(page.getByText('Transparency').first()).toBeVisible();
    await expect(page.getByText('Trust').first()).toBeVisible();
    await expect(page.getByText('Compliance-First')).toBeVisible();
  });

  test('renders CTA section with links', async ({ page }) => {
    await expect(page.getByText('Ready to protect your companies?')).toBeVisible();
    // Use first() since footer may also have similar links
    const getStartedLink = page.getByRole('link', { name: /Get Started Free/ }).first();
    await expect(getStartedLink).toBeVisible();
    const bookDemoLink = page.getByRole('link', { name: /Book a Demo/ }).first();
    await expect(bookDemoLink).toBeVisible();
  });

  test('Get Started Free links to /signup', async ({ page }) => {
    const link = page.getByRole('link', { name: /Get Started Free/ });
    await expect(link).toHaveAttribute('href', '/signup');
  });
});

test.describe('Team Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/team');
  });

  test('renders hero section', async ({ page }) => {
    await expect(page.getByText('Our Team').first()).toBeVisible();
    await expect(page.getByText('The people behind')).toBeVisible();
  });

  test('renders leadership section', async ({ page }) => {
    await expect(page.getByText('Leadership')).toBeVisible();
    await expect(page.getByText('James Whitfield')).toBeVisible();
    await expect(page.getByText('Sarah Chen')).toBeVisible();
    await expect(page.getByText('Michael Okonkwo')).toBeVisible();
    await expect(page.getByText('Emma Richardson')).toBeVisible();
  });

  test('renders leadership roles', async ({ page }) => {
    await expect(page.getByText('CEO & Co-Founder')).toBeVisible();
    await expect(page.getByText('CTO & Co-Founder')).toBeVisible();
    await expect(page.getByText('Head of Product')).toBeVisible();
    await expect(page.getByText('Head of Partnerships')).toBeVisible();
  });

  test('renders engineering & operations section', async ({ page }) => {
    await expect(page.getByText('Engineering & Operations')).toBeVisible();
    await expect(page.getByText('David Park')).toBeVisible();
    await expect(page.getByText('Priya Sharma')).toBeVisible();
    await expect(page.getByText('Tom Blackwell')).toBeVisible();
    await expect(page.getByText('Aisha Fatima')).toBeVisible();
    await expect(page.getByText('Robert Liu')).toBeVisible();
    await expect(page.getByText('Hannah Moore')).toBeVisible();
  });

  test('renders Join Our Team section', async ({ page }) => {
    await expect(page.getByText('Join Our Team')).toBeVisible();
    await expect(page.getByText('Remote-First')).toBeVisible();
    await expect(page.getByText('Equity Options')).toBeVisible();
    await expect(page.getByText('30 Days Holiday')).toBeVisible();
    await expect(page.getByText('Learning Budget')).toBeVisible();
    await expect(page.getByText('Flexible Hours')).toBeVisible();
  });

  test('View Open Positions links to /contact', async ({ page }) => {
    const link = page.getByRole('link', { name: /View Open Positions/ });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/contact');
  });
});
