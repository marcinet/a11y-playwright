import { test, expect } from '@playwright/test';
const { assertElementFocused, tabToElement } = require('../utils/a11y-helpers');

test.describe('Google Search Accessibility Test', () => {
  test('should perform search using only keyboard navigation', async ({ page }) => {
      //NOTE: this might not work since google.com detects automation
      // and wants you to prove you're not a robot. Use another website to test.

      await page.goto('https://www.google.com');
      // Verify element with role 'combobox' and name 'Search' is focused.
      await assertElementFocused(page, 'combobox', 'Search');
      await page.keyboard.type('How to create accessible websites', { delay: 100 });
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');

      // Verify new page with results has loaded - check page title.
      await expect(page).toHaveTitle('How to create accessible websites - Google Search');

      // Tab to special a11y link and skip to main content.
      await tabToElement(page, 'link', 'Skip to main content');
      await page.keyboard.press('Enter');

      // Verify we are in main content.
      await assertElementFocused(page, 'heading', 'Ten Tips for an Accessible Website');
  });
});
