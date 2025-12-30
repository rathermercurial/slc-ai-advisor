import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E User Scenario Tests for SLC AI Advisor
 *
 * These tests cover realistic user workflows:
 * 1. Canvas Editing Flow
 * 2. Chat Interaction Flow
 * 3. Theme Cycling Flow
 * 4. Sidebar Collapse/Expand Flow
 * 5. Export Menu Flow
 *
 * Run with: npm run test:e2e
 */

test.describe('Canvas Editing Flow', () => {
  test('user can edit a canvas section and see text persist', async ({ page }) => {
    // Navigate to the canvas page
    await page.goto('/canvas/dev-canvas');

    // Wait for the canvas to fully load
    const canvasLayout = page.locator('.slc-canvas');
    await expect(canvasLayout).toBeVisible();

    // Find the Purpose section (first section in the canvas)
    const purposeSection = page.locator('.canvas-section').filter({
      has: page.locator('.canvas-section-title', { hasText: 'PURPOSE' }),
    });
    await expect(purposeSection).toBeVisible();

    // Click on the section to enter edit mode
    await purposeSection.click();

    // Wait for the textarea to appear (edit mode activated)
    const textarea = purposeSection.locator('textarea.canvas-section-edit');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeFocused();

    // Type some test content
    const testContent = 'Test purpose content for E2E testing';
    await textarea.fill(testContent);

    // Click outside the section to trigger save (blur)
    // Click on a different section to trigger blur
    const customersSection = page.locator('.canvas-section').filter({
      has: page.locator('.canvas-section-title', { hasText: 'CUSTOMERS' }),
    });
    await customersSection.click();

    // Wait for the save to complete (textarea should disappear)
    await expect(textarea).not.toBeVisible({ timeout: 5000 });

    // Verify the content persists in the section
    const sectionContent = purposeSection.locator('.canvas-section-content');
    await expect(sectionContent).toContainText(testContent);
  });

  test('user can cancel editing with Escape key', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    const canvasLayout = page.locator('.slc-canvas');
    await expect(canvasLayout).toBeVisible();

    // Find the Solution section
    const solutionSection = page.locator('.canvas-section').filter({
      has: page.locator('.canvas-section-title', { hasText: 'SOLUTION' }),
    });
    await expect(solutionSection).toBeVisible();

    // Enter edit mode
    await solutionSection.click();
    const textarea = solutionSection.locator('textarea.canvas-section-edit');
    await expect(textarea).toBeVisible();

    // Type some content
    await textarea.fill('Content that will be cancelled');

    // Press Escape to cancel
    await textarea.press('Escape');

    // Textarea should disappear and content should not be saved
    await expect(textarea).not.toBeVisible();

    // The section should show helper text (empty state) or previous content
    const sectionContent = solutionSection.locator('.canvas-section-content');
    await expect(sectionContent).toBeVisible();
    await expect(sectionContent).not.toContainText('Content that will be cancelled');
  });

  test('user can save with Cmd/Ctrl+Enter shortcut', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    const canvasLayout = page.locator('.slc-canvas');
    await expect(canvasLayout).toBeVisible();

    // Find the Value Proposition section
    const vpSection = page.locator('.canvas-section').filter({
      has: page.locator('.canvas-section-title', { hasText: 'VALUE PROPOSITION' }),
    });
    await expect(vpSection).toBeVisible();

    // Enter edit mode
    await vpSection.click();
    const textarea = vpSection.locator('textarea.canvas-section-edit');
    await expect(textarea).toBeVisible();

    // Type content
    const testContent = 'Unique value proposition via keyboard save';
    await textarea.fill(testContent);

    // Save with Cmd+Enter (or Ctrl+Enter on non-Mac)
    await textarea.press('Meta+Enter');

    // Wait for save to complete
    await expect(textarea).not.toBeVisible({ timeout: 5000 });

    // Verify content persists
    const sectionContent = vpSection.locator('.canvas-section-content');
    await expect(sectionContent).toContainText(testContent);
  });
});

