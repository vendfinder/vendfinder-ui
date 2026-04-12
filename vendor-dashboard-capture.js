const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// VendFinder Vendor Dashboard Screenshot Tool
class VendorDashboardCapture {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = process.env.VENDFINDER_URL || 'https://vendfinder.com';
    this.outputDir = './vendor-screenshots';
  }

  async init() {
    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Launch browser
    this.browser = await chromium.launch({
      headless: false, // Set to true for background operation
      slowMo: 1000, // Slow down for debugging
    });

    this.page = await this.browser.newPage();

    // Set viewport for consistent screenshots
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async captureVendorDashboard(
    vendorEmail,
    vendorPassword,
    vendorName = 'vendor'
  ) {
    try {
      console.log(`🔍 Capturing dashboard for ${vendorName}...`);

      // Navigate to login
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.waitForLoadState('networkidle');

      // Take debug screenshot of login page
      await this.page.screenshot({
        path: `${this.outputDir}/debug-signin-page.png`,
      });
      console.log('📸 Debug: Signin page screenshot saved');

      // Wait for form elements to appear and login
      console.log('⏳ Waiting for login form elements...');
      await this.page.waitForSelector(
        'input[type="email"], input[name="email"], input[placeholder*="email" i]',
        { timeout: 10000 }
      );
      await this.page.waitForSelector(
        'input[type="password"], input[name="password"], input[placeholder*="password" i]',
        { timeout: 10000 }
      );

      // Try multiple selectors for email input
      const emailInput = this.page
        .locator(
          'input[type="email"], input[name="email"], input[placeholder*="email" i]'
        )
        .first();
      const passwordInput = this.page
        .locator(
          'input[type="password"], input[name="password"], input[placeholder*="password" i]'
        )
        .first();

      await emailInput.fill(vendorEmail);
      await passwordInput.fill(vendorPassword);

      // Try multiple selectors for submit button
      const submitButton = this.page
        .locator(
          'button[type="submit"], button:has-text("Sign in"), button:has-text("Login")'
        )
        .first();
      await submitButton.click();

      // Take debug screenshot after login attempt
      await this.page.waitForTimeout(2000);
      await this.page.screenshot({
        path: `${this.outputDir}/debug-after-login.png`,
      });
      console.log('📸 Debug: After login screenshot saved');

      // Wait for redirect (try multiple possible destinations)
      try {
        await this.page.waitForURL('**/dashboard/**', { timeout: 10000 });
        console.log('✅ Login successful - redirected to dashboard');
      } catch (error) {
        // Check if we're on a different page that indicates successful login
        const currentUrl = this.page.url();
        console.log(
          `⚠️ Dashboard redirect timeout. Current URL: ${currentUrl}`
        );

        if (
          currentUrl.includes('dashboard') ||
          currentUrl.includes('profile') ||
          currentUrl.includes('selling')
        ) {
          console.log('✅ Login appears successful (alternative URL)');
        } else {
          // Check for various error messages and form validation
          await this.page.waitForTimeout(1000); // Wait for any error messages to appear

          const errorSelectors = [
            'text*="error"',
            'text*="invalid"',
            'text*="incorrect"',
            'text*="failed"',
            'text*="not found"',
            'text*="wrong"',
            '[class*="error"]',
            '[role="alert"]',
          ];

          let errorMsg = null;
          for (const selector of errorSelectors) {
            try {
              const element = await this.page.locator(selector).first();
              if (await element.isVisible()) {
                errorMsg = await element.textContent();
                break;
              }
            } catch (e) {
              // Selector not found, continue
            }
          }

          if (errorMsg) {
            throw new Error(`Login failed: ${errorMsg.trim()}`);
          } else {
            throw new Error(
              `Login failed - credentials may be incorrect. URL: ${currentUrl}`
            );
          }
        }
      }

      // Navigate to selling dashboard
      await this.page.goto(`${this.baseUrl}/dashboard/selling`);
      await this.page.waitForLoadState('networkidle');

      // Wait for sales data to load
      await this.page.waitForTimeout(3000);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${vendorName}-dashboard-${timestamp}.png`;
      const filepath = path.join(this.outputDir, filename);

      // Take full page screenshot
      await this.page.screenshot({
        path: filepath,
        fullPage: true,
      });

      console.log(`📸 Screenshot saved: ${filepath}`);

      // Capture dashboard metrics
      const metrics = await this.extractDashboardMetrics();

      // Save metrics as JSON
      const metricsFile = path.join(
        this.outputDir,
        `${vendorName}-metrics-${timestamp}.json`
      );
      fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));

      console.log(`📊 Metrics saved: ${metricsFile}`);

      return { screenshot: filepath, metrics: metricsFile, data: metrics };
    } catch (error) {
      console.error('❌ Error capturing dashboard:', error);
      throw error;
    }
  }

  async extractDashboardMetrics() {
    try {
      // Extract key dashboard metrics
      const metrics = await this.page.evaluate(() => {
        const data = {};

        // Look for revenue/sales numbers
        const revenueElements = document.querySelectorAll(
          '[class*="revenue"], [class*="sales"], [class*="total"]'
        );
        revenueElements.forEach((el, i) => {
          const text = el.textContent.trim();
          if (
            text.includes('$') ||
            text.includes('revenue') ||
            text.includes('sales')
          ) {
            data[`metric_${i}`] = text;
          }
        });

        // Look for status indicators
        const statusElements = document.querySelectorAll(
          '[class*="status"], [class*="pending"], [class*="processing"]'
        );
        statusElements.forEach((el, i) => {
          data[`status_${i}`] = el.textContent.trim();
        });

        // Extract order information
        const orders = [];
        const orderElements = document.querySelectorAll(
          '[class*="order"], [class*="sale"]'
        );
        orderElements.forEach((el) => {
          const orderText = el.textContent.trim();
          if (orderText && orderText.length > 5) {
            orders.push(orderText);
          }
        });

        data.orders = orders;
        data.timestamp = new Date().toISOString();
        data.url = window.location.href;

        return data;
      });

      return metrics;
    } catch (error) {
      console.warn('⚠️ Could not extract metrics:', error);
      return { error: error.message, timestamp: new Date().toISOString() };
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
📸 VendFinder Vendor Dashboard Capture Tool

Usage: node vendor-dashboard-capture.js <email> <password> [vendor-name]

Examples:
  node vendor-dashboard-capture.js sally@example.com password123 sally
  node vendor-dashboard-capture.js vendor@vendfinder.com mypass john

Environment Variables:
  VENDFINDER_URL - Base URL (default: https://vendfinder.com)
`);
    process.exit(1);
  }

  const [email, password, vendorName = 'vendor'] = args;

  const capture = new VendorDashboardCapture();

  try {
    await capture.init();
    const result = await capture.captureVendorDashboard(
      email,
      password,
      vendorName
    );

    console.log('\n🎉 Capture completed successfully!');
    console.log(`📸 Screenshot: ${result.screenshot}`);
    console.log(`📊 Metrics: ${result.metrics}`);
    console.log('\n📋 Dashboard Data:');
    console.log(JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.error('💥 Capture failed:', error);
    process.exit(1);
  } finally {
    await capture.close();
  }
}

// Export for programmatic use
module.exports = VendorDashboardCapture;

// Run if called directly
if (require.main === module) {
  main();
}
