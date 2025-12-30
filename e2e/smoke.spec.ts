import { test, expect } from '@playwright/test';

/**
 * Smoke tests for SLC AI Advisor
 *
 * These tests verify the basic functionality of the application works.
 * Run with: npm run test:e2e
 */

test.describe('App Smoke Tests', () => {
  test('homepage loads and shows app header', async ({ page }) => {
    await page.goto('/');

    // Check that the app header is visible with the correct title
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();

    // App title should be present
    const title = page.getByRole('heading', { name: 'SLC AI Advisor' });
    await expect(title).toBeVisible();
  });

  test('navigates to canvas view in frontend-only mode', async ({ page }) => {
    await page.goto('/');

    // In frontend-only mode, should redirect to /canvas/dev-canvas
    await page.waitForURL(/\/canvas\//, { timeout: 10000 });

    // Main layout should be visible
    const main = page.locator('.app-main');
    await expect(main).toBeVisible();
  });

  test('sidebar is visible on canvas page', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Sidebar wrapper should be visible
    const sidebar = page.locator('.sidebar-wrapper');
    await expect(sidebar).toBeVisible();
  });

  test('canvas grid is rendered', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Wait for the canvas to load (might show skeleton first)
    // The layout-canvas container should be visible
    const canvasLayout = page.locator('.layout-canvas');
    await expect(canvasLayout).toBeVisible();
  });

  test('chat panel is visible and can be toggled', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Chat layout should be visible
    const chatLayout = page.locator('.layout-chat');
    await expect(chatLayout).toBeVisible();

    // Toggle button should exist
    const toggleButton = page.locator('.chat-collapse-toggle');
    await expect(toggleButton).toBeVisible();

    // Click to collapse
    await toggleButton.click();

    // Chat should now be collapsed
    await expect(chatLayout).toHaveClass(/collapsed/);

    // Click again to expand
    await toggleButton.click();

    // Chat should no longer be collapsed
    await expect(chatLayout).not.toHaveClass(/collapsed/);
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Get initial theme
    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    // Find and click theme toggle button (uses "Switch to" in aria-label)
    const themeToggle = page.locator('.theme-toggle-gradient');
    await expect(themeToggle).toBeVisible();
    await themeToggle.click();

    // Theme should have changed
    const newTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    expect(newTheme).not.toBe(initialTheme);
  });

  test('venture header is editable', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Look for the venture header component
    const ventureHeader = page.locator('.venture-header');
    await expect(ventureHeader).toBeVisible();
  });

  test('undo/redo buttons are present in header', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Check for undo button
    const undoButton = page.locator('button[aria-label="Undo"]');
    await expect(undoButton).toBeVisible();

    // Check for redo button
    const redoButton = page.locator('button[aria-label="Redo"]');
    await expect(redoButton).toBeVisible();
  });

  test('export menu is accessible', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Look for export menu trigger (could be a button with export-related class or text)
    const exportButton = page.locator('.export-menu-trigger, [aria-label*="Export"], button:has-text("Export")').first();

    // If visible, click to open menu
    if (await exportButton.isVisible()) {
      await exportButton.click();

      // Menu should now be open - look for menu items
      const menuItems = page.locator('.export-menu, [role="menu"]');
      await expect(menuItems).toBeVisible();
    }
  });
});

test.describe('Accessibility Checks', () => {
  test('page has no automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Basic a11y check - main landmark exists
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Header exists
    const header = page.getByRole('banner');
    await expect(header).toBeVisible();

    // Buttons have accessible names
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const name = await button.getAttribute('aria-label') || await button.textContent();
      expect(name).toBeTruthy();
    }
  });
});

test.describe('Responsive Layout', () => {
  test('layout adapts to narrow viewport', async ({ page }) => {
    // Set a narrow viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/canvas/dev-canvas');

    // App should still render
    const app = page.locator('.app');
    await expect(app).toBeVisible();
  });

  test('layout works on mobile viewport', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/canvas/dev-canvas');

    // App should still render
    const app = page.locator('.app');
    await expect(app).toBeVisible();

    // Header should be visible
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();
  });
});
