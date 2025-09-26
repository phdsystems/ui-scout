import type { Page } from "@playwright/test";
import type { DiscoveredFeature } from "./types";
import { ButtonDiscovery } from "./ButtonDiscovery";
import { InputDiscovery } from "./InputDiscovery";
import { ComponentDiscovery } from "./ComponentDiscovery";
import { NavigationDiscovery } from "./NavigationDiscovery";

/**
 * Service responsible ONLY for feature discovery
 * Single Responsibility: Discover UI elements and their properties
 */
export class DiscoveryService {
  private buttonDiscovery: ButtonDiscovery;
  private inputDiscovery: InputDiscovery;
  private componentDiscovery: ComponentDiscovery;
  private navigationDiscovery: NavigationDiscovery;

  constructor(private page: Page) {
    this.buttonDiscovery = new ButtonDiscovery(page);
    this.inputDiscovery = new InputDiscovery(page);
    this.componentDiscovery = new ComponentDiscovery(page);
    this.navigationDiscovery = new NavigationDiscovery(page);
  }

  async discoverAllFeatures(): Promise<DiscoveredFeature[]> {
    console.log("🔍 Starting comprehensive feature discovery...\n");
    console.warn(
      "⚠️ Note: discoverAllFeatures() can be slow. Consider using targeted methods like discoverButtons() or discoverEssentials() for better performance.",
    );

    // Discover different types of elements in parallel
    const [
      buttons,
      inputs,
      charts,
      panels,
      modals,
      tables,
      customComponents,
      menus,
      dropdowns,
      tabs,
    ] = await Promise.all([
      this.buttonDiscovery.discoverButtons(),
      this.inputDiscovery.discoverInputs(),
      this.componentDiscovery.discoverCharts(),
      this.componentDiscovery.discoverPanels(),
      this.componentDiscovery.discoverModals(),
      this.componentDiscovery.discoverTables(),
      this.componentDiscovery.discoverCustomComponents(),
      this.navigationDiscovery.discoverMenus(),
      this.navigationDiscovery.discoverDropdowns(),
      this.navigationDiscovery.discoverTabs(),
    ]);

    // Combine all discovered features, handling null/undefined values
    const allFeatures: DiscoveredFeature[] = [];
    const seenSelectors = new Set<string>();

    // Helper to add features with deduplication and validation
    const addFeatures = (features: DiscoveredFeature[] | null | undefined) => {
      if (!features || !Array.isArray(features)) return;

      for (const feature of features) {
        // Skip invalid features
        if (!feature || typeof feature !== "object") continue;
        if (!feature.name || !feature.type || !feature.selector) continue;

        // Skip duplicates based on selector
        if (seenSelectors.has(feature.selector)) continue;

        seenSelectors.add(feature.selector);
        allFeatures.push(feature);
      }
    };

    // Add features in order
    addFeatures(buttons);
    addFeatures(inputs);
    addFeatures(menus);
    addFeatures(panels);
    addFeatures(charts);
    addFeatures(modals);
    addFeatures(tables);
    addFeatures(customComponents);
    addFeatures(dropdowns);
    addFeatures(tabs);

    console.log(`\n✅ Discovery complete! Found ${allFeatures.length} features total\n`);
    return allFeatures;
  }

  async discoverDynamicFeatures(
    existingFeatures: DiscoveredFeature[],
  ): Promise<DiscoveredFeature[]> {
    console.log("🔄 Discovering dynamic features through interaction...");

    const dynamicFeatures: DiscoveredFeature[] = [];

    // Enhance buttons with tooltips
    const buttons = existingFeatures.filter((f) => f.type === "button");
    await this.buttonDiscovery.discoverTooltips(buttons);

    // Try interacting with navigation elements to reveal hidden features
    const navItems = existingFeatures.filter(
      (f) =>
        f.type === "menu" || f.selector.includes("nav") || f.attributes?.class?.includes("nav"),
    );

    for (const nav of navItems.slice(0, 5)) {
      // Limit interactions
      try {
        const element = this.page.locator(nav.selector);

        if (await element.isVisible()) {
          await element.hover();
          await this.page.waitForTimeout(500);

          // Check for newly visible elements
          const newFeatures = await this.checkForDynamicElements();
          dynamicFeatures.push(...newFeatures);
        }
      } catch (e) {
        // Continue with other elements
      }
    }

    return dynamicFeatures;
  }

