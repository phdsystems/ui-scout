import type { Page, Locator } from "@playwright/test";

/**
 * Utility class for generating unique selectors for elements
 * Single Responsibility: Element selector generation and validation
 */
export class SelectorUtils {
  constructor(private page: Page) {}

  async getUniqueSelector(element: Locator): Promise<string> {
    try {
      // Priority 1: data-testid
      const testId = await element.getAttribute("data-testid");
      if (testId) return `[data-testid="${testId}"]`;

      // Priority 2: unique id
      const id = await element.getAttribute("id");
      if (id) return `#${id}`;

      // Priority 3: unique class combination
      const uniqueClassSelector = await this.getUniqueClassSelector(element);
      if (uniqueClassSelector) return uniqueClassSelector;

      // Priority 4: role + aria-label
      const roleSelector = await this.getRoleSelector(element);
      if (roleSelector) return roleSelector;

      // Priority 5: text content for interactive elements
      const textSelector = await this.getTextSelector(element);
      if (textSelector) return textSelector;

      // Fallback: element toString
      return element.toString();
    } catch (e) {
      return element.toString();
    }
  }

  private async getUniqueClassSelector(element: Locator): Promise<string | null> {
    const className = await element.getAttribute("class");
    if (!className) return null;

    const classes = className.split(" ").filter((c) => c && !c.includes(":"));
    if (classes.length === 0) return null;

    const selector = "." + classes.join(".");
    const count = await this.page.locator(selector).count();
    return count === 1 ? selector : null;
  }

  private async getRoleSelector(element: Locator): Promise<string | null> {
    const role = await element.getAttribute("role");
    const ariaLabel = await element.getAttribute("aria-label");

    if (role && ariaLabel) {
      return `[role="${role}"][aria-label="${ariaLabel}"]`;
    }
    return null;
  }

  private async getTextSelector(element: Locator): Promise<string | null> {
    const tagName = await element.evaluate((el: HTMLElement) => el.tagName.toLowerCase());
    const text = await element.textContent();

    if (text && (tagName === "button" || tagName === "a")) {
      return `${tagName}:has-text("${text.substring(0, 30)}")`;
    }
    return null;
  }

  async findLabelForInput(element: Locator): Promise<string> {
    try {
      // Check for associated label by id
      const id = await element.getAttribute("id");
      if (id) {
        const label = await this.page.locator(`label[for="${id}"]`).textContent();
        if (label) return label;
      }

      // Check for parent label
      const parentLabel = await element.locator("xpath=ancestor::label").first().textContent();
      if (parentLabel) return parentLabel;

      // Check for aria-label
      const ariaLabel = await element.getAttribute("aria-label");
      if (ariaLabel) return ariaLabel;

      // Check for nearby label
      const previousLabel = await element
        .locator("xpath=preceding-sibling::label")
        .first()
        .textContent();
      if (previousLabel) return previousLabel;

      return "";
    } catch (e) {
      return "";
    }
  }
}
