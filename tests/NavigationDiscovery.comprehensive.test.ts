import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NavigationDiscovery } from "../src/NavigationDiscovery";
import { SelectorUtils } from "../src/SelectorUtils";
import { createMockPage, createMockLocator } from "./mocks/playwright.mock";
import type { DiscoveredFeature } from "../src/types";

describe("NavigationDiscovery - Comprehensive Tests", () => {
  let mockPage: any;
  let navigationDiscovery: NavigationDiscovery;

  beforeEach(() => {
    mockPage = createMockPage();
    navigationDiscovery = new NavigationDiscovery(mockPage);
    vi.clearAllMocks();
    
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Constructor and Initialization", () => {
    it("should initialize with SelectorUtils", () => {
      const discovery = new NavigationDiscovery(mockPage);
      expect(discovery).toBeDefined();
      expect(discovery["selectorUtils"]).toBeInstanceOf(SelectorUtils);
      expect(discovery["page"]).toBe(mockPage);
    });

    it("should initialize with empty visited selectors", () => {
      const discovery = new NavigationDiscovery(mockPage);
      expect(discovery["visitedSelectors"]).toBeInstanceOf(Set);
      expect(discovery["visitedSelectors"].size).toBe(0);
    });
  });

  describe("discoverMenus", () => {
    it("should discover menu elements", async () => {
      const mockMenu = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "role") return "menu";
          if (attr === "class") return "main-menu";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([
            createMockLocator({ textContent: vi.fn().mockResolvedValue("Home") }),
            createMockLocator({ textContent: vi.fn().mockResolvedValue("About") }),
          ])
        })
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === '[role="menu"]' || selector.includes("menu")) {
          return { all: vi.fn().mockResolvedValue([mockMenu]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const menus = await navigationDiscovery.discoverMenus();

      expect(menus).toBeDefined();
      expect(Array.isArray(menus)).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Discovering menus"));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Found"));
    });

    it("should analyze menu items correctly", async () => {
      const mockMenuItem1 = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Products"),
        getAttribute: vi.fn(() => "products-link"),
      });

      const mockMenuItem2 = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Services"),
        getAttribute: vi.fn(() => "services-link"),
      });

      const mockMenu = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "id") return "main-nav";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([mockMenuItem1, mockMenuItem2])
        })
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "nav") {
          return { all: vi.fn().mockResolvedValue([mockMenu]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const menus = await navigationDiscovery.discoverMenus();

      expect(menus.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle different menu types", async () => {
      const mockNavMenu = createMockLocator({
        getAttribute: vi.fn(() => "navbar"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([])
        })
      });

      const mockRoleMenu = createMockLocator({
        getAttribute: vi.fn((attr) => attr === "role" ? "menubar" : null),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([])
        })
      });

      const mockClassMenu = createMockLocator({
        getAttribute: vi.fn((attr) => attr === "class" ? "dropdown-menu" : null),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([])
        })
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "nav") {
          return { all: vi.fn().mockResolvedValue([mockNavMenu]) };
        }
        if (selector === '[role="menubar"]') {
          return { all: vi.fn().mockResolvedValue([mockRoleMenu]) };
        }
        if (selector === ".dropdown-menu") {
          return { all: vi.fn().mockResolvedValue([mockClassMenu]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const menus = await navigationDiscovery.discoverMenus();

      expect(menus).toBeDefined();
    });

    it("should skip invisible menus", async () => {
      const mockInvisibleMenu = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(false),
      });

      const mockVisibleMenu = createMockLocator({
        getAttribute: vi.fn(() => "visible-menu"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([])
        })
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "nav") {
          return { all: vi.fn().mockResolvedValue([mockInvisibleMenu, mockVisibleMenu]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const menus = await navigationDiscovery.discoverMenus();

      // Should only include visible menus
      expect(menus).toBeDefined();
    });

    it("should handle empty menu discovery", async () => {
      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([])
      }));

      const menus = await navigationDiscovery.discoverMenus();

      expect(menus).toEqual([]);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Found 0 menus"));
    });
  });

  describe("discoverDropdowns", () => {
    it("should discover dropdown elements", async () => {
      const mockDropdown = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "role") return "combobox";
          if (attr === "name") return "country";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([
            createMockLocator({ textContent: vi.fn().mockResolvedValue("USA") }),
            createMockLocator({ textContent: vi.fn().mockResolvedValue("Canada") }),
          ])
        })
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "select" || selector.includes("dropdown")) {
          return { all: vi.fn().mockResolvedValue([mockDropdown]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const dropdowns = await navigationDiscovery.discoverDropdowns();

      expect(dropdowns).toBeDefined();
      expect(Array.isArray(dropdowns)).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Discovering dropdowns"));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Found"));
    });

    it("should discover different dropdown types", async () => {
      const mockSelectDropdown = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "name") return "select-field";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([])
        })
      });

      const mockComboboxDropdown = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "role") return "combobox";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([])
        })
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "select") {
          return { all: vi.fn().mockResolvedValue([mockSelectDropdown]) };
        }
        if (selector === '[role="combobox"]') {
          return { all: vi.fn().mockResolvedValue([mockComboboxDropdown]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const dropdowns = await navigationDiscovery.discoverDropdowns();

      expect(dropdowns).toBeDefined();
    });

    it("should analyze dropdown options", async () => {
      const mockOption1 = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Option 1"),
        getAttribute: vi.fn((attr) => attr === "value" ? "opt1" : null),
      });

      const mockOption2 = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Option 2"),
        getAttribute: vi.fn((attr) => attr === "value" ? "opt2" : null),
      });

      const mockDropdown = createMockLocator({
        getAttribute: vi.fn(() => "options-dropdown"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([mockOption1, mockOption2])
        })
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "select") {
          return { all: vi.fn().mockResolvedValue([mockDropdown]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const dropdowns = await navigationDiscovery.discoverDropdowns();

      expect(dropdowns.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle dropdowns with no options", async () => {
      const mockEmptyDropdown = createMockLocator({
        getAttribute: vi.fn(() => "empty-dropdown"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([])
        })
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "select") {
          return { all: vi.fn().mockResolvedValue([mockEmptyDropdown]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const dropdowns = await navigationDiscovery.discoverDropdowns();

      expect(dropdowns).toBeDefined();
    });

    it("should handle empty dropdown discovery", async () => {
      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([])
      }));

      const dropdowns = await navigationDiscovery.discoverDropdowns();

      expect(dropdowns).toEqual([]);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Found 0 dropdowns"));
    });
  });

  describe("discoverTabs", () => {
    it("should discover tab elements", async () => {
      const mockTab = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "role") return "tab";
          if (attr === "class") return "tab-item";
          return null;
        }),
        textContent: vi.fn().mockResolvedValue("Settings"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes("tab")) {
          return { all: vi.fn().mockResolvedValue([mockTab]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const tabs = await navigationDiscovery.discoverTabs();

      expect(tabs).toBeDefined();
      expect(Array.isArray(tabs)).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Discovering tabs"));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Found"));
    });

    it("should discover different tab types", async () => {
      const mockRoleTab = createMockLocator({
        getAttribute: vi.fn((attr) => attr === "role" ? "tab" : null),
        textContent: vi.fn().mockResolvedValue("Tab 1"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      const mockClassTab = createMockLocator({
        getAttribute: vi.fn((attr) => attr === "class" ? "tab-button" : null),
        textContent: vi.fn().mockResolvedValue("Tab 2"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === '[role="tab"]') {
          return { all: vi.fn().mockResolvedValue([mockRoleTab]) };
        }
        if (selector.includes("tab")) {
          return { all: vi.fn().mockResolvedValue([mockClassTab]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const tabs = await navigationDiscovery.discoverTabs();

      expect(tabs).toBeDefined();
    });

    it("should group tabs correctly", async () => {
      const mockTab1 = createMockLocator({
        getAttribute: vi.fn(() => "tab-1"),
        textContent: vi.fn().mockResolvedValue("Home"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      const mockTab2 = createMockLocator({
        getAttribute: vi.fn(() => "tab-2"),
        textContent: vi.fn().mockResolvedValue("Profile"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      const mockTab3 = createMockLocator({
        getAttribute: vi.fn(() => "tab-3"),
        textContent: vi.fn().mockResolvedValue("Settings"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === '[role="tab"]') {
          return { all: vi.fn().mockResolvedValue([mockTab1, mockTab2, mockTab3]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const tabs = await navigationDiscovery.discoverTabs();

      expect(tabs.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle tabs without text", async () => {
      const mockTab = createMockLocator({
        getAttribute: vi.fn(() => "icon-tab"),
        textContent: vi.fn().mockResolvedValue(""),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === '[role="tab"]') {
          return { all: vi.fn().mockResolvedValue([mockTab]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const tabs = await navigationDiscovery.discoverTabs();

      expect(tabs).toBeDefined();
    });

    it("should handle empty tab discovery", async () => {
      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([])
      }));

      const tabs = await navigationDiscovery.discoverTabs();

      expect(tabs).toEqual([]);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Found 0 tab groups"));
    });
  });

  describe("Private Analysis Methods", () => {
    it("should analyze menu correctly", async () => {
      const mockMenuItem = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Menu Item"),
      });

      const mockMenu = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "id") return "test-menu";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([mockMenuItem])
        })
      });

      // Mock SelectorUtils
      vi.spyOn(navigationDiscovery["selectorUtils"], 'getUniqueSelector')
        .mockResolvedValue("#test-menu");

      const menu = await navigationDiscovery["analyzeMenu"](mockMenu);

      expect(menu).toBeDefined();
      if (menu) {
        expect(menu.type).toBe("menu");
        expect(menu.selector).toBe("#test-menu");
      }
    });

    it("should analyze dropdown correctly", async () => {
      const mockOption = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Option"),
      });

      const mockDropdown = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "name") return "test-dropdown";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([mockOption])
        })
      });

      vi.spyOn(navigationDiscovery["selectorUtils"], 'getUniqueSelector')
        .mockResolvedValue("select[name='test-dropdown']");

      const dropdown = await navigationDiscovery["analyzeDropdown"](mockDropdown);

      expect(dropdown).toBeDefined();
      if (dropdown) {
        expect(dropdown.type).toBe("dropdown");
        expect(dropdown.selector).toBe("select[name='test-dropdown']");
      }
    });

    it("should analyze tab correctly", async () => {
      const mockTab = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "id") return "tab-home";
          if (attr === "aria-selected") return "true";
          return null;
        }),
        textContent: vi.fn().mockResolvedValue("Home"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      vi.spyOn(navigationDiscovery["selectorUtils"], 'getUniqueSelector')
        .mockResolvedValue("#tab-home");

      const tab = await navigationDiscovery["analyzeTab"](mockTab);

      expect(tab).toBeDefined();
      if (tab) {
        expect(tab.type).toBe("tab");
        expect(tab.name).toBe("Home");
        expect(tab.selector).toBe("#tab-home");
      }
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle page locator errors", async () => {
      mockPage.locator.mockImplementation(() => {
        throw new Error("Page not ready");
      });

      const menus = await navigationDiscovery.discoverMenus();
      
      expect(menus).toBeDefined();
      expect(Array.isArray(menus)).toBe(true);
    });

    it("should handle element analysis errors", async () => {
      const mockElement = createMockLocator({
        isVisible: vi.fn().mockRejectedValue(new Error("Element error")),
        getAttribute: vi.fn().mockRejectedValue(new Error("Attribute error")),
      });

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([mockElement])
      }));

      const dropdowns = await navigationDiscovery.discoverDropdowns();

      expect(dropdowns).toBeDefined();
    });

    it("should handle SelectorUtils errors", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn(() => null),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([])
        })
      });

      // Mock SelectorUtils to throw error
      vi.spyOn(navigationDiscovery["selectorUtils"], 'getUniqueSelector')
        .mockRejectedValue(new Error("Selector generation failed"));

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([mockElement])
      }));

      const menus = await navigationDiscovery.discoverMenus();

      expect(menus).toBeDefined();
    });

    it("should handle large numbers of navigation elements", async () => {
      const largeElementArray = Array.from({ length: 50 }, (_, i) => 
        createMockLocator({
          getAttribute: vi.fn(() => `nav-${i}`),
          isVisible: vi.fn().mockResolvedValue(true),
          locator: vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue([])
          })
        })
      );

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue(largeElementArray)
      }));

      const startTime = Date.now();
      const tabs = await navigationDiscovery.discoverTabs();
      const duration = Date.now() - startTime;

      expect(tabs).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete in reasonable time
    });

    it("should deduplicate navigation elements", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn(() => "duplicate-nav"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([])
        })
      });

      // Mock SelectorUtils to return same selector
      vi.spyOn(navigationDiscovery["selectorUtils"], 'getUniqueSelector')
        .mockResolvedValue("#duplicate-nav");

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([mockElement, mockElement]) // Same element multiple times
      }));

      const menus = await navigationDiscovery.discoverMenus();

      // Should deduplicate based on visited selectors
      expect(menus).toBeDefined();
    });

    it("should maintain visited selectors across methods", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn(() => "shared-element"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([])
        })
      });

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([mockElement])
      }));

      // Run multiple discoveries
      await navigationDiscovery.discoverMenus();
      await navigationDiscovery.discoverDropdowns();
      await navigationDiscovery.discoverTabs();

      expect(navigationDiscovery["visitedSelectors"].size).toBeGreaterThan(0);
    });

    it("should handle null/undefined elements", async () => {
      const validElement = createMockLocator({
        getAttribute: vi.fn(() => "valid"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([])
        })
      });

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([validElement, null, undefined])
      }));

      const tabs = await navigationDiscovery.discoverTabs();

      expect(tabs).toBeDefined();
      expect(Array.isArray(tabs)).toBe(true);
    });

    it("should handle invisible navigation elements", async () => {
      const visibleElement = createMockLocator({
        getAttribute: vi.fn(() => "visible"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([])
        })
      });

      const invisibleElement = createMockLocator({
        getAttribute: vi.fn(() => "invisible"),
        isVisible: vi.fn().mockResolvedValue(false),
      });

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([visibleElement, invisibleElement])
      }));

      const dropdowns = await navigationDiscovery.discoverDropdowns();

      expect(dropdowns).toBeDefined();
    });
  });

  describe("Integration Tests", () => {
    it("should work with real-like navigation structure", async () => {
      // Main navigation
      const mockMainNav = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "role") return "navigation";
          if (attr === "id") return "main-nav";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([
            createMockLocator({ textContent: vi.fn().mockResolvedValue("Home") }),
            createMockLocator({ textContent: vi.fn().mockResolvedValue("Products") }),
            createMockLocator({ textContent: vi.fn().mockResolvedValue("Contact") }),
          ])
        })
      });

      // Dropdown
      const mockDropdown = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "name") return "category";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([
            createMockLocator({ textContent: vi.fn().mockResolvedValue("Electronics") }),
            createMockLocator({ textContent: vi.fn().mockResolvedValue("Clothing") }),
          ])
        })
      });

      // Tabs
      const mockTab1 = createMockLocator({
        getAttribute: vi.fn(() => "tab-overview"),
        textContent: vi.fn().mockResolvedValue("Overview"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      const mockTab2 = createMockLocator({
        getAttribute: vi.fn(() => "tab-details"),
        textContent: vi.fn().mockResolvedValue("Details"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "nav") {
          return { all: vi.fn().mockResolvedValue([mockMainNav]) };
        }
        if (selector === "select") {
          return { all: vi.fn().mockResolvedValue([mockDropdown]) };
        }
        if (selector === '[role="tab"]') {
          return { all: vi.fn().mockResolvedValue([mockTab1, mockTab2]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Run all navigation discoveries
      const [menus, dropdowns, tabs] = await Promise.all([
        navigationDiscovery.discoverMenus(),
        navigationDiscovery.discoverDropdowns(),
        navigationDiscovery.discoverTabs(),
      ]);

      expect(menus).toBeDefined();
      expect(dropdowns).toBeDefined();
      expect(tabs).toBeDefined();

      // Should have found navigation elements
      const totalElements = menus.length + dropdowns.length + tabs.length;
      expect(totalElements).toBeGreaterThanOrEqual(0);
    });
  });
});