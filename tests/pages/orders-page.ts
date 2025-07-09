import { Page, Locator, expect } from '@playwright/test';

export class OrdersPage {
  private readonly page: Page;
  private readonly createButton: Locator;
  private readonly ordersList: Locator;
  private readonly statusFilter: Locator;
  private readonly dateFilter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.locator('button:has-text("Create"), button:has-text("New Order"), [data-testid="create-order"]');
    this.ordersList = page.locator('[data-testid="orders-list"], .orders-list');
    this.statusFilter = page.locator('[data-testid="status-filter"], .status-filter');
    this.dateFilter = page.locator('[data-testid="date-filter"], .date-filter');
  }

  async goto() {
    await this.page.goto('/dashboard/team-id/orders');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForPageLoad() {
    await expect(this.page.locator('h1:has-text("Orders"), [data-testid="orders-page"]')).toBeVisible();
  }

  async createOrder(orderData: {
    productIdentifier: string;
    quantity: number;
    routingName: string;
    launchDate?: string;
    dueDate?: string;
    erpReference?: string;
  }) {
    await this.waitForPageLoad();
    await this.createButton.click();

    const dialog = this.page.locator('[data-testid="order-dialog"], .order-dialog');
    await expect(dialog).toBeVisible();

    await dialog.locator('[name="productIdentifier"], [data-testid="product-identifier"]').fill(orderData.productIdentifier);
    await dialog.locator('[name="quantity"], [data-testid="quantity"]').fill(String(orderData.quantity));
    await dialog.locator('[name="routing"], [data-testid="routing-select"]').selectOption({ label: orderData.routingName });

    if (orderData.launchDate) {
      await dialog.locator('[name="launchDate"], [data-testid="launch-date"]').fill(orderData.launchDate);
    }

    if (orderData.dueDate) {
      await dialog.locator('[name="dueDate"], [data-testid="due-date"]').fill(orderData.dueDate);
    }

    if (orderData.erpReference) {
      await dialog.locator('[name="erpReference"], [data-testid="erp-reference"]').fill(orderData.erpReference);
    }

    await dialog.locator('button:has-text("Create"), button:has-text("Save"), [data-testid="save-order"]').click();
    await expect(dialog).not.toBeVisible();

    // Wait for the order to appear in the list
    await this.page.waitForLoadState('networkidle');
  }

  async filterByStatus(status: 'Pending' | 'In Progress' | 'On Hold' | 'Completed' | 'All') {
    await this.waitForPageLoad();
    await this.statusFilter.selectOption({ label: status });
    await this.page.waitForLoadState('networkidle');
  }

  async filterByDate(dateRange: 'Today' | 'This Week' | 'This Month' | 'Custom') {
    await this.waitForPageLoad();
    await this.dateFilter.selectOption({ label: dateRange });
    await this.page.waitForLoadState('networkidle');
  }

  async getOrders() {
    await this.waitForPageLoad();
    return await this.ordersList.locator('.order-item, [data-testid="order-item"]').all();
  }

  async selectOrder(orderNumber: string) {
    const orderItem = this.ordersList.locator(`[data-testid="order-item"]:has-text("${orderNumber}"), .order-item:has-text("${orderNumber}")`);
    await orderItem.click();
  }

  async getOrderDetails(orderNumber: string) {
    await this.selectOrder(orderNumber);

    const detailsPanel = this.page.locator('[data-testid="order-details"], .order-details');
    await expect(detailsPanel).toBeVisible();

    const status = await detailsPanel.locator('[data-testid="order-status"], .order-status').textContent();
    const product = await detailsPanel.locator('[data-testid="product-identifier"], .product-identifier').textContent();
    const quantity = await detailsPanel.locator('[data-testid="quantity"], .quantity').textContent();
    const currentWOO = await detailsPanel.locator('[data-testid="current-woo"], .current-woo').textContent();

    return {
      status,
      product,
      quantity,
      currentWOO
    };
  }

  async verifyOrderExists(orderNumber: string) {
    await this.waitForPageLoad();
    const orderItem = this.ordersList.locator(`[data-testid="order-item"]:has-text("${orderNumber}"), .order-item:has-text("${orderNumber}")`);
    await expect(orderItem).toBeVisible();
  }

  async verifyOrderStatus(orderNumber: string, expectedStatus: string) {
    const orderItem = this.ordersList.locator(`[data-testid="order-item"]:has-text("${orderNumber}"), .order-item:has-text("${orderNumber}")`);
    await expect(orderItem).toBeVisible();

    const statusBadge = orderItem.locator('[data-testid="order-status"], .order-status');
    await expect(statusBadge).toContainText(expectedStatus);
  }

  async getOrderCount() {
    await this.waitForPageLoad();
    const orders = await this.getOrders();
    return orders.length;
  }

  async sortBy(sortOption: 'Created Date' | 'Launch Date' | 'Due Date' | 'Status') {
    await this.waitForPageLoad();

    const sortDropdown = this.page.locator('[data-testid="sort-dropdown"], .sort-dropdown');
    await sortDropdown.selectOption({ label: sortOption });

    await this.page.waitForLoadState('networkidle');
  }

  async searchOrders(searchTerm: string) {
    await this.waitForPageLoad();

    const searchInput = this.page.locator('[data-testid="search-orders"], .search-orders input');
    await searchInput.fill(searchTerm);

    // Wait for search results
    await this.page.waitForTimeout(500);
  }
}
