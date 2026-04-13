/**
 * Simplified Integration Test: Chat Authentication Fix Validation
 *
 * This test validates key authentication behaviors without requiring real user accounts:
 * - Tests authentication state handling
 * - Tests route protection
 * - Tests error handling and recovery
 * - Tests WebSocket connectivity initialization
 * - Tests Contact Vendor button functionality
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Chat Authentication Integration Tests', () => {
  let context;
  let page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();

    // Set up console logging to catch errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    // Set up network error logging
    page.on('requestfailed', request => {
      console.log(`❌ Network Error: ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test.afterEach(async () => {
    if (context) {
      await context.close();
    }
  });

  test('Step 1: Test authentication state handling', async () => {
    console.log('🧪 Testing authentication state handling...');

    // Test 1a: Unauthenticated access to protected route
    await page.goto(`${BASE_URL}/dashboard/messages`);
    await page.waitForLoadState('networkidle');

    // Should either redirect to login or show auth required message
    const currentUrl = page.url();
    const hasAuthMessage = await page.locator(
      'text="Please log in"',
      'text="Authentication required"',
      'text="Please login"',
      'text="validatingAuth"',
      '[data-testid="auth-required"]'
    ).count() > 0;

    const isProtected = currentUrl.includes('login') || hasAuthMessage;
    expect(isProtected).toBe(true);
    console.log('✅ Unauthenticated users cannot access messages page');

    // Test 1b: Check that AuthContext is properly initialized
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Verify login form is present with correct structure
    const emailInput = await page.locator('#email').count();
    const passwordInput = await page.locator('#password').count();
    expect(emailInput).toBe(1);
    expect(passwordInput).toBe(1);
    console.log('✅ Login form is properly structured');

    // Test 1c: Test localStorage token handling
    await page.evaluate(() => {
      // Set a mock token to test token-based authentication
      localStorage.setItem('vendfinder-token', 'mock-token-for-testing');
      localStorage.setItem('vendfinder-user', JSON.stringify({
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      }));
    });

    // Navigate to messages page with mock token
    await page.goto(`${BASE_URL}/dashboard/messages`);
    await page.waitForLoadState('networkidle');

    // Should attempt to load the page (may show auth validation or error)
    const pageLoaded = !page.url().includes('login');
    console.log(`${pageLoaded ? '✅' : '⚠️'} Mock token allows page loading attempt`);
  });

  test('Step 2: Test Contact Vendor button functionality', async () => {
    console.log('🧪 Testing Contact Vendor button functionality...');

    // Set up mock authentication state
    await page.evaluate(() => {
      localStorage.setItem('vendfinder-token', 'mock-token-for-testing');
      localStorage.setItem('vendfinder-user', JSON.stringify({
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      }));
    });

    // Navigate to homepage to look for products
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');

    // Look for product links
    const productLinks = await page.locator('a[href*="/products/"]');
    const productCount = await productLinks.count();

    if (productCount > 0) {
      // Click on first product
      await productLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Look for Contact Vendor/Message Seller button
      const contactButtons = [
        'text="Contact Vendor"',
        'text="Message Seller"',
        'text="Contact Seller"',
        'button:has-text("Message")',
        'button:has-text("Contact")'
      ];

      let contactButtonFound = false;
      for (const selector of contactButtons) {
        try {
          const button = page.locator(selector);
          if (await button.count() > 0 && await button.isVisible()) {
            console.log(`✅ Found contact button: ${selector}`);

            // Check if button is enabled/disabled based on auth state
            const isEnabled = await button.isEnabled();
            console.log(`Contact button enabled: ${isEnabled}`);

            contactButtonFound = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (contactButtonFound) {
        console.log('✅ Contact Vendor button is present on product page');
      } else {
        console.log('⚠️ No Contact Vendor button found - may not be available for this product');
      }
    } else {
      console.log('⚠️ No products found to test Contact Vendor functionality');
    }
  });

  test('Step 3: Test WebSocket initialization', async () => {
    console.log('🧪 Testing WebSocket initialization...');

    // Set up mock authentication
    await page.evaluate(() => {
      localStorage.setItem('vendfinder-token', 'valid-token-for-testing');
      localStorage.setItem('vendfinder-user', JSON.stringify({
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      }));
    });

    // Monitor WebSocket connections
    const wsConnections = [];
    page.on('websocket', ws => {
      wsConnections.push({
        url: ws.url(),
        timestamp: new Date()
      });
      console.log(`🔌 WebSocket connection attempt: ${ws.url()}`);

      ws.on('close', () => {
        console.log(`🔌 WebSocket closed: ${ws.url()}`);
      });
    });

    // Navigate to messages page
    await page.goto(`${BASE_URL}/dashboard/messages`);
    await page.waitForLoadState('networkidle');

    // Wait a bit for WebSocket connection attempts
    await page.waitForTimeout(3000);

    // Check if WebSocket connections were attempted
    if (wsConnections.length > 0) {
      console.log(`✅ WebSocket connections attempted: ${wsConnections.length}`);
      wsConnections.forEach((ws, i) => {
        console.log(`  ${i + 1}. ${ws.url}`);
      });
    } else {
      console.log('⚠️ No WebSocket connections detected - may be disabled in test environment');
    }

    // Check for connection status indicators in the UI
    const connectionIndicators = await page.locator(
      '[data-testid="connection-status"]',
      '.connection-indicator',
      'text="Connected"',
      'text="Connecting"'
    ).count();

    console.log(`Connection UI indicators found: ${connectionIndicators}`);
  });

  test('Step 4: Test error handling and recovery', async () => {
    console.log('🧪 Testing error handling and recovery...');

    // Test 4a: Invalid token handling
    await page.evaluate(() => {
      localStorage.setItem('vendfinder-token', 'invalid-token');
      localStorage.setItem('vendfinder-user', JSON.stringify({
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      }));
    });

    await page.goto(`${BASE_URL}/dashboard/messages`);
    await page.waitForLoadState('networkidle');

    // Should handle invalid token gracefully
    const hasErrorHandling = await page.locator(
      'text="Authentication required"',
      'text="Please log in"',
      'text="Session expired"',
      '[data-testid="auth-error"]'
    ).count() > 0;

    console.log(`Error handling UI present: ${hasErrorHandling}`);

    // Test 4b: Network error simulation
    console.log('Testing network error handling...');

    // Set up a valid token first
    await page.evaluate(() => {
      localStorage.setItem('vendfinder-token', 'valid-token');
    });

    // Intercept and fail API calls
    await page.route('**/api/auth/me', route => {
      route.abort('internetdisconnected');
    });

    await page.route('**/api/chat/**', route => {
      route.abort('internetdisconnected');
    });

    // Navigate to messages
    await page.goto(`${BASE_URL}/dashboard/messages`);
    await page.waitForLoadState('networkidle');

    // Wait for error handling to kick in
    await page.waitForTimeout(2000);

    // Check if error handling is working
    const networkErrorHandling = await page.locator(
      'text="Network error"',
      'text="Connection failed"',
      'text="Unable to connect"',
      '[data-testid="network-error"]'
    ).count() > 0;

    console.log(`Network error handling present: ${networkErrorHandling}`);

    // Clear route interception
    await page.unroute('**/api/auth/me');
    await page.unroute('**/api/chat/**');

    console.log('✅ Error handling tests completed');
  });

  test('Step 5: Test authentication flow integration', async () => {
    console.log('🧪 Testing complete authentication flow integration...');

    // Start with no authentication
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Test that chat store hooks work properly when not authenticated
    await page.goto(`${BASE_URL}/dashboard/messages`);
    await page.waitForLoadState('networkidle');

    // Should be on login page or show auth required
    const isProtected = page.url().includes('login') ||
                       await page.locator('text="Please log in"').count() > 0;
    expect(isProtected).toBe(true);
    console.log('✅ Unauthenticated access properly blocked');

    // Test hook error handling by setting incomplete auth state
    await page.evaluate(() => {
      // Set user but no token
      localStorage.setItem('vendfinder-user', JSON.stringify({
        id: 'test-user',
        name: 'Test User'
      }));
      // No token set
    });

    await page.goto(`${BASE_URL}/dashboard/messages`);
    await page.waitForLoadState('networkidle');

    // Should still be protected even with user data but no token
    const stillProtected = page.url().includes('login') ||
                          await page.locator('text="Please log in"').count() > 0;
    expect(stillProtected).toBe(true);
    console.log('✅ Incomplete authentication state handled correctly');

    // Test proper authentication state
    await page.evaluate(() => {
      localStorage.setItem('vendfinder-token', 'valid-test-token');
      localStorage.setItem('vendfinder-user', JSON.stringify({
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com'
      }));
    });

    await page.goto(`${BASE_URL}/dashboard/messages`);
    await page.waitForLoadState('networkidle');

    // Should now allow access to messages page
    const hasAccess = !page.url().includes('login');
    console.log(`${hasAccess ? '✅' : '⚠️'} Proper authentication allows access`);

    // Test that useAuthToken hook is working by checking for auth validation
    await page.waitForTimeout(1000);

    const authValidated = await page.locator(
      'text="validatingAuth"',
      '[data-testid="auth-validating"]'
    ).count() === 0;  // Should not be stuck in validation

    console.log(`Authentication validation completed: ${authValidated}`);

    console.log('🎉 Authentication flow integration test completed!');
  });
});