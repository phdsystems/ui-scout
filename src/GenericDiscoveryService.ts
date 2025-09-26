import type { IPageDriver } from "./interfaces/IPageDriver";
import type { DiscoveredFeature } from "./types";

/**
 * Framework-agnostic discovery service
 * Can work with ANY testing framework through the IPageDriver interface
 */
export class GenericDiscoveryService {
  constructor(private driver: IPageDriver) {}

  async discoverAllFeatures(): Promise<DiscoveredFeature[]> {
    console.log("🔍 Starting feature discovery (framework-agnostic)...\n");

    const features: DiscoveredFeature[] = [];

    // Discover buttons
    features.push(...(await this.discoverButtons()));

    // Discover inputs
    features.push(...(await this.discoverInputs()));

    // Discover navigation
    features.push(...(await this.discoverNavigation()));

    console.log(`✅ Found ${features.length} features total\n`);
    return features;
  }

  private async discoverButtons(): Promise<DiscoveredFeature[]> {
    const buttonSelectors = [
      "button",
      '[role="button"]',
      "a.btn",
      "a.button",
      '[class*="button"]',
      'input[type="button"]',
      'input[type="submit"]',
    ];

    const discovered: DiscoveredFeature[] = [];

    for (const selector of buttonSelectors) {
      const elements = await this.driver.locator(selector).all();

      for (const element of elements) {
        const isVisible = await element.isVisible({ timeout: 1000 });
        if (!isVisible) continue;

        const text = (await element.textContent()) || "";
        const title = await element.getAttribute("title");
        const ariaLabel = await element.getAttribute("aria-label");

        discovered.push({
          name: text || title || ariaLabel || "Button",
          type: "button",
          selector: selector,
          text: text,
          actions: ["click", "hover"],
        });
      }
    }

    console.log(`  Found ${discovered.length} buttons`);
    return discovered;
  }

  private async discoverInputs(): Promise<DiscoveredFeature[]> {
    const inputSelectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="password"]',
      "textarea",
      "select",
    ];

    const discovered: DiscoveredFeature[] = [];

    for (const selector of inputSelectors) {
      const elements = await this.driver.locator(selector).all();

      for (const element of elements) {
        const isVisible = await element.isVisible({ timeout: 1000 });
        if (!isVisible) continue;

        const placeholder = await element.getAttribute("placeholder");
        const type = (await element.getAttribute("type")) || "text";

        discovered.push({
          name: placeholder || `Input (${type})`,
          type: "input",
          selector: selector,
          attributes: {
            type: type,
            placeholder: placeholder || "",
          },
          actions: ["fill", "clear"],
        });
      }
    }

    console.log(`  Found ${discovered.length} inputs`);
    return discovered;
  }

  private async discoverNavigation(): Promise<DiscoveredFeature[]> {
    const navSelectors = ["nav", '[role="navigation"]', ".menu", ".navbar"];

    const discovered: DiscoveredFeature[] = [];

    for (const selector of navSelectors) {
      const elements = await this.driver.locator(selector).all();

      for (const element of elements) {
        const isVisible = await element.isVisible({ timeout: 1000 });
        if (!isVisible) continue;

        const text = (await element.textContent()) || "";

        discovered.push({
          name: "Navigation",
          type: "menu",
          selector: selector,
          text: text.substring(0, 50),
          actions: ["click", "hover"],
        });
      }
    }

    console.log(`  Found ${discovered.length} navigation elements`);
    return discovered;
  }
}
