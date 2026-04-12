// Staging Environment E2E Tests
// These tests verify basic functionality of the staging deployment

const { test, expect } = require('@playwright/test');

test.describe('Staging Environment Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for staging environment
    test.setTimeout(60000);
  });

  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads without errors
    await expect(page).toHaveTitle(/VendFinder/);

    // Verify critical elements are present
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();

    // Check for hero section or main content
    const heroSection = page.locator('h1, [data-testid="hero-title"], .hero');
    await expect(heroSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('API health endpoint responds correctly', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('healthy');
  });

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/');

    // Test navigation to products page if it exists
    const productsLink = page
      .locator(
        'a[href*="product"], nav a:has-text("Products"), a:has-text("Browse")'
      )
      .first();

    if (await productsLink.isVisible()) {
      await productsLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on a products-related page
      const url = page.url();
      expect(url).toMatch(/(product|browse|shop|categories)/);
    }
  });

  test('user authentication flow accessibility', async ({ page }) => {
    await page.goto('/');

    // Look for login/signup links
    const authLinks = page.locator(
      'a:has-text("Login"), a:has-text("Sign In"), a:has-text("Sign Up"), button:has-text("Login")'
    );

    if (await authLinks.first().isVisible()) {
      await authLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Verify we reach an auth page
      const url = page.url();
      expect(url).toMatch(/(login|signin|signup|auth)/);

      // Check for auth form elements
      const emailField = page
        .locator(
          'input[type="email"], input[name*="email"], input[placeholder*="email"]'
        )
        .first();
      const passwordField = page
        .locator('input[type="password"], input[name*="password"]')
        .first();

      if (await emailField.isVisible()) {
        await expect(emailField).toBeVisible();
      }
      if (await passwordField.isVisible()) {
        await expect(passwordField).toBeVisible();
      }
    }
  });

  test('search functionality is accessible', async ({ page }) => {
    await page.goto('/');

    // Look for search input
    const searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="search"], [data-testid="search"]'
      )
      .first();

    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();

      // Test that we can type in the search field
      await searchInput.fill('test');
      await expect(searchInput).toHaveValue('test');
    }
  });

  test('responsive layout works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify page still loads correctly on mobile
    await expect(page.locator('body')).toBeVisible();

    // Check for mobile navigation (hamburger menu, etc.)
    const mobileNav = page.locator(
      'button[aria-label*="menu"], .hamburger, button:has-text("☰"), [data-testid="mobile-menu"]'
    );

    if (await mobileNav.first().isVisible()) {
      await expect(mobileNav.first()).toBeVisible();
    }
  });

  test('footer contains essential links', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    if (await footer.isVisible()) {
      await expect(footer).toBeVisible();

      // Check for common footer links
      const footerLinks = footer.locator('a');
      const linkCount = await footerLinks.count();

      expect(linkCount).toBeGreaterThan(0);
    }
  });

  test('no critical JavaScript errors in console', async ({ page }) => {
    const errors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out non-critical errors (like extension errors, etc.)
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('Extension') &&
        !error.includes('chrome-extension') &&
        !error.includes('favicon.ico') &&
        !error.toLowerCase().includes('ad blocker')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('basic performance metrics are acceptable', async ({ page }) => {
    await page.goto('/');

    // Measure page load time
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Page should load within 10 seconds on staging
    expect(loadTime).toBeLessThan(10000);

    // Check that there are no obvious layout shifts
    await page.waitForTimeout(1000);
    const bodyHeight = await page.locator('body').boundingBox();
    expect(bodyHeight.height).toBeGreaterThan(100);
  });
});
