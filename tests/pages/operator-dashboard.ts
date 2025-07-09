import { Page, Locator, expect } from '@playwright/test';

export class OperatorDashboardPage {
  private readonly page: Page;
  private readonly todoWOOList: Locator;
  private readonly pausedWOOList: Locator;
  private readonly activeWOOCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.todoWOOList = page.locator('[data-testid="todo-woo-list"], .todo-woo-list');
    this.pausedWOOList = page.locator('[data-testid="paused-woo-list"], .paused-woo-list');
    this.activeWOOCard = page.locator('[data-testid="active-woo"], .active-woo');
  }

  async goto() {
    await this.page.goto('/dashboard/team-id/operator');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForDashboardLoad() {
    await expect(this.page.locator('h1:has-text("Operator Dashboard"), [data-testid="operator-dashboard"]')).toBeVisible();
  }

  async getTodoWOOs() {
    await this.waitForDashboardLoad();
    return await this.todoWOOList.locator('.woo-item, [data-testid="woo-item"]').all();
  }

  async getPausedWOOs() {
    await this.waitForDashboardLoad();
    return await this.pausedWOOList.locator('.woo-item, [data-testid="woo-item"]').all();
  }

  async startWOO(wooTitle: string) {
    const wooItem = this.page.locator(`[data-testid="woo-item"]:has-text("${wooTitle}"), .woo-item:has-text("${wooTitle}")`).first();
    await expect(wooItem).toBeVisible();

    const startButton = wooItem.locator('button:has-text("Start"), [data-testid="start-woo"]');
    await startButton.click();

    // Wait for the WOO to become active
    await expect(this.activeWOOCard).toBeVisible();
  }

  async pauseActiveWOO(pauseReason: string) {
    await expect(this.activeWOOCard).toBeVisible();

    const pauseButton = this.activeWOOCard.locator('button:has-text("Pause"), [data-testid="pause-woo"]');
    await pauseButton.click();

    // Select pause reason from dialog
    const pauseDialog = this.page.locator('[data-testid="pause-dialog"], .pause-dialog');
    await expect(pauseDialog).toBeVisible();

    await pauseDialog.locator(`option:has-text("${pauseReason}"), button:has-text("${pauseReason}")`).click();

    const confirmButton = pauseDialog.locator('button:has-text("Confirm"), [data-testid="confirm-pause"]');
    await confirmButton.click();

    // Wait for the pause dialog to close
    await expect(pauseDialog).not.toBeVisible();
  }

  async resumePausedWOO(wooTitle: string) {
    const pausedWOO = this.pausedWOOList.locator(`[data-testid="woo-item"]:has-text("${wooTitle}"), .woo-item:has-text("${wooTitle}")`).first();
    await expect(pausedWOO).toBeVisible();

    const resumeButton = pausedWOO.locator('button:has-text("Resume"), [data-testid="resume-woo"]');
    await resumeButton.click();

    // Wait for the WOO to become active
    await expect(this.activeWOOCard).toBeVisible();
  }

  async fillDataInputs(data: Record<string, any>) {
    await expect(this.activeWOOCard).toBeVisible();

    for (const [fieldName, value] of Object.entries(data)) {
      const input = this.activeWOOCard.locator(`[name="${fieldName}"], [data-testid="${fieldName}"]`);

      if (typeof value === 'boolean') {
        if (value) {
          await input.check();
        } else {
          await input.uncheck();
        }
      } else {
        await input.fill(String(value));
      }
    }
  }

  async completeActiveWOO(capturedData?: Record<string, any>) {
    await expect(this.activeWOOCard).toBeVisible();

    // Fill in data if provided
    if (capturedData) {
      await this.fillDataInputs(capturedData);
    }

    const completeButton = this.activeWOOCard.locator('button:has-text("Complete"), [data-testid="complete-woo"]');
    await completeButton.click();

    // Confirm completion if dialog appears
    const confirmDialog = this.page.locator('[data-testid="confirm-dialog"], .confirm-dialog');
    if (await confirmDialog.isVisible()) {
      await confirmDialog.locator('button:has-text("Confirm"), [data-testid="confirm"]').click();
    }

    // Wait for the active WOO to disappear
    await expect(this.activeWOOCard).not.toBeVisible();
  }

  async getActiveWOOInfo() {
    await expect(this.activeWOOCard).toBeVisible();

    const title = await this.activeWOOCard.locator('[data-testid="woo-title"], .woo-title').textContent();
    const instructions = await this.activeWOOCard.locator('[data-testid="woo-instructions"], .woo-instructions').textContent();
    const timer = await this.activeWOOCard.locator('[data-testid="woo-timer"], .woo-timer').textContent();

    return {
      title,
      instructions,
      timer
    };
  }

  async uploadAttachment(filePath: string, description?: string) {
    await expect(this.activeWOOCard).toBeVisible();

    const fileInput = this.activeWOOCard.locator('input[type="file"], [data-testid="file-upload"]');
    await fileInput.setInputFiles(filePath);

    if (description) {
      const descriptionInput = this.activeWOOCard.locator('[data-testid="attachment-description"], [name="description"]');
      await descriptionInput.fill(description);
    }

    const uploadButton = this.activeWOOCard.locator('button:has-text("Upload"), [data-testid="upload-file"]');
    await uploadButton.click();

    // Wait for upload to complete
    await expect(this.activeWOOCard.locator('.upload-success, [data-testid="upload-success"]')).toBeVisible();
  }

  async verifyWOOInList(listType: 'todo' | 'paused', wooTitle: string) {
    const list = listType === 'todo' ? this.todoWOOList : this.pausedWOOList;
    const wooItem = list.locator(`[data-testid="woo-item"]:has-text("${wooTitle}"), .woo-item:has-text("${wooTitle}")`);
    await expect(wooItem).toBeVisible();
  }

  async verifyNoActiveWOO() {
    await expect(this.activeWOOCard).not.toBeVisible();
  }

  async verifyActiveWOO(wooTitle: string) {
    await expect(this.activeWOOCard).toBeVisible();
    await expect(this.activeWOOCard.locator(`text="${wooTitle}"`)).toBeVisible();
  }
}