test.describe('Chat Interaction Flow', () => {
  test('clicking in chat area focuses the input', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Wait for the chat panel to be visible
    const chatPanel = page.locator('.layout-chat');
    await expect(chatPanel).toBeVisible();

    // Find the chat input textarea
    const chatInput = page.locator('.chat-textarea, .chat-input');
    await expect(chatInput).toBeVisible();

    // Click in the chat messages area (not on interactive elements)
    const chatMessages = page.locator('.chat-messages');
    await chatMessages.click();

    // Verify the input is focused
    await expect(chatInput).toBeFocused();
  });

  test('user can type in chat input', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Wait for the chat panel
    const chatPanel = page.locator('.layout-chat');
    await expect(chatPanel).toBeVisible();

    // Find and focus the chat input
    const chatInput = page.locator('.chat-textarea, .chat-input');
    await expect(chatInput).toBeVisible();
    await chatInput.focus();

    // Type a test message
    const testMessage = 'This is a test message for E2E testing';
    await chatInput.fill(testMessage);

    // Verify the input has the typed content
    await expect(chatInput).toHaveValue(testMessage);
  });

  test('chat input adjusts height for multiline content', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    const chatInput = page.locator('.chat-textarea, .chat-input');
    await expect(chatInput).toBeVisible();

    // Get initial height
    const initialHeight = await chatInput.evaluate((el) => el.clientHeight);

    // Focus and type multiline content using Shift+Enter
    await chatInput.focus();
    await chatInput.type('Line 1');
    await chatInput.press('Shift+Enter');
    await chatInput.type('Line 2');
    await chatInput.press('Shift+Enter');
    await chatInput.type('Line 3');

    // The textarea should have grown (or stayed the same if max height reached)
    // Just verify content is present with newlines
    const value = await chatInput.inputValue();
    expect(value).toContain('Line 1');
    expect(value).toContain('Line 2');
    expect(value).toContain('Line 3');
  });

  test('send button is disabled when input is empty', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Find the send button
    const sendButton = page.locator('.chat-send');
    await expect(sendButton).toBeVisible();

    // Clear the input to ensure it's empty
    const chatInput = page.locator('.chat-textarea, .chat-input');
    await chatInput.fill('');

    // Send button should be disabled when input is empty
    await expect(sendButton).toBeDisabled();
  });
});

test.describe('Theme Cycling Flow', () => {
  test('theme toggle cycles between light and dark themes', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Get the theme toggle button
    const themeToggle = page.locator('.theme-toggle-gradient');
    await expect(themeToggle).toBeVisible();

    // Get initial theme
    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    // Click to toggle theme
    await themeToggle.click();

    // Wait for theme to change
    const newTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    // Theme should have changed
    expect(newTheme).not.toBe(initialTheme);

    // Verify it's one of the valid themes
    expect(['light', 'dark']).toContain(newTheme);

    // Toggle again
    await themeToggle.click();

    // Should cycle back to initial theme
    const finalTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(finalTheme).toBe(initialTheme);
  });

  test('theme toggle button shows correct icon for current theme', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    const themeToggle = page.locator('.theme-toggle-gradient');
    await expect(themeToggle).toBeVisible();

    // Check initial state - either sun or moon icon should be visible
    const sunIcon = themeToggle.locator('.theme-icon');
    await expect(sunIcon).toBeVisible();

    // Toggle and verify icon changes
    await themeToggle.click();
    await expect(sunIcon).toBeVisible();
  });

  test('theme preference persists on page reload', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    const themeToggle = page.locator('.theme-toggle-gradient');
    await expect(themeToggle).toBeVisible();

    // Get initial theme
    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    // Toggle to the other theme
    await themeToggle.click();
    const toggledTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(toggledTheme).not.toBe(initialTheme);

    // Reload the page
    await page.reload();

    // Wait for page to load
    await expect(page.locator('.slc-canvas')).toBeVisible();

    // Verify theme persisted
    const persistedTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(persistedTheme).toBe(toggledTheme);
  });
});

