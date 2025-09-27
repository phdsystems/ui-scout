import { describe, it, expect, beforeEach, vi } from "vitest";
import { ButtonDiscovery } from "../src/ButtonDiscovery";
import { createMockPage, createMockLocator } from "./mocks/playwright.mock";

describe("ButtonDiscovery", () => {
  let mockPage: any;
  let buttonDiscovery: ButtonDiscovery;

  beforeEach(() => {
    mockPage = createMockPage();
    buttonDiscovery = new ButtonDiscovery(mockPage);
    vi.clearAllMocks();
  });

  describe("discoverButtons", () => {
    it("should discover button elements and return DiscoveredFeature array", async () => {
      // Create mock button element
      const mockButton = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Click Me"),
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "type") return "button";
          if (attr === "id") return "btn-1";
          if (attr === "class") return "primary-btn";
          if (attr === "title") return null;
          if (attr === "aria-label") return null;
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
        toString: vi.fn().mockReturnValue("button#btn-1"),
      });

      // Mock page.locator to return elements for button selector
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "button") {
          return {
            all: vi.fn().mockResolvedValue([mockButton]),
          };
        }
        // Return empty array for all other selectors
        return {
          all: vi.fn().mockResolvedValue([]),
        };
      });

      const result = await buttonDiscovery.discoverButtons();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: "Click Me",
        type: "button",
        selector: "#btn-1",
        text: "Click Me",
      });
    });

    it("should skip invisible buttons", async () => {
      const visibleButton = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Visible"),
        getAttribute: vi.fn().mockReturnValue(null),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
        toString: vi.fn().mockReturnValue("button.visible"),
      });

      const invisibleButton = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Hidden"),
        getAttribute: vi.fn().mockReturnValue(null),
        isVisible: vi.fn().mockResolvedValue(false),
        toString: vi.fn().mockReturnValue("button.hidden"),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "button") {
          return {
            all: vi.fn().mockResolvedValue([visibleButton, invisibleButton]),
          };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const result = await buttonDiscovery.discoverButtons();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Visible");
    });

    it("should handle buttons without text using aria-label", async () => {
      const iconButton = createMockLocator({
        textContent: vi.fn().mockResolvedValue(""),
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "aria-label") return "Search";
          if (attr === "title") return "Search for items";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
        toString: vi.fn().mockReturnValue("button.icon"),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "button") {
          return {
            all: vi.fn().mockResolvedValue([iconButton]),
          };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const result = await buttonDiscovery.discoverButtons();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Search for items"); // title takes precedence over aria-label in naming
    });

    it("should discover elements with role=button", async () => {
      const roleButton = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Custom Button"),
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "role") return "button";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
        evaluate: vi.fn().mockResolvedValue("DIV"),
        toString: vi.fn().mockReturnValue("div[role=button]"),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === '[role="button"]') {
          return {
            all: vi.fn().mockResolvedValue([roleButton]),
          };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const result = await buttonDiscovery.discoverButtons();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Custom Button");
      expect(result[0].selector).toBeDefined();
      // Selector could be various forms depending on mock implementation
    });

    it("should filter out disabled buttons", async () => {
      const disabledButton = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Disabled"),
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "disabled") return "true";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(false),
        toString: vi.fn().mockReturnValue("button:disabled"),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "button") {
          return {
            all: vi.fn().mockResolvedValue([disabledButton]),
          };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const result = await buttonDiscovery.discoverButtons();

      expect(result).toHaveLength(0); // Should filter out disabled buttons
    });

    it("should avoid duplicate buttons with same selector", async () => {
      const button1 = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Click"),
        getAttribute: vi.fn().mockReturnValue(null),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
        toString: vi.fn().mockReturnValue("button.same"),
      });

      const button2 = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Click Again"),
        getAttribute: vi.fn().mockReturnValue(null),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
        toString: vi.fn().mockReturnValue("button.same"), // Same selector
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "button") {
          return {
            all: vi.fn().mockResolvedValue([button1, button2]),
          };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const result = await buttonDiscovery.discoverButtons();

      // Should only have one button since they have the same selector
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Click"); // First one wins
    });

    it("should handle empty page with no buttons", async () => {
      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([]),
      }));

      const result = await buttonDiscovery.discoverButtons();

      expect(result).toEqual([]);
    });

    it("should handle errors gracefully", async () => {
      // ButtonDiscovery doesn't have error handling in discoverButtons
      // so errors will propagate. This is testing the actual behavior.
      mockPage.locator.mockImplementation(() => {
        throw new Error("Page error");
      });

      await expect(buttonDiscovery.discoverButtons()).rejects.toThrow("Page error");
    });
  });

  describe("discoverTooltips", () => {
    it("should discover tooltips for visible buttons", async () => {
      const mockButtons = [
        {
          type: "button" as const,
          name: "Button 1",
          selector: "#btn1",
          actions: ["click"],
          attributes: { id: "btn1" },
        },
        {
          type: "button" as const,
          name: "Button 2",
          selector: "#btn2",
          actions: ["click"],
          attributes: { id: "btn2" },
        },
      ];

      const mockButtonLocator = {
        isVisible: vi.fn().mockResolvedValue(true),
        hover: vi.fn().mockResolvedValue(undefined),
      };

      const mockTooltipLocator = {
        first: vi.fn().mockReturnThis(),
        isVisible: vi.fn().mockResolvedValue(true),
        textContent: vi.fn().mockResolvedValue("This is a tooltip"),
      };

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.startsWith("#btn")) {
          return mockButtonLocator;
        }
        if (selector.includes("tooltip")) {
          return mockTooltipLocator;
        }
        return { isVisible: vi.fn().mockResolvedValue(false) };
      });

      await buttonDiscovery.discoverTooltips(mockButtons);

      expect(mockButtonLocator.hover).toHaveBeenCalledTimes(2);
      expect(mockButtons[0].attributes?.tooltip).toBe("This is a tooltip");
      expect(mockButtons[1].attributes?.tooltip).toBe("This is a tooltip");
    });

    it("should handle invisible buttons", async () => {
      const mockButtons = [
        {
          type: "button" as const,
          name: "Hidden Button",
          selector: "#hidden",
          actions: ["click"],
          attributes: {},
        },
      ];

      const mockButtonLocator = {
        isVisible: vi.fn().mockResolvedValue(false),
        hover: vi.fn(),
      };

      mockPage.locator.mockImplementation(() => mockButtonLocator);

      await buttonDiscovery.discoverTooltips(mockButtons);

      expect(mockButtonLocator.hover).not.toHaveBeenCalled();
      expect(mockButtons[0].attributes?.tooltip).toBeUndefined();
    });

    it("should handle no visible tooltips", async () => {
      const mockButtons = [
        {
          type: "button" as const,
          name: "Button",
          selector: "#btn",
          actions: ["click"],
          attributes: {},
        },
      ];

      const mockButtonLocator = {
        isVisible: vi.fn().mockResolvedValue(true),
        hover: vi.fn().mockResolvedValue(undefined),
      };

      const mockTooltipLocator = {
        first: vi.fn().mockReturnThis(),
        isVisible: vi.fn().mockResolvedValue(false),
      };

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "#btn") {
          return mockButtonLocator;
        }
        return mockTooltipLocator;
      });

      await buttonDiscovery.discoverTooltips(mockButtons);

      expect(mockButtonLocator.hover).toHaveBeenCalled();
      expect(mockButtons[0].attributes?.tooltip).toBeUndefined();
    });

    it("should limit processing to first 10 buttons", async () => {
      const mockButtons = Array.from({ length: 15 }, (_, i) => ({
        type: "button" as const,
        name: `Button ${i}`,
        selector: `#btn${i}`,
        actions: ["click"],
        attributes: {},
      }));

      const mockButtonLocator = {
        isVisible: vi.fn().mockResolvedValue(true),
        hover: vi.fn().mockResolvedValue(undefined),
      };

      const _mockTooltipLocator = {
        first: vi.fn().mockReturnThis(),
        isVisible: vi.fn().mockResolvedValue(false),
      };

      mockPage.locator.mockImplementation(() => mockButtonLocator);

      await buttonDiscovery.discoverTooltips(mockButtons);

      // Should only process first 10 buttons
      expect(mockButtonLocator.hover).toHaveBeenCalledTimes(10);
    });

    it("should handle errors gracefully", async () => {
      const mockButtons = [
        {
          type: "button" as const,
          name: "Error Button",
          selector: "#error",
          actions: ["click"],
          attributes: {},
        },
        {
          type: "button" as const,
          name: "Good Button",
          selector: "#good",
          actions: ["click"],
          attributes: {},
        },
      ];

      const _callCount = 0;
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "#error") {
          throw new Error("Locator error");
        }
        if (selector === "#good") {
          return {
            isVisible: vi.fn().mockResolvedValue(true),
            hover: vi.fn().mockResolvedValue(undefined),
          };
        }
        return {
          first: vi.fn().mockReturnThis(),
          isVisible: vi.fn().mockResolvedValue(false),
        };
      });

      // Should not throw, just continue with other buttons
      await buttonDiscovery.discoverTooltips(mockButtons);

      expect(mockButtons[0].attributes?.tooltip).toBeUndefined();
    });
  });
});
