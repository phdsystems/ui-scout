import type { Page, Locator } from "@playwright/test";
import type { DiscoveredFeature } from "./types";
import { SelectorUtils } from "./SelectorUtils";

/**
 * Specialized class for discovering button elements
 * Single Responsibility: Button element discovery and analysis
 */
export class ButtonDiscovery {
  private selectorUtils: SelectorUtils;
  private visitedSelectors = new Set<string>();

  constructor(private page: Page) {
    this.selectorUtils = new SelectorUtils(page);
  }

  async discoverButtons(): Promise<DiscoveredFeature[]> {
    console.log("🔘 Discovering buttons...");

    const buttonSelectors = [
      "button",
      '[role="button"]',
      "a.btn",
      "a.button",
      '[class*="button"]',
      '[class*="btn"]',
      'input[type="button"]',
      'input[type="submit"]',
      "[onclick]",
    ];

    const discoveredButtons: DiscoveredFeature[] = [];

    for (const selector of buttonSelectors) {
      const elements = await this.page.locator(selector).all();

      for (const element of elements) {
        const button = await this.analyzeButton(element);
        if (button) {
          discoveredButtons.push(button);
        }
      }
    }

    console.log(`  ✓ Found ${discoveredButtons.length} buttons`);
    return discoveredButtons;
  }

  private async analyzeButton(element: Locator): Promise<DiscoveredFeature | null> {
    try {
      const uniqueSelector = await this.selectorUtils.getUniqueSelector(element);
      if (this.visitedSelectors.has(uniqueSelector)) return null;

      const isVisible = await element.isVisible({ timeout: 1000 });
      if (!isVisible) return null;

      const text = (await element.textContent()) || "";
      const title = await element.getAttribute("title");
      const ariaLabel = await element.getAttribute("aria-label");
      const className = await element.getAttribute("class");

      const feature: DiscoveredFeature = {
        name: text || title || ariaLabel || "Unnamed Button",
        type: "button",
        selector: uniqueSelector,
        text: text,
        attributes: {
          title: title || "",
          "aria-label": ariaLabel || "",
          class: className || "",
        },
        actions: ["click", "hover", "focus"],
      };

      this.visitedSelectors.add(uniqueSelector);
      console.log(`  ✓ Found button: ${feature.name}`);

      return feature;
    } catch (e) {
      return null;
    }
  }

  async discoverTooltips(buttons: DiscoveredFeature[]): Promise<void> {
    console.log("  📋 Discovering button tooltips...");

    for (const button of buttons.slice(0, 10)) {
      // Limit to avoid too many interactions
      try {
        const element = this.page.locator(button.selector);
        if (await element.isVisible()) {
          await element.hover();

          const tooltip = await this.page
            .locator('[role="tooltip"], .tooltip, [class*="tooltip"]')
            .first();
          if (await tooltip.isVisible({ timeout: 500 })) {
            const tooltipText = await tooltip.textContent();
            console.log(`    Found tooltip: ${tooltipText}`);
            button.attributes = { ...button.attributes, tooltip: tooltipText || "" };
          }
        }
      } catch (e) {
        // Continue with other elements
      }
    }
  }
}
