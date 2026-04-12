const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Manual VendFinder Dashboard Screenshot Tool
// For testing when authentication services aren't running
class ManualDashboardCapture {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = process.env.VENDFINDER_URL || 'http://localhost:3000';
    this.outputDir = './vendor-screenshots';
  }

  async init() {
    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Launch browser
    this.browser = await chromium.launch({
      headless: false, // Keep visible for manual interaction
      slowMo: 500,
    });

    this.page = await this.browser.newPage();

    // Set viewport for consistent screenshots
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async captureManualNavigation(vendorName = 'vendor') {
    try {
      console.log(`🔍 Manual capture mode for ${vendorName}...`);
      console.log('📋 Instructions:');
      console.log('1. Browser will open to VendFinder');
      console.log("2. Manually log in to Sally's account");
      console.log('3. Navigate to her dashboard/selling page');
      console.log('4. Press Enter in this terminal when ready to capture');

      // Navigate to main site
      await this.page.goto(this.baseUrl);
      await this.page.waitForLoadState('networkidle');

      // Wait for user to manually navigate and login
      console.log('\n⏳ Browser opened. Please:');
      console.log("   - Log in to Sally's account");
      console.log('   - Navigate to Dashboard > Selling');
      console.log('   - Press Enter when ready to capture...');

      // Wait for user input
      await this.waitForUserInput();

      // Take screenshot
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${vendorName}-dashboard-manual-${timestamp}.png`;
      const filepath = path.join(this.outputDir, filename);

      await this.page.screenshot({
        path: filepath,
        fullPage: true,
      });

      console.log(`📸 Screenshot saved: ${filepath}`);

      // Try to extract metrics from current page
      const metrics = await this.extractDashboardMetrics();

      // Save metrics as JSON
      const metricsFile = path.join(
        this.outputDir,
        `${vendorName}-metrics-manual-${timestamp}.json`
      );
      fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));

      console.log(`📊 Metrics saved: ${metricsFile}`);
      console.log('\n📋 Dashboard Data:');
      console.log(JSON.stringify(metrics, null, 2));

      return { screenshot: filepath, metrics: metricsFile, data: metrics };
    } catch (error) {
      console.error('❌ Error during capture:', error);
      throw error;
    }
  }

  async waitForUserInput() {
    return new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question('Press Enter to capture...', (answer) => {
        rl.close();
        resolve();
      });
    });
  }

  async extractDashboardMetrics() {
    try {
      const metrics = await this.page.evaluate(() => {
        const data = {};

        // Look for revenue/sales numbers
        const revenueElements = document.querySelectorAll(
          '[class*="revenue"], [class*="sales"], [class*="total"], [class*="amount"]'
        );
        revenueElements.forEach((el, i) => {
          const text = el.textContent.trim();
          if (text.includes('$') || text.match(/\d+/)) {
            data[`metric_${i}`] = text;
          }
        });

        // Look for order/product information
        const orderElements = document.querySelectorAll(
          '[class*="order"], [class*="sale"], [class*="product"], [class*="item"]'
        );
        const orders = [];
        orderElements.forEach((el) => {
          const orderText = el.textContent.trim();
          if (orderText && orderText.length > 10 && orderText.length < 200) {
            orders.push(orderText);
          }
        });

        // Look for status indicators
        const statusElements = document.querySelectorAll(
          '[class*="status"], [class*="pending"], [class*="processing"], [class*="success"]'
        );
        statusElements.forEach((el, i) => {
          const text = el.textContent.trim();
          if (text && text.length < 50) {
            data[`status_${i}`] = text;
          }
        });

        data.orders = orders.slice(0, 10); // Limit to first 10 orders
        data.timestamp = new Date().toISOString();
        data.url = window.location.href;
        data.pageTitle = document.title;

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
  const vendorName = process.argv[2] || 'sally';

  const capture = new ManualDashboardCapture();

  try {
    await capture.init();
    const result = await capture.captureManualNavigation(vendorName);

    console.log('\n🎉 Manual capture completed successfully!');
    console.log(`📸 Screenshot: ${result.screenshot}`);
    console.log(`📊 Metrics: ${result.metrics}`);
  } catch (error) {
    console.error('💥 Capture failed:', error);
    process.exit(1);
  } finally {
    await capture.close();
  }
}

// Export for programmatic use
module.exports = ManualDashboardCapture;

// Run if called directly
if (require.main === module) {
  main();
}
