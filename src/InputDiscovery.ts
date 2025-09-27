import type { Page, Locator } from "@playwright/test";
import type { DiscoveredFeature } from "./types";
import { SelectorUtils } from "./SelectorUtils";

/**
 * Specialized class for discovering input elements
 * Single Responsibility: Input element discovery and form analysis
 */
export class InputDiscovery {
  private selectorUtils: SelectorUtils;
  private visitedSelectors = new Set<string>();

  constructor(private page: Page) {
    this.selectorUtils = new SelectorUtils(page);
  }

  async discoverInputs(): Promise<DiscoveredFeature[]> {
    console.log("📝 Discovering inputs...");

    const inputSelectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="password"]',
      'input[type="number"]',
      'input[type="search"]',
      'input[type="tel"]',
      'input[type="url"]',
      'input[type="date"]',
      'input[type="time"]',
      'input[type="datetime-local"]',
      'input[type="checkbox"]',
      'input[type="radio"]',
      'input[type="range"]',
      "textarea",
      "select",
      '[contenteditable="true"]',
    ];

    const discoveredInputs: DiscoveredFeature[] = [];

    for (const selector of inputSelectors) {
      const elements = await this.page.locator(selector).all();

      for (const element of elements) {
        const input = await this.analyzeInput(element);
        if (input) {
          discoveredInputs.push(input);
        }
      }
    }

    console.log(`  ✓ Found ${discoveredInputs.length} inputs`);
    return discoveredInputs;
  }

  private async analyzeInput(element: Locator): Promise<DiscoveredFeature | null> {
    try {
      const uniqueSelector = await this.selectorUtils.getUniqueSelector(element);
      if (this.visitedSelectors.has(uniqueSelector)) return null;

      const isVisible = await element.isVisible({ timeout: 1000 });
      if (!isVisible) return null;

      const placeholder = await element.getAttribute("placeholder");
      const label = await this.selectorUtils.findLabelForInput(element);
      const type = (await element.getAttribute("type")) || "text";
      const name = await element.getAttribute("name");
      const id = await element.getAttribute("id");

      const feature: DiscoveredFeature = {
        name: label || placeholder || name || id || `Input (${type})`,
        type: "input",
        selector: uniqueSelector,
        inputType: type, // Add explicit inputType field
        attributes: {
          type: type,
          placeholder: placeholder || "",
          name: name || "",
          id: id || "",
        },
        actions: this.getInputActions(type),
      };

      this.visitedSelectors.add(uniqueSelector);
      console.log(`  ✓ Found input: ${feature.name}`);

      return feature;
    } catch (e) {
      return null;
    }
  }

  private getInputActions(type: string): string[] {
    switch (type) {
      case "checkbox":
      case "radio":
        return ["check", "uncheck", "click"];
      case "range":
        return ["fill", "drag"];
      case "file":
        return ["setInputFiles"];
      default:
        return ["fill", "clear", "focus", "blur"];
    }
  }

  getTestValueForInput(type: string): string {
    switch (type) {
      case "email":
        return "test@example.com";
      case "password":
        return "TestPassword123!";
      case "number":
        return "42";
      case "tel":
        return "+1234567890";
      case "url":
        return "https://example.com";
      case "date":
        return "2024-01-01";
      case "time":
        return "12:00";
      case "search":
        return "test search query";
      default:
        return "Test Value";
    }
  }
}
