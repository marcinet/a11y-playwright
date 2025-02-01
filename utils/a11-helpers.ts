import { type Page , } from '@playwright/test';

type Role = Parameters<Page['getByRole']>[0];
const WAIT_BETWEEN_TABS_MS=200;

/**
 * Asserts that an element with specified role and name is currently focused
 * @param page - Playwright Page object
 * @param expectedRole - ARIA role of the element
 * @param expectedName - Accessible name of the element
 * @throws Error if the element is not found or not focused
 */
export async function assertElementFocused(page: Page, expectedRole: Role, expectedName: string | RegExp): Promise<void> {
    // Find the element expected to be focused.
    const expectedElement = page.getByRole(expectedRole, { name: expectedName });
    
    try {
        await expectedElement.waitFor({ state: 'attached', timeout: 10000 });
    } catch (error) {
        throw new Error(`Element with role "${expectedRole}" and name "${expectedName}" not found on page.`);
    }

    // Check which element is CURRENTLY focused.
    const focusedElementInfo = await getFocusedElementInfo(page);
    if (!focusedElementInfo) {
        throw new Error("No focused element");
    }

    // Shorten the name if too long to avoid polluting the logs - especially if root element is focused.
    const shortName = focusedElementInfo?.name?.length > 100 ? focusedElementInfo?.name?.slice(97) + "...": focusedElementInfo?.name;
   
    // Compare the the roles and names, name can be a regexp. 
    if (
        focusedElementInfo?.role === expectedRole &&
        (expectedName instanceof RegExp
            ? expectedName.test(focusedElementInfo?.name || "")
            : focusedElementInfo?.name === expectedName)
    ) {
        return;
    }

    // Comparison failed.
    throw new Error(
        `Expected element with role "${expectedRole}" and name "${expectedName}" to be focused\n` +
        `Actually focused element: role="${focusedElementInfo?.role}", name="${shortName}`
    );
}

/**
 * Presses TAB key until reaching an element with specified `role` and `name`
 * @param page - Playwright Page object
 * @param role - ARIA role of the target element
 * @param name - Accessible name of the target element
 * @param maxTabs - Maximum number of Tab presses before giving up (default: 10)
 * @param logIntermediateElements - Dump info of every currently focused element while tabbing
 * @param waitBetweenTabsMs - time (in ms) to wait between tabs, by default WAIT_BETWEEN_TABS_MS
 * @throws Error if element is not found after maximum number of tabs
 */
export async function tabToElement(page: Page, role: Role, name: string | RegExp, maxTabs = 15, logIntermediateElements: boolean = false, waitBetweenTabsMs = WAIT_BETWEEN_TABS_MS): Promise<void> {
    for (let i = 0; i < maxTabs; i++) {
        try {
            // Press TAB and wait a bit.
            await page.keyboard.press('Tab');
            await page.waitForTimeout(waitBetweenTabsMs);

            await assertElementFocused(page, role, name);
            return;
        } catch {
            if (logIntermediateElements) {
                await logFocusedElement(page);
            }
        }
    }

    throw new Error(
        `Failed to reach element with role "${role}" and name "${name}" ` +
        `after ${maxTabs} Tab presses. Focused element: ${await getFormattedFocusedElementInfo(page)}`
    );
}

/**
 * Get the currently focused element and compute its tag, accessible role and name.
 * @param page - Playwright Page object
 * @returns Dictionary with tag, role and name, or null if no element is focused.
 */
async function getFocusedElementInfo(page: Page) {
    const focusedInfo = await page.evaluate(() => {

        // Helper method for evaluating COMPUTED role of the element.
        function getComputedAriaRole(el: Element | null): string {
            if (!el) {
                return "No role";
            }

            // Check explicitly set ARIA role
            const role: string | null = el.getAttribute("role");
            if (role) return role;

            // Map native elements to their implicit roles
            const tagRoleMap: Record<string, string> = {
                "a": "link",
                "button": "button",
                "input": "textbox",
                "textarea": "textbox",
                "select": "combobox",
                "header": "banner",
                "footer": "contentinfo",
                "main": "main",
                "nav": "navigation",
                "section": "region",
                "table": "table",
                "tr": "row",
                "td": "cell",
                "th": "columnheader",
            };
            return tagRoleMap[el.tagName.toLowerCase()] || "No role";
        }

        // Get the focused element from the browser.
        const el = document.activeElement;
        if (!el) return null;

        // Get the name of the element.
        let accessibleName = "";

        const labelledByIds = el.getAttribute("aria-labelledby");
        if (labelledByIds) {
            // If the element labelled name is labelled by another.
            const labelledByElements = labelledByIds
                .split(" ")
                .map(id => document.getElementById(id))
                .filter(Boolean);

            accessibleName = labelledByElements
                .map(el => el?.textContent?.trim())
                .filter(Boolean)
                .join(" ");
        } else {
            // Use aria-label or other fallback names.
            accessibleName =
                el.getAttribute("aria-label") ||
                el.textContent?.trim() ||
                el.getAttribute("title") ||
                el.getAttribute("placeholder") ||
                    "No name";
        }

        return {
            tag: el.tagName.toLowerCase(),
            role: getComputedAriaRole(el),
            name: accessibleName,
        };
    });
    return focusedInfo;
}

function truncateText(text: string | null, maxLength: number = 100): string {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
}

/**
 * Log currently focused element info: tag, accessible name and role.
 * Truncate the name to max 100 characters, since when root element is focused element name is the whole page content.
 */
export async function logFocusedElement(page: Page) {
    const focusedInfo = await getFocusedElementInfo(page);
    if (!focusedInfo) {
        console.log("No focused element");
        return;
    } ;

    const focusedInfoForLogging = {
        tag: focusedInfo?.tag,
        role: focusedInfo?.role,
        name: truncateText(focusedInfo?.name),
    };
    console.log("Current focus:", JSON.stringify(focusedInfoForLogging));
}

/**
 * Get nicely formatted element info for logging.
 */
async function getFormattedFocusedElementInfo(page: Page) {
    const elementInfo = await getFocusedElementInfo(page);
    return JSON.stringify(elementInfo);
}
