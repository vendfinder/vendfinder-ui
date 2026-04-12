// Global setup for E2E tests
// This file is used when running tests against local development server
const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('🔧 Setting up E2E test environment...');

  // For staging tests, we don't need to do anything special
  // The staging environment should already be running
  if (process.env.PLAYWRIGHT_BASE_URL) {
    console.log(
      `✅ Using existing environment at: ${process.env.PLAYWRIGHT_BASE_URL}`
    );

    // Quick health check for staging environment
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      await page.goto(process.env.PLAYWRIGHT_BASE_URL, { timeout: 10000 });
      console.log('✅ Staging environment is responsive');
    } catch (error) {
      console.error(
        '❌ Staging environment health check failed:',
        error.message
      );
      throw new Error('Staging environment is not accessible');
    } finally {
      await browser.close();
    }

    return;
  }

  console.log('✅ Local development setup complete');
}

module.exports = globalSetup;