  private async checkForDynamicElements(): Promise<DiscoveredFeature[]> {
    const discovered: DiscoveredFeature[] = [];
    const dynamicSelectors = [
      ".dropdown-menu:visible",
      ".submenu:visible",
      '[class*="popup"]:visible',
      '[class*="overlay"]:visible',
      '[class*="modal"]:visible',
    ];

    for (const selector of dynamicSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 500 })) {
          const text = (await element.textContent()) || "";
          console.log(`    Discovered dynamic element: ${text.substring(0, 50)}`);

          discovered.push({
            name: text.substring(0, 50) || "Dynamic Element",
            type: "other",
            selector: selector,
            text: text,
            actions: ["click", "screenshot"],
          });
        }
      } catch (e) {
        // Continue checking other selectors
      }
    }

    return discovered;
  }

  // OPTIMIZED METHODS FOR BETTER PERFORMANCE

  /**
   * Discover only buttons - much faster than full discovery
   */
  async discoverButtons(): Promise<DiscoveredFeature[]> {
    return await this.buttonDiscovery.discoverButtons();
  }

  /**
   * Discover only input elements
   */
  async discoverInputs(): Promise<DiscoveredFeature[]> {
    return await this.inputDiscovery.discoverInputs();
  }

  /**
   * Discover only navigation elements (menus, dropdowns, tabs)
   */
  async discoverNavigation(): Promise<DiscoveredFeature[]> {
    const [menus, dropdowns, tabs] = await Promise.all([
      this.navigationDiscovery.discoverMenus(),
      this.navigationDiscovery.discoverDropdowns(),
      this.navigationDiscovery.discoverTabs(),
    ]);

    const combined: DiscoveredFeature[] = [];
    const seenSelectors = new Set<string>();

    const addFeatures = (features: DiscoveredFeature[] | null | undefined) => {
      if (!features) return;
      for (const f of features) {
        if (f && !seenSelectors.has(f.selector)) {
          seenSelectors.add(f.selector);
          combined.push(f);
        }
      }
    };

    addFeatures(menus);
    addFeatures(dropdowns);
    addFeatures(tabs);

    return combined;
  }

  /**
   * Discover only essential interactive elements for quick testing
   * Much faster than full discovery - typically < 2 seconds
   */
  async discoverEssentials(): Promise<DiscoveredFeature[]> {
    console.log("⚡ Running essential discovery (fast mode)...");

    const essentials: DiscoveredFeature[] = [];
    const seenSelectors = new Set<string>();

    // Only get the most important interactive elements
    const selectors = [
      "button:visible",
      '[role="button"]:visible',
      "input:visible",
      "select:visible",
      "textarea:visible",
      "a[href]:visible",
      "[data-testid]:visible",
    ];

    for (const selector of selectors) {
      try {
        const elements = await this.page.locator(selector).all();

        // Limit to first 10 of each type for speed
        for (const element of elements.slice(0, 10)) {
          try {
            const tagName = await element.evaluate((el) => el.tagName.toLowerCase());
            const text = (await element.textContent()) || "";
            const testId = await element.getAttribute("data-testid");
            const id = await element.getAttribute("id");
            const title = await element.getAttribute("title");

            // Build a reliable selector
            let elementSelector = "";
            if (testId) {
              elementSelector = `[data-testid="${testId}"]`;
            } else if (id) {
              elementSelector = `#${id}`;
            } else if (text && text.length < 50) {
              elementSelector = `${tagName}:has-text("${text.trim()}")`;
            } else {
              continue; // Skip if no reliable selector
            }

            if (seenSelectors.has(elementSelector)) continue;
            seenSelectors.add(elementSelector);

            const feature: DiscoveredFeature = {
              name: text.trim() || title || tagName,
              type:
                tagName === "button"
                  ? "button"
                  : tagName === "input" || tagName === "select" || tagName === "textarea"
                    ? "input"
                    : tagName === "a"
                      ? "navigation"
                      : "other",
              selector: elementSelector,
              text: text.trim(),
              title: title || undefined,
              actions:
                tagName === "input" || tagName === "textarea"
                  ? ["fill"]
                  : tagName === "select"
                    ? ["select"]
                    : ["click"],
              confidence: testId ? 1.0 : id ? 0.9 : 0.7,
            };

            essentials.push(feature);
          } catch (e) {
            // Skip problematic elements
          }
        }
      } catch (e) {
        // Continue with next selector
      }
    }

    console.log(`✅ Found ${essentials.length} essential elements`);
    return essentials;
  }

  /**
   * Discover elements within a specific container only
   */
  async discoverInContainer(containerSelector: string): Promise<DiscoveredFeature[]> {
    console.log(`🎯 Discovering elements in container: ${containerSelector}`);

    const container = this.page.locator(containerSelector);
    const exists = (await container.count()) > 0;

    if (!exists) {
      console.log(`Container not found: ${containerSelector}`);
      return [];
    }

    const features: DiscoveredFeature[] = [];

    // Discover buttons in container
    const buttons = await container.locator('button, [role="button"]').all();
    for (const button of buttons.slice(0, 20)) {
      // Limit for performance
      try {
        const text = (await button.textContent()) || "";
        const title = await button.getAttribute("title");
        features.push({
          name: text.trim() || title || "Button",
          type: "button",
          selector: await this.getSelectorForElement(button),
          text: text.trim(),
          title: title || undefined,
          actions: ["click"],
        });
      } catch (e) {
        // Skip
      }
    }

    // Discover inputs in container
    const inputs = await container.locator("input, textarea, select").all();
    for (const input of inputs.slice(0, 10)) {
      try {
        const placeholder = await input.getAttribute("placeholder");
        const inputType = await input.getAttribute("type");
        features.push({
          name: placeholder || "Input",
          type: "input",
          selector: await this.getSelectorForElement(input),
          placeholder: placeholder || undefined,
          inputType: inputType || undefined,
          actions: ["fill"],
        });
      } catch (e) {
        // Skip
      }
    }

    console.log(`✅ Found ${features.length} elements in container`);
    return features;
  }

  /**
   * Helper to get reliable selector for an element
   */
  private async getSelectorForElement(element: any): Promise<string> {
    try {
      const testId = await element.getAttribute("data-testid");
      if (testId) return `[data-testid="${testId}"]`;

      const id = await element.getAttribute("id");
      if (id) return `#${id}`;

      const text = await element.textContent();
      if (text && text.trim().length < 50) {
        const tagName = await element.evaluate((el: any) => el.tagName.toLowerCase());
        return `${tagName}:has-text("${text.trim()}")`;
      }

      return "unknown";
    } catch {
      return "unknown";
    }
  }
}
