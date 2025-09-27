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

      // Fallback: try to get a more specific selector with parent context
      const tagName = await element
        .evaluate((el: HTMLElement) => el.tagName.toLowerCase())
        .catch(() => "button");

      // Try to find a unique parent container
      const parentSelector = await element
        .evaluate((el: HTMLElement) => {
          let current = el.parentElement;
          while (current) {
            // Look for containers with meaningful classes or IDs
            if (current.id) return `#${current.id}`;
            if (current.classList.length > 0) {
              const classes = Array.from(current.classList);
              const meaningfulClasses = classes.filter(
                (c) =>
                  c.includes("nav") ||
                  c.includes("menu") ||
                  c.includes("toolbar") ||
                  c.includes("panel") ||
                  c.includes("container") ||
                  c.includes("header"),
              );
              if (meaningfulClasses.length > 0) {
                return `.${meaningfulClasses[0]}`;
              }
            }
            current = current.parentElement;
          }
          return null;
        })
        .catch(() => null);

      if (parentSelector) {
        // Get position within the parent container
        const indexInParent = await element
          .evaluate((el: HTMLElement, parentSel: string) => {
            const parent = document.querySelector(parentSel);
            if (!parent) return 0;
            const siblings = Array.from(parent.querySelectorAll(el.tagName));
            return siblings.indexOf(el);
          }, parentSelector)
          .catch(() => 0);

        return `${parentSelector} ${tagName}:nth-of-type(${indexInParent + 1})`;
      }

      // Last resort: use title, aria-label, or text as attribute selector
      const title = await element.getAttribute("title").catch(() => null);
      const ariaLabel = await element.getAttribute("aria-label").catch(() => null);
      const textContent = await element.textContent().catch(() => "");

      if (title) return `${tagName}[title="${title}"]`;
      if (ariaLabel) return `${tagName}[aria-label="${ariaLabel}"]`;
      if (textContent && textContent.length < 30) {
        return `${tagName}:has-text("${textContent.trim()}")`;
      }

      // Final fallback - this should rarely be reached now
      return `${tagName}:first-of-type`;
    } catch (e) {
      // Return a basic selector as fallback
      return "button:first-of-type";
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
      const cleanText = text.trim();
      if (cleanText.length === 0) return null;

      // Try full text first if it's reasonable length
      if (cleanText.length <= 50) {
        const selector = `${tagName}:has-text("${cleanText}")`;
        const count = await this.page.locator(selector).count();
        if (count === 1) return selector;
      }

      // Try first 20 characters if full text isn't unique
      if (cleanText.length > 10) {
        const shortText = cleanText.substring(0, 20);
        const selector = `${tagName}:has-text("${shortText}")`;
        const count = await this.page.locator(selector).count();
        if (count === 1) return selector;
      }
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
