import { test, expect } from '@playwright/test';
const { assertElementFocused, logFocusedElement, tabToElement } = require('../utils/a11y-helpers');


test.describe('playwright.dev Keyboard Navigation Accessibility Test', () => {
  test('perform steps using only keyboard navigation and check focus', async ({ page }) => {
      // Capture BROWSER console logs - FOR DEBUGGING.
      const messages: string[] = []; // Array to store console messages
      page.on('console', (msg) => {
        messages.push(msg.text()); // Add the message text to the array
        console.log(`Browser: ${msg.text()}`); // Optionally log to your Node.js console
      });

      // Open the page.
      await page.goto('https://playwright.dev');

      // Tab to combobox starting with 'Search ', since it's different on MacOS and Windows.
      await tabToElement(page, 'button', /^Search /);

      // Search for 'accessibility': type the string and press ENTER.
      await page.keyboard.type('accessibility', { delay: 100 });
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');

      // Verify new page with results has loaded - check page title.
      await expect(page).toHaveTitle('Accessibility | Playwright');

      // TAB to the 'Skip to main content' link. Log intermediate focused elements - for debugging.
      await tabToElement(page, 'link', 'Skip to main content', 10, /* logIntermediateElements = */ true);
      await page.keyboard.press('Enter');

      // Press TAB and verify next element is 'Home page' link.
      // This way you can verify the sequence of elements on the page.
      await page.keyboard.press('Tab');
      await logFocusedElement(page);

      await assertElementFocused(page, 'link', 'Home page');

      // Shorter way to verify next element - TAB max 1 times.
      await tabToElement(page, 'link', 'screen readers', /* maxTabs = */ 1);
  });
});
