import { Page, Locator, expect } from '@playwright/test';

export class RoutingsPage {
  private readonly page: Page;
  private readonly createButton: Locator;
  private readonly routingsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.locator('button:has-text("Create"), button:has-text("New Routing"), [data-testid="create-routing"]');
    this.routingsList = page.locator('[data-testid="routings-list"], .routings-list');
  }

  async goto() {
    await this.page.goto('/dashboard/team-id/routings');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForPageLoad() {
    await expect(this.page.locator('h1:has-text("Routings"), [data-testid="routings-page"]')).toBeVisible();
  }

  async createRouting(routingData: {
    name: string;
    productIdentifier: string;
    operations: Array<{
      title: string;
      orgId: string;
      targetTimeMinutes: number;
      instructions: string;
      dataInputs?: Array<{ name: string; label: string; type: string; required: boolean }>;
    }>;
  }) {
    await this.waitForPageLoad();
    await this.createButton.click();

    // Fill routing basic info
    const dialog = this.page.locator('[data-testid="routing-dialog"], .routing-dialog');
    await expect(dialog).toBeVisible();

    await dialog.locator('[name="name"], [data-testid="routing-name"]').fill(routingData.name);
    await dialog.locator('[name="productIdentifier"], [data-testid="product-identifier"]').fill(routingData.productIdentifier);

    // Add operations
    for (const operation of routingData.operations) {
      await dialog.locator('button:has-text("Add Operation"), [data-testid="add-operation"]').click();

      const operationForm = dialog.locator('.operation-form, [data-testid="operation-form"]').last();

      await operationForm.locator('[name="title"], [data-testid="operation-title"]').fill(operation.title);
      await operationForm.locator('[name="orgId"], [data-testid="operation-org"]').selectOption(operation.orgId);
      await operationForm.locator('[name="targetTime"], [data-testid="target-time"]').fill(String(operation.targetTimeMinutes));
      await operationForm.locator('[name="instructions"], [data-testid="instructions"]').fill(operation.instructions);

      // Add data input schema if provided
      if (operation.dataInputs) {
        for (const dataInput of operation.dataInputs) {
          await operationForm.locator('button:has-text("Add Data Input"), [data-testid="add-data-input"]').click();

          const inputForm = operationForm.locator('.data-input-form, [data-testid="data-input-form"]').last();
          await inputForm.locator('[name="name"], [data-testid="input-name"]').fill(dataInput.name);
          await inputForm.locator('[name="label"], [data-testid="input-label"]').fill(dataInput.label);
          await inputForm.locator('[name="type"], [data-testid="input-type"]').selectOption(dataInput.type);

          if (dataInput.required) {
            await inputForm.locator('[name="required"], [data-testid="input-required"]').check();
          }
        }
      }
    }

    // Save routing
    await dialog.locator('button:has-text("Save"), button:has-text("Create"), [data-testid="save-routing"]').click();
    await expect(dialog).not.toBeVisible();
  }

  async getRoutings() {
    await this.waitForPageLoad();
    return await this.routingsList.locator('.routing-item, [data-testid="routing-item"]').all();
  }

  async selectRouting(routingName: string) {
    const routingItem = this.routingsList.locator(`[data-testid="routing-item"]:has-text("${routingName}"), .routing-item:has-text("${routingName}")`);
    await routingItem.click();
  }

  async editRouting(routingName: string, updates: { name?: string; productIdentifier?: string }) {
    await this.selectRouting(routingName);

    const editButton = this.page.locator('button:has-text("Edit"), [data-testid="edit-routing"]');
    await editButton.click();

    const dialog = this.page.locator('[data-testid="routing-dialog"], .routing-dialog');
    await expect(dialog).toBeVisible();

    if (updates.name) {
      await dialog.locator('[name="name"], [data-testid="routing-name"]').fill(updates.name);
    }

    if (updates.productIdentifier) {
      await dialog.locator('[name="productIdentifier"], [data-testid="product-identifier"]').fill(updates.productIdentifier);
    }

    await dialog.locator('button:has-text("Save"), [data-testid="save-routing"]').click();
    await expect(dialog).not.toBeVisible();
  }

  async archiveRouting(routingName: string) {
    await this.selectRouting(routingName);

    const archiveButton = this.page.locator('button:has-text("Archive"), [data-testid="archive-routing"]');
    await archiveButton.click();

    // Confirm archive action
    const confirmDialog = this.page.locator('[data-testid="confirm-dialog"], .confirm-dialog');
    if (await confirmDialog.isVisible()) {
      await confirmDialog.locator('button:has-text("Confirm"), [data-testid="confirm"]').click();
    }
  }

  async verifyRoutingExists(routingName: string) {
    await this.waitForPageLoad();
    const routingItem = this.routingsList.locator(`[data-testid="routing-item"]:has-text("${routingName}"), .routing-item:has-text("${routingName}")`);
    await expect(routingItem).toBeVisible();
  }

  async verifyRoutingNotExists(routingName: string) {
    await this.waitForPageLoad();
    const routingItem = this.routingsList.locator(`[data-testid="routing-item"]:has-text("${routingName}"), .routing-item:has-text("${routingName}")`);
    await expect(routingItem).not.toBeVisible();
  }
}
