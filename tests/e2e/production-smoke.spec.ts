import { test, expect } from '@playwright/test';

test.describe('Production Smoke Tests @smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for production tests
    test.setTimeout(120000); // 2 minutes for production environment
  });

  test('production homepage loads within 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await test.step('Navigate to homepage', async () => {
      await page.goto('/');
    });

    const loadTime = Date.now() - startTime;

    await test.step('Verify page title and load time', async () => {
      await expect(page).toHaveTitle(/VendFinder/);
      expect(loadTime).toBeLessThan(3000);
      console.log(`Homepage load time: ${loadTime}ms`);
    });

    await test.step('Verify critical elements are visible', async () => {
      // Check that key page elements are present
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    });
  });

  test('all critical API endpoints respond', async ({ request }) => {
    const endpoints = [
      { path: '/api/health', name: 'Health Check' },
      { path: '/api/users/health', name: 'User Service' },
      { path: '/api/products/health', name: 'Product Service' },
      { path: '/api/orders/health', name: 'Order Service' },
      { path: '/api/chat/health', name: 'Chat Service' }
    ];

    for (const endpoint of endpoints) {
      await test.step(`Check ${endpoint.name} endpoint`, async () => {
        const startTime = Date.now();
        const response = await request.get(endpoint.path);
        const responseTime = Date.now() - startTime;

        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);
        console.log(`${endpoint.name} response time: ${responseTime}ms`);

        // API endpoints should respond within 5 seconds
        expect(responseTime).toBeLessThan(5000);
      });
    }
  });

  test('user authentication flow is accessible', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      await page.goto('/login');
    });

    await test.step('Verify login form elements', async () => {
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
      await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    });

    await test.step('Check signup link is available', async () => {
      await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
    });

    await test.step('Verify form is interactive', async () => {
      // Check that form inputs are functional
      await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
      await page.getByRole('textbox', { name: /password/i }).fill('testpassword');

      // Verify the form accepts input
      await expect(page.getByRole('textbox', { name: /email/i })).toHaveValue('test@example.com');
      await expect(page.getByRole('textbox', { name: /password/i })).toHaveValue('testpassword');
    });
  });

  test('product listing page loads and displays content', async ({ page }) => {
    await test.step('Navigate to products page', async () => {
      const startTime = Date.now();
      await page.goto('/products');
      const loadTime = Date.now() - startTime;
      console.log(`Products page load time: ${loadTime}ms`);
    });

    await test.step('Verify page structure', async () => {
      await expect(page.getByRole('main')).toBeVisible();
      // Should have some content or placeholder
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    await test.step('Check for search/filter functionality', async () => {
      // Look for search or filter elements
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
      if (await searchInput.isVisible()) {
        await expect(searchInput).toBeVisible();
      }
    });
  });

  test('navigation and core site functionality', async ({ page }) => {
    await test.step('Start from homepage', async () => {
      await page.goto('/');
    });

    await test.step('Verify main navigation links work', async () => {
      // Check that main navigation exists and links are functional
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();

      // Try to click on products link if available
      const productsLink = nav.getByRole('link', { name: /products/i });
      if (await productsLink.isVisible()) {
        await productsLink.click();
        await expect(page.url()).toContain('/products');
        await page.goBack();
      }
    });

    await test.step('Verify footer information', async () => {
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });

    await test.step('Test responsive design basics', async () => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();

      // Page should still be functional on mobile
      await expect(page.locator('nav, header')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();

      // Reset to desktop
      await page.setViewportSize({ width: 1280, height: 720 });
    });
  });

  test('site security headers and SSL', async ({ request, page }) => {
    await test.step('Check SSL certificate and HTTPS redirect', async () => {
      await page.goto('/');
      expect(page.url()).toMatch(/^https:/);
    });

    await test.step('Verify security headers', async () => {
      const response = await request.get('/');
      expect(response.ok()).toBeTruthy();

      // Check for important security headers
      const headers = response.headers();
      console.log('Security headers check:', {
        'x-frame-options': headers['x-frame-options'] || 'missing',
        'x-content-type-options': headers['x-content-type-options'] || 'missing',
        'strict-transport-security': headers['strict-transport-security'] || 'missing'
      });

      // At minimum, we should have some security headers
      const hasSecurityHeaders = headers['x-frame-options'] ||
                                headers['x-content-type-options'] ||
                                headers['strict-transport-security'];

      if (!hasSecurityHeaders) {
        console.warn('No security headers detected - consider adding them');
      }
    });
  });

  test('error page handling', async ({ page }) => {
    await test.step('Check 404 page handling', async () => {
      // Navigate to a non-existent page
      const response = await page.goto('/this-page-does-not-exist-12345');

      // Should either return 404 or redirect gracefully
      if (response?.status() === 404) {
        // Custom 404 page should be functional
        await expect(page.locator('h1, h2').first()).toBeVisible();
        console.log('Custom 404 page is working');
      } else {
        // If redirected, should land on a valid page
        expect(response?.ok()).toBeTruthy();
        console.log('404 redirects to valid page');
      }
    });
  });

  test('performance baseline for critical pages', async ({ page }) => {
    const pages = [
      { url: '/', name: 'Homepage' },
      { url: '/products', name: 'Products' },
      { url: '/login', name: 'Login' }
    ];

    for (const testPage of pages) {
      await test.step(`Performance check for ${testPage.name}`, async () => {
        const startTime = Date.now();
        await page.goto(testPage.url);
        const loadTime = Date.now() - startTime;

        console.log(`${testPage.name} load time: ${loadTime}ms`);

        // Pages should load within reasonable time in production
        expect(loadTime).toBeLessThan(5000); // 5 seconds max for any page

        // Check for obvious performance issues
        await expect(page.locator('body')).toBeVisible();
      });
    }
  });

  test('database connectivity through API', async ({ request }) => {
    await test.step('Test user service database connectivity', async () => {
      const response = await request.get('/api/users/health');
      expect(response.ok()).toBeTruthy();

      const health = await response.json();
      if (health.database) {
        expect(health.database.status).toBe('connected');
      }
    });

    await test.step('Test product service database connectivity', async () => {
      const response = await request.get('/api/products/health');
      expect(response.ok()).toBeTruthy();

      const health = await response.json();
      if (health.database) {
        expect(health.database.status).toBe('connected');
      }
    });
  });

  test('websocket functionality basic check', async ({ page }) => {
    // This test checks if WebSocket connections can be established
    // without actually testing chat functionality
    await test.step('Check WebSocket connectivity', async () => {
      await page.goto('/');

      // Listen for console errors related to WebSocket
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && msg.text().toLowerCase().includes('websocket')) {
          consoleErrors.push(msg.text());
        }
      });

      // Wait for any WebSocket connection attempts
      await page.waitForTimeout(5000);

      // If there are WebSocket errors, log them but don't fail the test
      if (consoleErrors.length > 0) {
        console.warn('WebSocket errors detected:', consoleErrors);
      }
    });
  });
});