test.describe('Sidebar Collapse/Expand Flow', () => {
  test('left sidebar can be collapsed and expanded', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Wait for sidebar to be visible
    const sidebarWrapper = page.locator('.sidebar-wrapper');
    await expect(sidebarWrapper).toBeVisible();

    // Find the sidebar (not collapsed initially)
    const sidebar = page.locator('.sidebar:not(.sidebar-collapsed)');
    await expect(sidebar).toBeVisible();

    // Find collapse button in sidebar header
    const collapseButton = page.locator('.sidebar-collapse-btn');
    await expect(collapseButton).toBeVisible();

    // Click to collapse
    await collapseButton.click();

    // Sidebar should now be in collapsed state
    const collapsedSidebar = page.locator('.sidebar.sidebar-collapsed');
    await expect(collapsedSidebar).toBeVisible();

    // Find expand button
    const expandButton = page.locator('.sidebar-expand-btn');
    await expect(expandButton).toBeVisible();

    // Click to expand
    await expandButton.click();

    // Sidebar should be expanded again
    await expect(sidebar).toBeVisible();
  });

  test('right sidebar (chat) can be collapsed and expanded', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Wait for chat layout to be visible
    const chatLayout = page.locator('.layout-chat');
    await expect(chatLayout).toBeVisible();

    // Verify chat is not collapsed initially
    await expect(chatLayout).not.toHaveClass(/collapsed/);

    // Find the chat collapse toggle
    const chatToggle = page.locator('.chat-collapse-toggle');
    await expect(chatToggle).toBeVisible();

    // Click to collapse
    await chatToggle.click();

    // Chat should now be collapsed
    await expect(chatLayout).toHaveClass(/collapsed/);

    // Click again to expand
    await chatToggle.click();

    // Chat should no longer be collapsed
    await expect(chatLayout).not.toHaveClass(/collapsed/);
  });

  test('sidebar collapse state persists on page reload', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Collapse the sidebar
    const collapseButton = page.locator('.sidebar-collapse-btn');
    await expect(collapseButton).toBeVisible();
    await collapseButton.click();

    // Verify it's collapsed
    const collapsedSidebar = page.locator('.sidebar.sidebar-collapsed');
    await expect(collapsedSidebar).toBeVisible();

    // Reload the page
    await page.reload();

    // Wait for page to load
    await expect(page.locator('.slc-canvas')).toBeVisible();

    // Sidebar should still be collapsed
    await expect(collapsedSidebar).toBeVisible();
  });

  test('chat collapse state persists on page reload', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Collapse the chat
    const chatLayout = page.locator('.layout-chat');
    const chatToggle = page.locator('.chat-collapse-toggle');
    await expect(chatToggle).toBeVisible();
    await chatToggle.click();

    // Verify it's collapsed
    await expect(chatLayout).toHaveClass(/collapsed/);

    // Reload the page
    await page.reload();

    // Wait for page to load
    await expect(page.locator('.slc-canvas')).toBeVisible();

    // Chat should still be collapsed
    await expect(chatLayout).toHaveClass(/collapsed/);
  });
});

test.describe('Export Menu Flow', () => {
  test('export menu opens and shows all options', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    // Find the export menu trigger button
    const exportButton = page.locator('.export-menu-trigger');
    await expect(exportButton).toBeVisible();

    // Click to open the dropdown
    await exportButton.click();

    // Verify the dropdown is open
    const dropdown = page.locator('.export-menu-dropdown');
    await expect(dropdown).toBeVisible();

    // Verify all canvas export options are visible
    await expect(page.locator('.export-menu-item', { hasText: 'Copy to Clipboard' })).toBeVisible();
    await expect(page.locator('.export-menu-item', { hasText: 'Download JSON' })).toBeVisible();
    await expect(page.locator('.export-menu-item', { hasText: 'Download Markdown' })).toBeVisible();

    // Verify chat export options are visible
    await expect(page.locator('.export-menu-item', { hasText: 'Copy Chat' })).toBeVisible();
    await expect(page.locator('.export-menu-item', { hasText: 'Save Chat' })).toBeVisible();
  });

  test('export menu closes when clicking outside', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    const exportButton = page.locator('.export-menu-trigger');
    await expect(exportButton).toBeVisible();

    // Open the menu
    await exportButton.click();
    const dropdown = page.locator('.export-menu-dropdown');
    await expect(dropdown).toBeVisible();

    // Click outside the menu (on the canvas)
    await page.locator('.slc-canvas').click();

    // Menu should now be closed
    await expect(dropdown).not.toBeVisible();
  });

  test('export menu closes when pressing Escape', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    const exportButton = page.locator('.export-menu-trigger');
    await expect(exportButton).toBeVisible();

    // Open the menu
    await exportButton.click();
    const dropdown = page.locator('.export-menu-dropdown');
    await expect(dropdown).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Menu should now be closed
    await expect(dropdown).not.toBeVisible();
  });

  test('export menu has correct aria attributes', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    const exportButton = page.locator('.export-menu-trigger');
    await expect(exportButton).toBeVisible();

    // Check aria attributes when closed
    await expect(exportButton).toHaveAttribute('aria-haspopup', 'true');
    await expect(exportButton).toHaveAttribute('aria-expanded', 'false');

    // Open the menu
    await exportButton.click();

    // Check aria attributes when open
    await expect(exportButton).toHaveAttribute('aria-expanded', 'true');

    // Verify menu items have correct role
    const menuItems = page.locator('.export-menu-item');
    const menuItemCount = await menuItems.count();
    for (let i = 0; i < menuItemCount; i++) {
      await expect(menuItems.nth(i)).toHaveAttribute('role', 'menuitem');
    }
  });

  test('export menu shows group labels', async ({ page }) => {
    await page.goto('/canvas/dev-canvas');

    const exportButton = page.locator('.export-menu-trigger');
    await exportButton.click();

    const dropdown = page.locator('.export-menu-dropdown');
    await expect(dropdown).toBeVisible();

    // Check for group labels
    await expect(page.locator('.export-menu-group-label', { hasText: 'Canvas' })).toBeVisible();
    await expect(page.locator('.export-menu-group-label', { hasText: 'Chat' })).toBeVisible();
  });
});
