import type { Page, Locator } from "@playwright/test";
import type { DiscoveredFeature } from "./types";
import { SelectorUtils } from "./SelectorUtils";

/**
 * Specialized class for discovering UI components (charts, panels, modals, etc.)
 * Single Responsibility: Complex UI component discovery and analysis
 */
export class ComponentDiscovery {
  private selectorUtils: SelectorUtils;
  private visitedSelectors = new Set<string>();

  constructor(private page: Page) {
    this.selectorUtils = new SelectorUtils(page);
  }

  async discoverCharts(): Promise<DiscoveredFeature[]> {
    console.log("📈 Discovering charts...");

    const chartSelectors = [
      "canvas",
      "svg.chart",
      '[class*="chart"]',
      '[class*="graph"]',
      '[id*="chart"]',
      '[id*="graph"]',
      ".tradingview-widget-container",
      'iframe[src*="tradingview"]',
      "[data-chart]",
      ".highcharts-container",
    ];

    return await this.discoverComponentsBySelectors(chartSelectors, "chart", "Chart Component");
  }

  async discoverPanels(): Promise<DiscoveredFeature[]> {
    console.log("📊 Discovering panels...");

    const panelSelectors = [
      '[role="region"]',
      ".panel",
      ".card",
      ".widget",
      '[class*="panel"]',
      '[class*="card"]',
      '[class*="widget"]',
      "aside",
      "section",
      '[class*="sidebar"]',
      '[class*="drawer"]',
    ];

    const panels = await this.discoverComponentsBySelectors(panelSelectors, "panel", "Panel");

    // Enhance panels with heading information
    for (const panel of panels) {
      const element = this.page.locator(panel.selector);
      const heading = await element
        .locator('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="header"]')
        .first()
        .textContent()
        .catch(() => "");
      if (heading) {
        panel.name = heading;
        panel.text = heading;
      }
    }

    return panels;
  }

  async discoverModals(): Promise<DiscoveredFeature[]> {
    console.log("🪟 Discovering modals...");

    const modalSelectors = [
      '[role="dialog"]',
      ".modal",
      ".dialog",
      '[class*="modal"]',
      '[class*="dialog"]',
      ".popup",
      '[class*="popup"]',
      ".overlay",
      '[aria-modal="true"]',
    ];

    const modals = await this.discoverComponentsBySelectors(modalSelectors, "modal", "Modal");

    // Enhance modals with heading information
    for (const modal of modals) {
      const element = this.page.locator(modal.selector);
      const heading = await element
        .locator('h1, h2, h3, h4, h5, h6, [class*="title"]')
        .first()
        .textContent()
        .catch(() => "");
      if (heading) {
        modal.name = heading;
        modal.text = heading;
      }
      modal.actions = ["screenshot", "close"];
    }

    return modals;
  }

  async discoverTables(): Promise<DiscoveredFeature[]> {
    console.log("📋 Discovering tables...");

    const tableSelectors = [
      "table",
      '[role="table"]',
      '[role="grid"]',
      ".table",
      '[class*="table"]',
      ".grid",
      '[class*="grid"]',
      ".data-table",
      ".list-view",
    ];

    const tables = await this.discoverComponentsBySelectors(tableSelectors, "table", "Table");

    // Enhance tables with structure information
    for (const table of tables) {
      const element = this.page.locator(table.selector);
      try {
        const headers = await element.locator('th, [role="columnheader"]').allTextContents();
        const rowCount = await element.locator('tr, [role="row"]').count();

        table.name = headers.join(", ").substring(0, 50) || "Table";
        table.attributes = {
          ...table.attributes,
          headers: headers.join(", "),
          rows: String(rowCount),
        };
      } catch (e) {
        // Keep default values
      }
    }

    return tables;
  }

  async discoverCustomComponents(): Promise<DiscoveredFeature[]> {
    console.log("🎨 Discovering custom components...");

    const customSelectors = [
      "[data-testid]",
      "[data-test]",
      "[data-cy]",
      "[data-component]",
      "[data-widget]",
      '*[class*="component"]',
      '*[class*="widget"]',
      '*[id*="component"]',
      '*[id*="widget"]',
    ];

    const components = await this.discoverComponentsBySelectors(
      customSelectors,
      "other",
      "Custom Component",
    );

    // Enhance custom components with specific attributes
    for (const component of components) {
      const element = this.page.locator(component.selector);
      try {
        const testId = await element.getAttribute("data-testid");
        const id = await element.getAttribute("id");

        component.name = testId || id || component.name;
        component.actions = ["click", "hover", "screenshot"];
      } catch (e) {
        // Keep default values
      }
    }

    return components;
  }

  private async discoverComponentsBySelectors(
    selectors: string[],
    type: DiscoveredFeature["type"],
    defaultName: string,
  ): Promise<DiscoveredFeature[]> {
    const discoveredComponents: DiscoveredFeature[] = [];

    for (const selector of selectors) {
      const elements = await this.page.locator(selector).all();

      for (const element of elements) {
        const component = await this.analyzeComponent(element, type, defaultName);
        if (component) {
          discoveredComponents.push(component);
        }
      }
    }

    console.log(`  ✓ Found ${discoveredComponents.length} ${type}s`);
    return discoveredComponents;
  }

  private async analyzeComponent(
    element: Locator,
    type: DiscoveredFeature["type"],
    defaultName: string,
  ): Promise<DiscoveredFeature | null> {
    try {
      const uniqueSelector = await this.selectorUtils.getUniqueSelector(element);
      if (this.visitedSelectors.has(uniqueSelector)) return null;

      const isVisible = await element.isVisible({ timeout: 1000 });
      if (!isVisible) return null;

      const id = await element.getAttribute("id");
      const className = await element.getAttribute("class");

      const feature: DiscoveredFeature = {
        name: id || defaultName,
        type: type,
        selector: uniqueSelector,
        attributes: {
          id: id || "",
          class: className || "",
        },
        actions: ["screenshot", "hover"],
      };

      this.visitedSelectors.add(uniqueSelector);
      console.log(`  ✓ Found ${type}: ${feature.name}`);

      return feature;
    } catch (e) {
      return null;
    }
  }
}
