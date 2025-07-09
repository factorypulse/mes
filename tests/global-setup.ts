import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  const { baseURL, storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the application
    await page.goto(baseURL!);

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    console.log('✅ Application is running and accessible');

    // Check if we can reach the API
    try {
      const apiResponse = await page.request.get(`${baseURL}/api/health`);
      if (apiResponse.ok()) {
        console.log('✅ API is accessible');
      } else {
        console.log('⚠️  API health check failed, but continuing...');
      }
    } catch (error) {
      console.log('⚠️  API health check failed (no health endpoint), but continuing...');
    }

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await page.close();
    await browser.close();
  }

  console.log('✅ Global setup completed successfully');
}

export default globalSetup;
