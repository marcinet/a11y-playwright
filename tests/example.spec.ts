/**
 * @fileoverview Sample Playwright script for testing accessibility
 * @author Marcin Michalak
 * 
 * Copyright (c) 2025 Marcin Michalak
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

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
