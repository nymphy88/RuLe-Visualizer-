import { test, expect } from '@playwright/test';

test.describe('Verify Sync Feature', () => {
  test('should render the main page, all node buttons, and verify sync feature', async ({ page }) => {
    // Listen for all console events and log them to the test output
    page.on('console', async msg => {
      const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
      console.log(`Browser Console [${msg.type()}]:`, ...args);
    });

    await page.goto('http://localhost:5173/');

    // Verify the main app container is visible
    await expect(page.locator('.app-container')).toBeVisible();
    console.log('Main app container is visible.');

    // Verify all 6 node buttons are present
    await expect(page.locator('button:has-text("Add Object Node")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Logic Node")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Print Node")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Player Node")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Math Node")')).toBeVisible();
    await expect(page.locator('button:has-text("Add If-Else Logic Node")')).toBeVisible();
    console.log('All 6 node buttons are visible.');

    // Verify the sync button and textarea
    const syncButton = page.locator('button:has-text("Start Sync")');
    await expect(syncButton).toBeVisible();
    console.log('Sync button is visible.');

    const collabTextarea = page.locator('.collaboration-input');
    await expect(collabTextarea).toHaveValue('');
    console.log('Collaboration textarea is initially empty.');

    // Start sync and verify
    await syncButton.click();
    await expect(page.locator('button:has-text("Stop Sync")')).toBeVisible();
    console.log('Sync started, button text updated.');

    // Wait for the polling to occur and update the textarea
    await page.waitForFunction(() => document.querySelector('.collaboration-input').value.length > 0, { timeout: 5000 });

    const textareaValue = await collabTextarea.inputValue();
    expect(textareaValue.length).toBeGreaterThan(0);
    console.log('Collaboration textarea is populated after sync.');

    // Capture a screenshot for visual confirmation
    await page.screenshot({ path: 'frontend/tests/verification-screenshot.png' });
    console.log('Screenshot captured.');
  });
});
