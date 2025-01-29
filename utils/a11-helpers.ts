import { test, expect, type Page } from '@playwright/test';
type Role = Parameters<Page['getByRole']>[0];

/**
 * Asserts that an element with specified role and name is currently focused
 * @param page - Playwright Page object
 * @param role - ARIA role of the element
 * @param name - Accessible name of the element
 * @throws Error if the element is not found or not focused
 */
export async function assertElementFocused(page: Page, role: Role, name: string | RegExp): Promise<void> {
    // Find the element expected to be focused.
    const element = page.getByRole(role, { name: name });
    
    try {
        await element.waitFor({ state: 'attached', timeout: 5000 });
    } catch (error) {
        throw new Error(`Element with role "${role}" and name "${name}" not found on page.`);
    }

    // Check which element is CURRENTLY focused.
    const focusedElement = await page.evaluate(() => {
        const focused = document.activeElement;
        return {
            role: focused?.getAttribute('role'),
            name: focused?.getAttribute('aria-label') || 
                  focused?.getAttribute('name') ||
                  focused?.textContent?.trim()
        };
    });

    const elementAttrs = await element.evaluate((el) => {
        return {
            role: el.getAttribute('role'),
            name: el.getAttribute('aria-label') ||
                  el.getAttribute('name') ||
                  el.textContent?.trim()
        };
    });

    if (!(focusedElement.role === elementAttrs.role && focusedElement.name === elementAttrs.name)) {
        throw new Error(
            `Expected element with role "${role}" and name "${name}" to be focused\n` +
            `Actually focused element: role="${focusedElement.role}", name="${focusedElement.name}"`
        );
    }
}

/**
 * Presses Tab key until reaching an element with specified role and name
 * @param page - Playwright Page object
 * @param role - ARIA role of the target element
 * @param name - Accessible name of the target element
 * @param maxTabs - Maximum number of Tab presses before giving up (default: 20)
 * @throws Error if element is not found after maximum number of tabs
 */
export async function tabToElement(page: Page, role: Role, name: string | RegExp, maxTabs = 20): Promise<void> {
    for (let i = 0; i < maxTabs; i++) {
        try {
            await assertElementFocused(page, role, name);
            return;
        } catch {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(100);
        }
    }
    throw new Error(
        `Failed to reach element with role "${role}" and name "${name}" ` +
        `after ${maxTabs} Tab presses. Focused element ${getFocusedElementInfo(page)}`
    );
}

async function getFocusedElementInfo(page: Page) {
    const focusedInfo = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;

        // Get the name of the element, truncate if needed.
        let name = el.getAttribute("aria-label") ||
            el.textContent?.trim() ||
            el.getAttribute("title") ||
            el.getAttribute("placeholder") ||
            "No name";
        if (name) {
            name = truncateText(name)
        }

        return {
            tag: el.tagName.toLowerCase(),
            role: el.getAttribute("role") || el.role || "No role",
            name:
                el.getAttribute("aria-label") ||
                el.textContent?.trim() ||
                el.getAttribute("title") ||
                el.getAttribute("placeholder") ||
                "No name",
        };
    });
    return JSON.stringify(focusedInfo);
}

function truncateText(text: string, maxLength: number = 100): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}
