import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { DiscoveryService } from "../src/DiscoveryService";
import { ButtonDiscovery } from "../src/ButtonDiscovery";
import { InputDiscovery } from "../src/InputDiscovery";
import { ComponentDiscovery } from "../src/ComponentDiscovery";
import { NavigationDiscovery } from "../src/NavigationDiscovery";
import { createMockPage, createMockLocator } from "./mocks/playwright.mock";
import type { DiscoveredFeature } from "../src/types";

describe("DiscoveryService - Comprehensive Tests", () => {
  let mockPage: any;
  let discoveryService: DiscoveryService;

  beforeEach(() => {
    mockPage = createMockPage();
    discoveryService = new DiscoveryService(mockPage);
    vi.clearAllMocks();
    
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Constructor and Initialization", () => {
    it("should properly initialize all discovery services", () => {
      const service = new DiscoveryService(mockPage);
      expect(service).toBeDefined();
      expect(service["buttonDiscovery"]).toBeInstanceOf(ButtonDiscovery);
      expect(service["inputDiscovery"]).toBeInstanceOf(InputDiscovery);
      expect(service["componentDiscovery"]).toBeInstanceOf(ComponentDiscovery);
      expect(service["navigationDiscovery"]).toBeInstanceOf(NavigationDiscovery);
    });

    it("should maintain reference to the page object", () => {
      const service = new DiscoveryService(mockPage);
      expect(service["page"]).toBe(mockPage);
    });
  });

  describe("discoverAllFeatures - Real Implementation", () => {
    it("should discover all feature types with real DOM elements", async () => {
      // Create comprehensive mock elements
      const mockButton = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Submit"),
        getAttribute: vi.fn((attr) => {
          if (attr === "id") return "submit-btn";
          if (attr === "type") return "button";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
      });

      const mockInput = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "type") return "text";
          if (attr === "name") return "username";
          if (attr === "placeholder") return "Enter username";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      const mockMenu = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "role") return "navigation";
          return null;
        }),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([
            createMockLocator({ textContent: vi.fn().mockResolvedValue("Home") }),
            createMockLocator({ textContent: vi.fn().mockResolvedValue("About") }),
          ])
        }),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      const mockPanel = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "class") return "dashboard-panel";
          if (attr === "data-testid") return "main-panel";
          return null;
        }),
        textContent: vi.fn().mockResolvedValue("Dashboard"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      // Setup page.locator to return appropriate elements
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "button") {
          return { all: vi.fn().mockResolvedValue([mockButton]) };
        }
        if (selector === "input") {
          return { all: vi.fn().mockResolvedValue([mockInput]) };
        }
        if (selector.includes("nav") || selector.includes("[role=navigation]")) {
          return { all: vi.fn().mockResolvedValue([mockMenu]) };
        }
        if (selector.includes("panel") || selector.includes("card")) {
          return { all: vi.fn().mockResolvedValue([mockPanel]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const features = await discoveryService.discoverAllFeatures();

      // Verify the method was called and returned features
      expect(features).toBeDefined();
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBeGreaterThan(0);

      // Verify console output
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Starting comprehensive feature discovery"));
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("can be slow"));
    });

    it("should handle duplicate features by deduplicating based on selector", async () => {
      // Create duplicate button with same selector
      const duplicateButton = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Click Me"),
        getAttribute: vi.fn((attr) => attr === "id" ? "same-btn" : null),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
      });

      // Mock button discovery returning duplicates
      vi.spyOn(discoveryService["buttonDiscovery"], 'discoverButtons').mockResolvedValue([
        { type: "button", name: "Button 1", selector: "#same-btn", actions: ["click"] },
        { type: "button", name: "Button 2", selector: "#same-btn", actions: ["click"] }, // Duplicate selector
        { type: "button", name: "Button 3", selector: "#different-btn", actions: ["click"] },
      ]);

      // Mock other discoveries to return empty
      vi.spyOn(discoveryService["inputDiscovery"], 'discoverInputs').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverCharts').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverPanels').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverModals').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverTables').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverCustomComponents').mockResolvedValue([]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverMenus').mockResolvedValue([]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverDropdowns').mockResolvedValue([]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverTabs').mockResolvedValue([]);

      const features = await discoveryService.discoverAllFeatures();

      // Should only have 2 unique buttons (duplicate removed)
      expect(features).toHaveLength(2);
      expect(features[0].selector).toBe("#same-btn");
      expect(features[1].selector).toBe("#different-btn");
    });

    it("should handle null and undefined returns from discovery methods", async () => {
      // Mock some discoveries to return null/undefined
      vi.spyOn(discoveryService["buttonDiscovery"], 'discoverButtons').mockResolvedValue(null as any);
      vi.spyOn(discoveryService["inputDiscovery"], 'discoverInputs').mockResolvedValue(undefined as any);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverCharts').mockResolvedValue([
        { type: "chart", name: "Sales Chart", selector: "#chart1", actions: [] }
      ]);
      
      // Mock remaining as empty arrays
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverPanels').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverModals').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverTables').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverCustomComponents').mockResolvedValue([]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverMenus').mockResolvedValue([]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverDropdowns').mockResolvedValue([]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverTabs').mockResolvedValue([]);

      const features = await discoveryService.discoverAllFeatures();

      expect(features).toHaveLength(1);
      expect(features[0].type).toBe("chart");
    });

    it("should filter out invalid features", async () => {
      // Mock discoveries with invalid features
      vi.spyOn(discoveryService["buttonDiscovery"], 'discoverButtons').mockResolvedValue([
        { type: "button", name: "Valid", selector: "#valid", actions: [] },
        { type: "", name: "Invalid1", selector: "#invalid1", actions: [] } as any, // Missing type
        { type: "button", name: "", selector: "#invalid2", actions: [] } as any, // Missing name
        { type: "button", name: "Invalid3", selector: "", actions: [] } as any, // Missing selector
        null as any, // Null feature
        {} as any, // Empty object
      ]);

      // Mock other discoveries as empty
      vi.spyOn(discoveryService["inputDiscovery"], 'discoverInputs').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverCharts').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverPanels').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverModals').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverTables').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverCustomComponents').mockResolvedValue([]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverMenus').mockResolvedValue([]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverDropdowns').mockResolvedValue([]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverTabs').mockResolvedValue([]);

      const features = await discoveryService.discoverAllFeatures();

      // Should only include valid feature
      expect(features).toHaveLength(1);
      expect(features[0].name).toBe("Valid");
    });

    it("should run all discoveries in parallel", async () => {
      const delays = {
        button: 100,
        input: 150,
        chart: 200,
        panel: 50,
        modal: 75,
        table: 125,
        custom: 175,
        menu: 25,
        dropdown: 225,
        tab: 250
      };

      // Mock each discovery with delays to verify parallel execution
      vi.spyOn(discoveryService["buttonDiscovery"], 'discoverButtons').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), delays.button))
      );
      vi.spyOn(discoveryService["inputDiscovery"], 'discoverInputs').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), delays.input))
      );
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverCharts').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), delays.chart))
      );
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverPanels').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), delays.panel))
      );
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverModals').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), delays.modal))
      );
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverTables').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), delays.table))
      );
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverCustomComponents').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), delays.custom))
      );
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverMenus').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), delays.menu))
      );
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverDropdowns').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), delays.dropdown))
      );
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverTabs').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), delays.tab))
      );

      const startTime = Date.now();
      await discoveryService.discoverAllFeatures();
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // If running in parallel, should complete in roughly the time of the longest delay (250ms)
      // Adding buffer for execution overhead
      expect(totalTime).toBeLessThan(400); // Should be much less than sum of all delays (1525ms)
      expect(totalTime).toBeGreaterThanOrEqual(250); // At least as long as the longest delay
    });
  });

  describe("discoverDynamicFeatures", () => {
    it("should discover tooltips for button features", async () => {
      const existingFeatures: DiscoveredFeature[] = [
        { type: "button", name: "Submit", selector: "#submit", actions: ["click"] },
        { type: "input", name: "Email", selector: "#email", actions: ["fill"] },
      ];

      // Mock button discovery for tooltips
      vi.spyOn(discoveryService["buttonDiscovery"], 'discoverTooltips').mockResolvedValue(undefined);

      const dynamicFeatures = await discoveryService.discoverDynamicFeatures(existingFeatures);

      expect(dynamicFeatures).toBeDefined();
      expect(discoveryService["buttonDiscovery"].discoverTooltips).toHaveBeenCalledWith([
        { type: "button", name: "Submit", selector: "#submit", actions: ["click"] }
      ]);
    });

    it("should handle errors in dynamic discovery gracefully", async () => {
      const existingFeatures: DiscoveredFeature[] = [
        { type: "button", name: "Error", selector: "#error", actions: ["click"] },
      ];

      // Mock tooltip discovery to throw error
      vi.spyOn(discoveryService["buttonDiscovery"], 'discoverTooltips').mockRejectedValue(
        new Error("Tooltip discovery failed")
      );

      const dynamicFeatures = await discoveryService.discoverDynamicFeatures(existingFeatures);

      // Should handle error and return empty array or partial results
      expect(dynamicFeatures).toBeDefined();
      expect(Array.isArray(dynamicFeatures)).toBe(true);
    });
  });

  describe("discoverEssentials", () => {
    it("should discover only essential features quickly", async () => {
      // Mock discoveries to return mix of essential and non-essential
      vi.spyOn(discoveryService["buttonDiscovery"], 'discoverButtons').mockResolvedValue([
        { type: "button", name: "Submit", selector: "#submit", actions: ["click"] },
        { type: "button", name: "Cancel", selector: "#cancel", actions: ["click"] },
      ]);
      vi.spyOn(discoveryService["inputDiscovery"], 'discoverInputs').mockResolvedValue([
        { type: "input", name: "Search", selector: "#search", actions: ["fill"] },
      ]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverMenus').mockResolvedValue([
        { type: "menu", name: "Main Nav", selector: "nav", actions: ["navigate"] },
      ]);

      const features = await discoveryService.discoverEssentials();

      expect(features).toBeDefined();
      expect(Array.isArray(features)).toBe(true);
    });

    it("should log performance mode message", async () => {
      // Mock discoveries
      vi.spyOn(discoveryService["buttonDiscovery"], 'discoverButtons').mockResolvedValue([]);
      vi.spyOn(discoveryService["inputDiscovery"], 'discoverInputs').mockResolvedValue([]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverMenus').mockResolvedValue([]);

      await discoveryService.discoverEssentials();

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("essential discovery"));
    });

    it("should respect maxElementsPerType option", async () => {
      const features = await discoveryService.discoverEssentials({ maxElementsPerType: 5 });
      expect(features).toBeDefined();
    });

    it("should handle adaptive mode", async () => {
      const features = await discoveryService.discoverEssentials({ adaptive: true });
      expect(features).toBeDefined();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle page being null or undefined", () => {
      expect(() => new DiscoveryService(null as any)).not.toThrow();
      expect(() => new DiscoveryService(undefined as any)).not.toThrow();
    });

    it("should handle discovery method throwing errors", async () => {
      // Mock discovery to throw error
      vi.spyOn(discoveryService["buttonDiscovery"], 'discoverButtons').mockRejectedValue(
        new Error("Page crashed")
      );

      // Since Promise.all fails fast, the whole discovery should fail
      await expect(discoveryService.discoverAllFeatures()).rejects.toThrow("Page crashed");
    });

    it("should preserve feature order based on type priority", async () => {
      // Mock discoveries with specific types
      vi.spyOn(discoveryService["buttonDiscovery"], 'discoverButtons').mockResolvedValue([
        { type: "button", name: "Button1", selector: "#btn1", actions: [] }
      ]);
      vi.spyOn(discoveryService["inputDiscovery"], 'discoverInputs').mockResolvedValue([
        { type: "input", name: "Input1", selector: "#input1", actions: [] }
      ]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverMenus').mockResolvedValue([
        { type: "menu", name: "Menu1", selector: "#menu1", actions: [] }
      ]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverPanels').mockResolvedValue([
        { type: "panel", name: "Panel1", selector: "#panel1", actions: [] }
      ]);
      
      // Mock others as empty
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverCharts').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverModals').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverTables').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverCustomComponents').mockResolvedValue([]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverDropdowns').mockResolvedValue([]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverTabs').mockResolvedValue([]);

      const features = await discoveryService.discoverAllFeatures();

      // Check order: buttons -> inputs -> menus -> panels
      expect(features[0].type).toBe("button");
      expect(features[1].type).toBe("input");
      expect(features[2].type).toBe("menu");
      expect(features[3].type).toBe("panel");
    });

    it("should handle very large feature sets efficiently", async () => {
      const largeFeatureSet = Array.from({ length: 1000 }, (_, i) => ({
        type: "button",
        name: `Button ${i}`,
        selector: `#btn-${i}`,
        actions: ["click"]
      }));

      vi.spyOn(discoveryService["buttonDiscovery"], 'discoverButtons').mockResolvedValue(largeFeatureSet);
      
      // Mock others as empty
      vi.spyOn(discoveryService["inputDiscovery"], 'discoverInputs').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverCharts').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverPanels').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverModals').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverTables').mockResolvedValue([]);
      vi.spyOn(discoveryService["componentDiscovery"], 'discoverCustomComponents').mockResolvedValue([]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverMenus').mockResolvedValue([]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverDropdowns').mockResolvedValue([]);
      vi.spyOn(discoveryService["navigationDiscovery"], 'discoverTabs').mockResolvedValue([]);

      const startTime = Date.now();
      const features = await discoveryService.discoverAllFeatures();
      const endTime = Date.now();

      expect(features).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should process in under 1 second
    });
  });
});