import { test, expect } from '@playwright/test';

test('Logic node handles mixed types gracefully', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Use a file chooser to upload the test configuration
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Load Config' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('frontend/test_config.json');

  // Wait for the graph to settle and polling to occur
  await page.waitForTimeout(2000);

  // Find the PrintNode and check its output
  const printNode = page.locator('.react-flow__node-print');
  await expect(printNode).toBeVisible();

  // Find the textarea within the PrintNode and verify its value
  const textarea = printNode.locator('textarea');
  await expect(textarea).toHaveValue('error');

  // Take a screenshot for verification
  await page.screenshot({ path: 'frontend/tests/error_handling_test.png' });
});
