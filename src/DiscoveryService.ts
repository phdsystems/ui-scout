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
}
