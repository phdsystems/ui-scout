import type { Page, Locator } from "@playwright/test";
import type { DiscoveredFeature } from "./types";
import { SelectorUtils } from "./SelectorUtils";

/**
 * Specialized class for discovering navigation elements (menus, dropdowns, tabs)
 * Single Responsibility: Navigation element discovery and menu analysis
 */
export class NavigationDiscovery {
  private selectorUtils: SelectorUtils;
  private visitedSelectors = new Set<string>();

  constructor(private page: Page) {
    this.selectorUtils = new SelectorUtils(page);
  }

  async discoverMenus(): Promise<DiscoveredFeature[]> {
    console.log("📋 Discovering menus...");

    const menuSelectors = [
      '[role="menu"]',
      '[role="menubar"]',
      '[role="menuitem"]',
      "nav",
      ".menu",
      ".navbar",
      '[class*="menu"]',
      '[class*="nav"]',
      "ul.dropdown",
      ".dropdown-menu",
    ];

    const discoveredMenus: DiscoveredFeature[] = [];

    for (const selector of menuSelectors) {
      const elements = await this.page.locator(selector).all();

      for (const element of elements) {
        const menu = await this.analyzeMenu(element);
        if (menu) {
          discoveredMenus.push(menu);
        }
      }
    }

    console.log(`  ✓ Found ${discoveredMenus.length} menus`);
    return discoveredMenus;
  }

  async discoverDropdowns(): Promise<DiscoveredFeature[]> {
    console.log("📝 Discovering dropdowns...");

    const dropdownSelectors = [
      "select",
      '[role="combobox"]',
      '[role="listbox"]',
      ".dropdown",
      '[class*="dropdown"]',
      ".select",
      '[class*="select"]',
      '[aria-haspopup="listbox"]',
    ];

    const discoveredDropdowns: DiscoveredFeature[] = [];

    for (const selector of dropdownSelectors) {
      const elements = await this.page.locator(selector).all();

      for (const element of elements) {
        const dropdown = await this.analyzeDropdown(element);
        if (dropdown) {
          discoveredDropdowns.push(dropdown);
        }
      }
    }

    console.log(`  ✓ Found ${discoveredDropdowns.length} dropdowns`);
    return discoveredDropdowns;
  }

  async discoverTabs(): Promise<DiscoveredFeature[]> {
    console.log("📑 Discovering tabs...");

    const tabSelectors = [
      '[role="tablist"]',
      '[role="tab"]',
      ".tabs",
      '[class*="tab"]',
      ".nav-tabs",
      '[data-toggle="tab"]',
    ];

    const discoveredTabs: DiscoveredFeature[] = [];

    for (const selector of tabSelectors) {
      const elements = await this.page.locator(selector).all();

      for (const element of elements) {
        const tabs = await this.analyzeTabs(element);
        if (tabs) {
          discoveredTabs.push(tabs);
        }
      }
    }

    console.log(`  ✓ Found ${discoveredTabs.length} tab groups`);
    return discoveredTabs;
  }

  private async analyzeMenu(element: Locator): Promise<DiscoveredFeature | null> {
    try {
      const uniqueSelector = await this.selectorUtils.getUniqueSelector(element);
      if (this.visitedSelectors.has(uniqueSelector)) return null;

      const isVisible = await element.isVisible({ timeout: 1000 });
      if (!isVisible) return null;

      const text = (await element.textContent()) || "";
      const menuItems = await this.discoverMenuItems(element);

      const feature: DiscoveredFeature = {
        name: text.substring(0, 50) || "Menu",
        type: "menu",
        selector: uniqueSelector,
        text: text,
        children: menuItems,
        actions: ["click", "hover"],
      };

      this.visitedSelectors.add(uniqueSelector);
      console.log(`  ✓ Found menu with ${menuItems.length} items`);

      return feature;
    } catch (e) {
      return null;
    }
  }

  private async discoverMenuItems(menuElement: Locator): Promise<DiscoveredFeature[]> {
    const items: DiscoveredFeature[] = [];
    const itemSelectors = ["li", "a", '[role="menuitem"]', ".menu-item", '[class*="item"]'];

    for (const selector of itemSelectors) {
      const elements = await menuElement.locator(selector).all();

      for (const element of elements) {
        try {
          const text = (await element.textContent()) || "";
          const href = await element.getAttribute("href");

          items.push({
            name: text || "Menu Item",
            type: "other",
            selector: await this.selectorUtils.getUniqueSelector(element),
            text: text,
            attributes: { href: href || "" },
            actions: ["click"],
          });
        } catch (e) {
          // Skip problematic elements
        }
      }
    }

    return items;
  }

  private async analyzeDropdown(element: Locator): Promise<DiscoveredFeature | null> {
    try {
      const uniqueSelector = await this.selectorUtils.getUniqueSelector(element);
      if (this.visitedSelectors.has(uniqueSelector)) return null;

      const isVisible = await element.isVisible({ timeout: 1000 });
      if (!isVisible) return null;

      const label = await this.selectorUtils.findLabelForInput(element);
      const options = await element.locator('option, [role="option"]').allTextContents();

      const feature: DiscoveredFeature = {
        name: label || "Dropdown",
        type: "dropdown",
        selector: uniqueSelector,
        attributes: {
          options: options.join(", ").substring(0, 100),
        },
        actions: ["select", "click"],
      };

      this.visitedSelectors.add(uniqueSelector);
      console.log(`  ✓ Found dropdown with ${options.length} options`);

      return feature;
    } catch (e) {
      return null;
    }
  }

  private async analyzeTabs(element: Locator): Promise<DiscoveredFeature | null> {
    try {
      const uniqueSelector = await this.selectorUtils.getUniqueSelector(element);
      if (this.visitedSelectors.has(uniqueSelector)) return null;

      const isVisible = await element.isVisible({ timeout: 1000 });
      if (!isVisible) return null;

      const tabTexts = await element.locator('[role="tab"], li, a').allTextContents();

      const feature: DiscoveredFeature = {
        name: "Tab Navigation",
        type: "tab",
        selector: uniqueSelector,
        attributes: {
          tabs: tabTexts.join(", ").substring(0, 100),
        },
        actions: ["click"],
      };

      this.visitedSelectors.add(uniqueSelector);
      console.log(`  ✓ Found tabs: ${tabTexts.join(", ")}`);

      return feature;
    } catch (e) {
      return null;
    }
  }
}
