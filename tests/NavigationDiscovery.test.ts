import { describe, it, expect, beforeEach, vi } from "vitest";
import { NavigationDiscovery } from "../src/NavigationDiscovery";
import { createMockPage, createMockLocator } from "./mocks/playwright.mock";

describe("NavigationDiscovery", () => {
  let mockPage: any;
  let navigationDiscovery: NavigationDiscovery;

  beforeEach(() => {
    mockPage = createMockPage();
    navigationDiscovery = new NavigationDiscovery(mockPage);
    vi.clearAllMocks();
  });

  describe("discoverMenus", () => {
    it("should discover navigation menus", async () => {
      const mockMenu = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Main Navigation"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockImplementation((selector: string) => {
          if (selector === "li") {
            const mockItem1 = createMockLocator({
              textContent: vi.fn().mockResolvedValue("Home"),
              getAttribute: vi.fn().mockResolvedValue("/home"),
            });
            const mockItem2 = createMockLocator({
              textContent: vi.fn().mockResolvedValue("About"),
              getAttribute: vi.fn().mockResolvedValue("/about"),
            });
            return { all: vi.fn().mockResolvedValue([mockItem1, mockItem2]) };
          }
          return { all: vi.fn().mockResolvedValue([]) };
        }),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "nav") {
          return { all: vi.fn().mockResolvedValue([mockMenu]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Mock SelectorUtils
      navigationDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("nav.main"),
      } as any;

      const result = await navigationDiscovery.discoverMenus();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: "Main Navigation",
        type: "menu",
        selector: "nav.main",
        text: "Main Navigation",
        actions: ["click", "hover"],
      });
      expect(result[0].children).toHaveLength(2);
    });

    it("should handle empty menu lists", async () => {
      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([]),
      }));

      const result = await navigationDiscovery.discoverMenus();
      expect(result).toEqual([]);
    });

    it("should skip hidden menus", async () => {
      const mockMenu = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Hidden Menu"),
        isVisible: vi.fn().mockResolvedValue(false),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "nav") {
          return { all: vi.fn().mockResolvedValue([mockMenu]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const result = await navigationDiscovery.discoverMenus();
      expect(result).toEqual([]);
    });

    it("should handle duplicate selectors", async () => {
      const mockMenu1 = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Menu 1"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({ all: vi.fn().mockResolvedValue([]) }),
      });

      const mockMenu2 = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Menu 2"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({ all: vi.fn().mockResolvedValue([]) }),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "nav") {
          return { all: vi.fn().mockResolvedValue([mockMenu1, mockMenu2]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Mock SelectorUtils to return same selector for duplicates
      navigationDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("nav.duplicate"),
      } as any;

      const result = await navigationDiscovery.discoverMenus();
      // Should only include first menu due to duplicate selector filtering
      expect(result).toHaveLength(1);
    });
  });

  describe("discoverDropdowns", () => {
    it("should discover dropdown menus", async () => {
      const mockDropdown = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockImplementation((selector: string) => {
          if (selector.includes("option")) {
            return {
              allTextContents: vi.fn().mockResolvedValue(["Option 1", "Option 2", "Option 3"]),
            };
          }
          return { allTextContents: vi.fn().mockResolvedValue([]) };
        }),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "select") {
          return { all: vi.fn().mockResolvedValue([mockDropdown]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Mock SelectorUtils
      navigationDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("select#country"),
        findLabelForInput: vi.fn().mockResolvedValue("Select Country"),
      } as any;

      const result = await navigationDiscovery.discoverDropdowns();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: "Select Country",
        type: "dropdown",
        selector: "select#country",
        attributes: {
          options: "Option 1, Option 2, Option 3",
        },
        actions: ["select", "click"],
      });
    });

    it("should handle dropdowns without labels", async () => {
      const mockDropdown = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({ allTextContents: vi.fn().mockResolvedValue([]) }),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "select") {
          return { all: vi.fn().mockResolvedValue([mockDropdown]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Mock SelectorUtils
      navigationDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("select.unlabeled"),
        findLabelForInput: vi.fn().mockResolvedValue(""),
      } as any;

      const result = await navigationDiscovery.discoverDropdowns();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Dropdown");
    });

    it("should handle empty dropdown lists", async () => {
      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([]),
      }));

      const result = await navigationDiscovery.discoverDropdowns();
      expect(result).toEqual([]);
    });
  });

  describe("discoverTabs", () => {
    it("should discover tab navigation", async () => {
      const mockTabs = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockImplementation((selector: string) => {
          if (selector.includes("tab") || selector.includes("li") || selector.includes("a")) {
            return { allTextContents: vi.fn().mockResolvedValue(["Tab 1", "Tab 2", "Tab 3"]) };
          }
          return { allTextContents: vi.fn().mockResolvedValue([]) };
        }),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === '[role="tablist"]') {
          return { all: vi.fn().mockResolvedValue([mockTabs]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Mock SelectorUtils
      navigationDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue('[role="tablist"]'),
      } as any;

      const result = await navigationDiscovery.discoverTabs();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: "Tab Navigation",
        type: "tab",
        selector: '[role="tablist"]',
        attributes: {
          tabs: "Tab 1, Tab 2, Tab 3",
        },
        actions: ["click"],
      });
    });

    it("should handle empty tab lists", async () => {
      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([]),
      }));

      const result = await navigationDiscovery.discoverTabs();
      expect(result).toEqual([]);
    });

    it("should skip hidden tabs", async () => {
      const mockTabs = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(false),
        locator: vi.fn().mockReturnValue({ allTextContents: vi.fn().mockResolvedValue([]) }),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === '[role="tablist"]') {
          return { all: vi.fn().mockResolvedValue([mockTabs]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const result = await navigationDiscovery.discoverTabs();
      expect(result).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("should handle menu discovery errors gracefully", async () => {
      mockPage.locator.mockImplementation(() => {
        throw new Error("Menu locator error");
      });

      await expect(navigationDiscovery.discoverMenus()).rejects.toThrow("Menu locator error");
    });

    it("should handle dropdown discovery errors gracefully", async () => {
      mockPage.locator.mockImplementation(() => {
        throw new Error("Dropdown locator error");
      });

      await expect(navigationDiscovery.discoverDropdowns()).rejects.toThrow(
        "Dropdown locator error",
      );
    });

    it("should handle tab discovery errors gracefully", async () => {
      mockPage.locator.mockImplementation(() => {
        throw new Error("Tab locator error");
      });

      await expect(navigationDiscovery.discoverTabs()).rejects.toThrow("Tab locator error");
    });

    it("should handle malformed menu elements", async () => {
      const mockMenu = createMockLocator({
        textContent: vi.fn().mockRejectedValue(new Error("Text content error")),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "nav") {
          return { all: vi.fn().mockResolvedValue([mockMenu]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const result = await navigationDiscovery.discoverMenus();
      // Should skip elements with errors
      expect(result).toEqual([]);
    });

    it("should handle malformed dropdown elements", async () => {
      const mockDropdown = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockImplementation(() => {
          throw new Error("Options error");
        }),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "select") {
          return { all: vi.fn().mockResolvedValue([mockDropdown]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const result = await navigationDiscovery.discoverDropdowns();
      // Should skip elements with errors
      expect(result).toEqual([]);
    });

    it("should handle malformed tab elements", async () => {
      const mockTabs = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockImplementation(() => {
          throw new Error("Tab content error");
        }),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === '[role="tablist"]') {
          return { all: vi.fn().mockResolvedValue([mockTabs]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const result = await navigationDiscovery.discoverTabs();
      // Should skip elements with errors
      expect(result).toEqual([]);
    });
  });

  describe("menu items discovery", () => {
    it("should discover menu items within menus", async () => {
      const mockMenuItem1 = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Home"),
        getAttribute: vi.fn().mockResolvedValue("/home"),
      });

      const mockMenuItem2 = createMockLocator({
        textContent: vi.fn().mockResolvedValue("About"),
        getAttribute: vi.fn().mockResolvedValue("/about"),
      });

      const mockMenu = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Navigation Menu"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockImplementation((selector: string) => {
          if (selector === "li") {
            return { all: vi.fn().mockResolvedValue([mockMenuItem1, mockMenuItem2]) };
          }
          return { all: vi.fn().mockResolvedValue([]) };
        }),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "nav") {
          return { all: vi.fn().mockResolvedValue([mockMenu]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Mock SelectorUtils
      navigationDiscovery["selectorUtils"] = {
        getUniqueSelector: vi
          .fn()
          .mockResolvedValueOnce("nav.menu")
          .mockResolvedValueOnce("nav.menu li:nth-child(1)")
          .mockResolvedValueOnce("nav.menu li:nth-child(2)"),
      } as any;

      const result = await navigationDiscovery.discoverMenus();

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(2);
      expect(result[0].children?.[0]).toMatchObject({
        name: "Home",
        type: "other",
        text: "Home",
        attributes: { href: "/home" },
        actions: ["click"],
      });
      expect(result[0].children?.[1]).toMatchObject({
        name: "About",
        type: "other",
        text: "About",
        attributes: { href: "/about" },
        actions: ["click"],
      });
    });

    it("should handle menu items without text content", async () => {
      const mockMenuItem = createMockLocator({
        textContent: vi.fn().mockResolvedValue(""),
        getAttribute: vi.fn().mockResolvedValue("/icon-link"),
      });

      const mockMenu = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Icon Menu"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockImplementation((selector: string) => {
          if (selector === "a") {
            return { all: vi.fn().mockResolvedValue([mockMenuItem]) };
          }
          return { all: vi.fn().mockResolvedValue([]) };
        }),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "nav") {
          return { all: vi.fn().mockResolvedValue([mockMenu]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Mock SelectorUtils
      navigationDiscovery["selectorUtils"] = {
        getUniqueSelector: vi
          .fn()
          .mockResolvedValueOnce("nav.icon-menu")
          .mockResolvedValueOnce("nav.icon-menu a"),
      } as any;

      const result = await navigationDiscovery.discoverMenus();

      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children?.[0]?.name).toBe("Menu Item");
    });
  });
});
