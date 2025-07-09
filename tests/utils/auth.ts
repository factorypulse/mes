import { Page, expect } from '@playwright/test';

export const TEST_CREDENTIALS = {
  email: 'tdarcytom@googlemail.com',
  password: 'y3m7Lw!f+:2jEDA'
};

export class AuthHelper {
  constructor(private page: Page) {}

  async login(email: string = TEST_CREDENTIALS.email, password: string = TEST_CREDENTIALS.password) {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');

    // Look for the Sign In button on the landing page
    const signInButton = this.page.locator('a:has-text("Sign In")').first();

    if (await signInButton.isVisible()) {
      // Click Sign In - this will redirect to StackAuth
      await signInButton.click();

      // Wait for StackAuth page to load and handle authentication
      await this.page.waitForLoadState('networkidle');

      // StackAuth pages will have different selectors - try common ones
      const emailInput = this.page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      const passwordInput = this.page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();

      if (await emailInput.isVisible()) {
        await emailInput.fill(email);
        await passwordInput.fill(password);

        // Find and click submit button
        const submitButton = this.page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login"), button:has-text("Submit")').first();
        await submitButton.click();
      } else {
        // If no login form is visible, might already be authenticated
        console.log('No login form found - user might already be authenticated');
      }
    }

    // Wait for redirect back to the app after successful authentication
    await this.page.waitForURL(/localhost.*\/(dashboard|handler)/);

    // Handle team creation/selection if on dashboard page
    await this.handleTeamSelection();

    // Final verification - look for authenticated user elements
    await this.verifyAuthenticated();
  }

  async handleTeamSelection() {
    const currentUrl = this.page.url();

    if (currentUrl.includes('/dashboard') && !currentUrl.includes('/dashboard/')) {
      // We're on the main dashboard page - might need team creation or selection

      // Check if we need to create a team
      const createTeamButton = this.page.locator('button:has-text("Create team")');
      if (await createTeamButton.isVisible()) {
        // Fill team name and create team
        const teamNameInput = this.page.locator('input[placeholder="Team name"]');
        await teamNameInput.fill('Test Team');
        await createTeamButton.click();

        // Wait for team creation and redirect
        await this.page.waitForURL(/\/dashboard\/[^\/]+/);
      }

      // If there are existing teams, select the first one
      const firstTeamCard = this.page.locator('[data-testid="team-card"], .team-card, button:has-text("Select")').first();
      if (await firstTeamCard.isVisible()) {
        await firstTeamCard.click();
        await this.page.waitForURL(/\/dashboard\/[^\/]+/);
      }
    }
  }

  async verifyAuthenticated() {
    // Look for authenticated user indicators
    const authenticatedElements = [
      'button:has-text("Profile")',
      '[data-testid="user-menu"]',
      '.user-menu',
      'button[aria-label*="user" i]',
      'div:has-text("Welcome")',
      'a:has-text("Dashboard")'
    ];

    let found = false;
    for (const selector of authenticatedElements) {
      try {
        await expect(this.page.locator(selector)).toBeVisible({ timeout: 5000 });
        found = true;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!found) {
      // If no user menu found, check if we're on a dashboard page (indicates auth success)
      expect(this.page.url()).toMatch(/\/dashboard/);
    }
  }

  async logout() {
    // Look for user menu or profile button to access logout
    const userMenuSelectors = [
      '[data-testid="user-menu"]',
      '.user-menu',
      'button:has-text("Profile")',
      'button[aria-label*="user" i]'
    ];

    let userMenu = null;
    for (const selector of userMenuSelectors) {
      userMenu = this.page.locator(selector);
      if (await userMenu.isVisible()) {
        break;
      }
    }

    if (userMenu && await userMenu.isVisible()) {
      await userMenu.click();

      // Look for logout/sign out button
      const logoutButton = this.page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      }
    } else {
      // Alternative: directly navigate to a logout URL if available
      await this.page.goto('/api/auth/signout');
    }

    // Wait for redirect to login/landing page
    await this.page.waitForURL(/\/(|auth|login)/);
  }

  async ensureLoggedIn() {
    // Quick check if already authenticated
    const isOnDashboard = this.page.url().includes('/dashboard');
    const hasUserMenu = await this.page.locator('[data-testid="user-menu"], .user-menu, button:has-text("Profile")').isVisible();

    if (!isOnDashboard && !hasUserMenu) {
      await this.login();
    }
  }
}
