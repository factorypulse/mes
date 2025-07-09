import { test, expect } from '@playwright/test';
import { AuthHelper, TEST_CREDENTIALS } from './utils/auth';

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    const auth = new AuthHelper(page);

    await auth.login();

    // Verify we're redirected to dashboard
    expect(page.url()).toMatch(/\/dashboard/);

    // Verify we're in an authenticated state (on dashboard or have auth indicators)
    const isAuthenticated = page.url().includes('/dashboard') ||
      await page.locator('a:has-text("Dashboard")').isVisible() ||
      await page.locator('div:has-text("Welcome")').isVisible();

    expect(isAuthenticated).toBe(true);
  });

  test('should navigate to StackAuth when clicking Sign In', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find and click the Sign In button
    const signInButton = page.locator('a:has-text("Sign In")');
    await expect(signInButton).toBeVisible();

    await signInButton.click();

    // Should navigate away from the homepage (to StackAuth or back to app if already authed)
    await page.waitForLoadState('networkidle');

    const finalUrl = page.url();
    const isRedirected = !finalUrl.endsWith('/') || finalUrl.includes('dashboard') || finalUrl.includes('auth');
    expect(isRedirected).toBe(true);
  });

  test('should handle team creation for new users', async ({ page }) => {
    const auth = new AuthHelper(page);

    await auth.login();

    // If we land on a team creation page, this test validates that flow
    const createTeamButton = page.locator('button:has-text("Create team")');

    if (await createTeamButton.isVisible()) {
      // Fill team name and create
      const teamNameInput = page.locator('input[placeholder="Team name"]');
      await teamNameInput.fill('Automated Test Team');
      await createTeamButton.click();

      // Should redirect to team dashboard
      await expect(page).toHaveURL(/\/dashboard\/[a-zA-Z0-9-]+/);
    } else {
      // User already has teams, should be on dashboard
      expect(page.url()).toMatch(/\/dashboard/);
    }
  });

  test('should access protected routes after authentication', async ({ page }) => {
    const auth = new AuthHelper(page);

    await auth.login();

    // Try to access a protected route
    await page.goto('/dashboard');

    // Should not be redirected to login
    expect(page.url()).toMatch(/\/dashboard/);

    // Look for indicators that we're in the protected area
    const protectedContent = await page.locator('h1, h2, [data-testid], .dashboard').first().isVisible();
    expect(protectedContent).toBe(true);
  });

  test('should show sign in option when not authenticated', async ({ page }) => {
    // Clear any existing authentication
    await page.context().clearCookies();
    await page.goto('/');

    // Should show Sign In button on landing page
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('a:has-text("Sign Up")')).toBeVisible();
  });

  test('should show dashboard link when authenticated', async ({ page }) => {
    const auth = new AuthHelper(page);

    await auth.login();

    // Go back to homepage
    await page.goto('/');

    // Should show Dashboard link instead of Sign In/Sign Up
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible();

    // Should not show Sign In/Sign Up buttons
    const signInVisible = await page.locator('a:has-text("Sign In")').isVisible();
    const signUpVisible = await page.locator('a:has-text("Sign Up")').isVisible();

    expect(signInVisible || signUpVisible).toBe(false);
  });
});
