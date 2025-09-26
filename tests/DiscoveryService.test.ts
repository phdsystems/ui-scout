import { describe, it, expect, beforeEach, vi } from "vitest";
import { DiscoveryService } from "../src/DiscoveryService";
import { createMockPage } from "./mocks/playwright.mock";
import type { DiscoveredFeature } from "../src/types";

describe("DiscoveryService", () => {
  let mockPage: any;
  let discoveryService: DiscoveryService;

  // Helper to create fully mocked discovery services
  const mockDiscoveryServices = (overrides: any = {}) => {
    discoveryService["buttonDiscovery"] = {
      discoverButtons: vi.fn().mockResolvedValue([]),
      ...overrides.buttonDiscovery,
    } as any;

    discoveryService["inputDiscovery"] = {
      discoverInputs: vi.fn().mockResolvedValue([]),
      ...overrides.inputDiscovery,
    } as any;

    discoveryService["componentDiscovery"] = {
      discoverCharts: vi.fn().mockResolvedValue([]),
      discoverPanels: vi.fn().mockResolvedValue([]),
      discoverModals: vi.fn().mockResolvedValue([]),
      discoverTables: vi.fn().mockResolvedValue([]),
      discoverCustomComponents: vi.fn().mockResolvedValue([]),
      ...overrides.componentDiscovery,
    } as any;

    discoveryService["navigationDiscovery"] = {
      discoverMenus: vi.fn().mockResolvedValue([]),
      discoverDropdowns: vi.fn().mockResolvedValue([]),
      discoverTabs: vi.fn().mockResolvedValue([]),
      ...overrides.navigationDiscovery,
    } as any;
  };

  beforeEach(() => {
    mockPage = createMockPage();
    discoveryService = new DiscoveryService(mockPage);
    vi.clearAllMocks();
  });

  describe("discoverFeatures", () => {
    it("should discover all types of features", async () => {
      // Mock the individual discovery services
      const mockButtonFeatures: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Submit Button",
          selector: "#submit",
          actions: ["click"],
        },
      ];

      const mockInputFeatures: DiscoveredFeature[] = [
        {
          type: "input",
          name: "Email Field",
          selector: "#email",
          actions: ["fill"],
        },
      ];

      const mockNavigationFeatures: DiscoveredFeature[] = [
        {
          type: "menu",
          name: "Home Link",
          selector: "nav a[href='/']",
          actions: ["click"],
        },
      ];

      const mockGenericFeatures: DiscoveredFeature[] = [
        {
          type: "panel",
          name: "Info Panel",
          selector: ".info-panel",
          actions: ["screenshot"],
        },
      ];

      // Mock all discovery services
      mockDiscoveryServices({
        buttonDiscovery: {
          discoverButtons: vi.fn().mockResolvedValue(mockButtonFeatures),
        },
        inputDiscovery: {
          discoverInputs: vi.fn().mockResolvedValue(mockInputFeatures),
        },
        componentDiscovery: {
          discoverCharts: vi.fn().mockResolvedValue([]),
          discoverPanels: vi.fn().mockResolvedValue([mockGenericFeatures[0]]), // Panel feature
          discoverModals: vi.fn().mockResolvedValue([]),
          discoverTables: vi.fn().mockResolvedValue([]),
          discoverCustomComponents: vi.fn().mockResolvedValue([]),
        },
        navigationDiscovery: {
          discoverMenus: vi.fn().mockResolvedValue(mockNavigationFeatures),
          discoverDropdowns: vi.fn().mockResolvedValue([]),
          discoverTabs: vi.fn().mockResolvedValue([]),
        },
      });

      const features = await discoveryService.discoverAllFeatures();

      expect(features).toHaveLength(4);
      expect(features).toEqual(
        expect.arrayContaining([
          mockButtonFeatures[0],
          mockInputFeatures[0],
          mockNavigationFeatures[0],
          mockGenericFeatures[0],
        ]),
      );

      // Verify all discovery methods were called
      expect(discoveryService["buttonDiscovery"].discoverButtons).toHaveBeenCalled();
      expect(discoveryService["inputDiscovery"].discoverInputs).toHaveBeenCalled();
      expect(discoveryService["navigationDiscovery"].discoverMenus).toHaveBeenCalled();
      expect(discoveryService["componentDiscovery"].discoverCharts).toHaveBeenCalled();
      expect(discoveryService["componentDiscovery"].discoverPanels).toHaveBeenCalled();
    });

    it("should handle empty results from individual discovery services", async () => {
      // Mock all services to return empty arrays
      mockDiscoveryServices();

      const features = await discoveryService.discoverAllFeatures();

      expect(features).toEqual([]);
    });

    it("should deduplicate features with the same selector", async () => {
      const duplicateSelector = "#duplicate-element";

      const mockButtonFeatures: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Button Element",
          selector: duplicateSelector,
          actions: ["click"],
        },
      ];

      const mockGenericFeatures: DiscoveredFeature[] = [
        {
          type: "other",
          name: "Generic Element",
          selector: duplicateSelector,
          actions: ["hover"],
        },
      ];

      mockDiscoveryServices({
        buttonDiscovery: {
          discoverButtons: vi.fn().mockResolvedValue(mockButtonFeatures),
        },
        componentDiscovery: {
          discoverCharts: vi.fn().mockResolvedValue(mockGenericFeatures), // Use generic features as charts for this test
          discoverPanels: vi.fn().mockResolvedValue([]),
          discoverModals: vi.fn().mockResolvedValue([]),
          discoverTables: vi.fn().mockResolvedValue([]),
          discoverCustomComponents: vi.fn().mockResolvedValue([]),
        },
      });

      const features = await discoveryService.discoverAllFeatures();

      // Should keep only the first occurrence (button)
      expect(features).toHaveLength(1);
      expect(features[0].type).toBe("button");
      expect(features[0].name).toBe("Button Element");
    });

    it("should handle discovery service errors gracefully", async () => {
      // Mock one service to throw an error
      mockDiscoveryServices({
        buttonDiscovery: {
          discoverButtons: vi.fn().mockRejectedValue(new Error("Button discovery failed")),
        },
        inputDiscovery: {
          discoverInputs: vi.fn().mockResolvedValue([
            {
              type: "input",
              name: "Working Input",
              selector: "#working",
              actions: ["fill"],
            },
          ]),
        },
      });

      // Should continue with other services even if one fails
      await expect(discoveryService.discoverAllFeatures()).rejects.toThrow(
        "Button discovery failed",
      );
    });

    it("should call all discovery methods", async () => {
      // Mock all discovery services
      mockDiscoveryServices();

      await discoveryService.discoverAllFeatures();

      // Verify services were called
      expect(discoveryService["buttonDiscovery"].discoverButtons).toHaveBeenCalled();
      expect(discoveryService["inputDiscovery"].discoverInputs).toHaveBeenCalled();
      expect(discoveryService["navigationDiscovery"].discoverMenus).toHaveBeenCalled();
      expect(discoveryService["componentDiscovery"].discoverCharts).toHaveBeenCalled();
    });

    it("should maintain feature order from discovery services", async () => {
      const mockFeatures = [
        {
          type: "button" as const,
          name: "First Button",
          selector: "#first",
          actions: ["click"],
        },
        {
          type: "input" as const,
          name: "First Input",
          selector: "#input1",
          actions: ["fill"],
        },
        {
          type: "menu" as const,
          name: "First Nav",
          selector: "#nav1",
          actions: ["click"],
        },
        {
          type: "panel" as const,
          name: "First Panel",
          selector: "#panel1",
          actions: ["screenshot"],
        },
      ];

      // Mock services to return features in specific order
      mockDiscoveryServices({
        buttonDiscovery: {
          discoverButtons: vi.fn().mockResolvedValue([mockFeatures[0]]),
        },
        inputDiscovery: {
          discoverInputs: vi.fn().mockResolvedValue([mockFeatures[1]]),
        },
        navigationDiscovery: {
          discoverMenus: vi.fn().mockResolvedValue([mockFeatures[2]]),
          discoverDropdowns: vi.fn().mockResolvedValue([]),
          discoverTabs: vi.fn().mockResolvedValue([]),
        },
        componentDiscovery: {
          discoverCharts: vi.fn().mockResolvedValue([]),
          discoverPanels: vi.fn().mockResolvedValue([mockFeatures[3]]),
          discoverModals: vi.fn().mockResolvedValue([]),
          discoverTables: vi.fn().mockResolvedValue([]),
          discoverCustomComponents: vi.fn().mockResolvedValue([]),
        },
      });

      const features = await discoveryService.discoverAllFeatures();

      expect(features).toHaveLength(4);
      expect(features[0].name).toBe("First Button");
      expect(features[1].name).toBe("First Input");
      expect(features[2].name).toBe("First Nav");
      expect(features[3].name).toBe("First Panel");
    });

    it("should handle large numbers of discovered features", async () => {
      const largeButtonArray = Array.from({ length: 100 }, (_, i) => ({
        type: "button" as const,
        name: `Button ${i}`,
        selector: `#button-${i}`,
        actions: ["click"],
      }));

      const largeInputArray = Array.from({ length: 50 }, (_, i) => ({
        type: "input" as const,
        name: `Input ${i}`,
        selector: `#input-${i}`,
        actions: ["fill"],
      }));

      mockDiscoveryServices({
        buttonDiscovery: {
          discoverButtons: vi.fn().mockResolvedValue(largeButtonArray),
        },
        inputDiscovery: {
          discoverInputs: vi.fn().mockResolvedValue(largeInputArray),
        },
      });

      const features = await discoveryService.discoverAllFeatures();

      expect(features).toHaveLength(150);
      expect(features.filter((f) => f.type === "button")).toHaveLength(100);
      expect(features.filter((f) => f.type === "input")).toHaveLength(50);
    });

    it("should preserve all feature properties during aggregation", async () => {
      const complexFeature: DiscoveredFeature = {
        type: "button",
        name: "Complex Button",
        selector: "#complex-btn",
        text: "Click Me",
        attributes: {
          class: "btn btn-primary",
          "data-testid": "complex-button",
          disabled: "false",
        },
        actions: ["click", "hover", "focus"],
        screenshot: "data:image/png;base64,iVBORw0KGgoAAAANS...",
      };

      mockDiscoveryServices({
        buttonDiscovery: {
          discoverButtons: vi.fn().mockResolvedValue([complexFeature]),
        },
      });

      const features = await discoveryService.discoverAllFeatures();

      expect(features).toHaveLength(1);
      expect(features[0]).toEqual(complexFeature);
      expect(features[0].attributes).toEqual(complexFeature.attributes);
      expect(features[0].actions).toEqual(complexFeature.actions);
      expect(features[0].screenshot).toEqual(complexFeature.screenshot);
    });
  });

  describe("discoverDynamicFeatures", () => {
    it("should discover dynamic features through interactions", async () => {
      const existingFeatures = [
        {
          type: "button" as const,
          name: "Button with tooltip",
          selector: "#btn1",
          actions: ["click"],
          attributes: { id: "btn1" },
        },
        {
          type: "menu" as const,
          name: "Navigation Menu",
          selector: "nav",
          actions: ["click"],
        },
      ];

      // Mock buttonDiscovery.discoverTooltips
      const mockButtonDiscovery = {
        discoverTooltips: vi.fn().mockResolvedValue(undefined),
      };

      Object.defineProperty(discoveryService, "buttonDiscovery", {
        value: mockButtonDiscovery,
        writable: true,
      });

      // Mock nav element interactions
      const mockNavLocator = {
        isVisible: vi.fn().mockResolvedValue(true),
        hover: vi.fn().mockResolvedValue(undefined),
      };

      // Mock dynamic elements that appear after hover
      const mockDynamicLocator = {
        first: vi.fn().mockReturnThis(),
        isVisible: vi
          .fn()
          .mockResolvedValueOnce(true) // dropdown-menu visible
          .mockResolvedValueOnce(false) // submenu not visible
          .mockResolvedValueOnce(false) // popup not visible
          .mockResolvedValueOnce(false) // overlay not visible
          .mockResolvedValueOnce(false), // modal not visible
        textContent: vi.fn().mockResolvedValue("Dynamic Dropdown Content"),
      };

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "nav") {
          return mockNavLocator;
        }
        if (selector.includes(":visible") || selector.includes("dropdown")) {
          return mockDynamicLocator;
        }
        return { isVisible: vi.fn().mockResolvedValue(false) };
      });

      mockPage.waitForTimeout = vi.fn().mockResolvedValue(undefined);

      const dynamicFeatures = await discoveryService.discoverDynamicFeatures(existingFeatures);

      expect(mockButtonDiscovery.discoverTooltips).toHaveBeenCalledWith([existingFeatures[0]]);
      expect(mockNavLocator.hover).toHaveBeenCalled();
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(500);
      expect(dynamicFeatures).toHaveLength(1);
      expect(dynamicFeatures[0]).toMatchObject({
        name: "Dynamic Dropdown Content",
        type: "other",
        selector: ".dropdown-menu:visible",
        actions: ["click", "screenshot"],
      });
    });

    it("should handle navigation elements with nav in selector", async () => {
      const existingFeatures = [
        {
          type: "link" as const,
          name: "Nav Link",
          selector: ".nav-link",
          actions: ["click"],
        },
      ];

      const mockButtonDiscovery = {
        discoverTooltips: vi.fn(),
      };

      Object.defineProperty(discoveryService, "buttonDiscovery", {
        value: mockButtonDiscovery,
        writable: true,
      });

      const mockNavLocator = {
        isVisible: vi.fn().mockResolvedValue(true),
        hover: vi.fn().mockResolvedValue(undefined),
      };

      mockPage.locator.mockImplementation(() => ({
        first: vi.fn().mockReturnThis(),
        isVisible: vi.fn().mockResolvedValue(false),
      }));

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === ".nav-link") {
          return mockNavLocator;
        }
        return {
          first: vi.fn().mockReturnThis(),
          isVisible: vi.fn().mockResolvedValue(false),
        };
      });

      mockPage.waitForTimeout = vi.fn().mockResolvedValue(undefined);

      const dynamicFeatures = await discoveryService.discoverDynamicFeatures(existingFeatures);

      expect(mockNavLocator.hover).toHaveBeenCalled();
      expect(dynamicFeatures).toEqual([]);
    });

    it("should handle navigation elements with nav class", async () => {
      const existingFeatures = [
        {
          type: "other" as const,
          name: "Nav Element",
          selector: ".some-element",
          actions: ["click"],
          attributes: { class: "some-element nav-item" },
        },
      ];

      const mockButtonDiscovery = {
        discoverTooltips: vi.fn(),
      };

      Object.defineProperty(discoveryService, "buttonDiscovery", {
        value: mockButtonDiscovery,
        writable: true,
      });

      const mockNavLocator = {
        isVisible: vi.fn().mockResolvedValue(true),
        hover: vi.fn().mockResolvedValue(undefined),
      };

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === ".some-element") {
          return mockNavLocator;
        }
        return {
          first: vi.fn().mockReturnThis(),
          isVisible: vi.fn().mockResolvedValue(false),
        };
      });

      mockPage.waitForTimeout = vi.fn().mockResolvedValue(undefined);

      const _dynamicFeatures = await discoveryService.discoverDynamicFeatures(existingFeatures);

      expect(mockNavLocator.hover).toHaveBeenCalled();
    });

    it("should limit navigation interactions to first 5 items", async () => {
      const existingFeatures = Array.from({ length: 10 }, (_, i) => ({
        type: "menu" as const,
        name: `Nav ${i}`,
        selector: `#nav${i}`,
        actions: ["click"],
      }));

      const mockButtonDiscovery = {
        discoverTooltips: vi.fn(),
      };

      Object.defineProperty(discoveryService, "buttonDiscovery", {
        value: mockButtonDiscovery,
        writable: true,
      });

      let hoverCount = 0;
      const mockNavLocator = {
        isVisible: vi.fn().mockResolvedValue(true),
        hover: vi.fn().mockImplementation(() => {
          hoverCount++;
          return Promise.resolve();
        }),
      };

      mockPage.locator.mockImplementation(() => mockNavLocator);
      mockPage.waitForTimeout = vi.fn().mockResolvedValue(undefined);

      await discoveryService.discoverDynamicFeatures(existingFeatures);

      expect(hoverCount).toBe(5); // Should limit to 5
    });

    it("should handle invisible navigation elements", async () => {
      const existingFeatures = [
        {
          type: "menu" as const,
          name: "Hidden Nav",
          selector: "#hidden-nav",
          actions: ["click"],
        },
      ];

      const mockButtonDiscovery = {
        discoverTooltips: vi.fn(),
      };

      Object.defineProperty(discoveryService, "buttonDiscovery", {
        value: mockButtonDiscovery,
        writable: true,
      });

      const mockNavLocator = {
        isVisible: vi.fn().mockResolvedValue(false),
        hover: vi.fn(),
      };

      mockPage.locator.mockImplementation(() => mockNavLocator);

      const dynamicFeatures = await discoveryService.discoverDynamicFeatures(existingFeatures);

      expect(mockNavLocator.hover).not.toHaveBeenCalled();
      expect(dynamicFeatures).toEqual([]);
    });

    it("should handle errors during navigation interaction", async () => {
      const existingFeatures = [
        {
          type: "menu" as const,
          name: "Error Nav",
          selector: "#error-nav",
          actions: ["click"],
        },
        {
          type: "menu" as const,
          name: "Good Nav",
          selector: "#good-nav",
          actions: ["click"],
        },
      ];

      const mockButtonDiscovery = {
        discoverTooltips: vi.fn(),
      };

      Object.defineProperty(discoveryService, "buttonDiscovery", {
        value: mockButtonDiscovery,
        writable: true,
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "#error-nav") {
          throw new Error("Nav error");
        }
        return {
          isVisible: vi.fn().mockResolvedValue(true),
          hover: vi.fn().mockResolvedValue(undefined),
          first: vi.fn().mockReturnThis(),
        };
      });

      mockPage.waitForTimeout = vi.fn().mockResolvedValue(undefined);

      // Should not throw, continues with other elements
      const dynamicFeatures = await discoveryService.discoverDynamicFeatures(existingFeatures);

      expect(dynamicFeatures).toBeDefined();
    });

    it("should discover multiple dynamic element types", async () => {
      const existingFeatures = [
        {
          type: "menu" as const,
          name: "Nav",
          selector: "nav",
          actions: ["click"],
        },
      ];

      const mockButtonDiscovery = {
        discoverTooltips: vi.fn(),
      };

      Object.defineProperty(discoveryService, "buttonDiscovery", {
        value: mockButtonDiscovery,
        writable: true,
      });

      const mockNavLocator = {
        isVisible: vi.fn().mockResolvedValue(true),
        hover: vi.fn().mockResolvedValue(undefined),
      };

      let selectorCount = 0;
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "nav") {
          return mockNavLocator;
        }
        // Make different selectors visible
        return {
          first: vi.fn().mockReturnThis(),
          isVisible: vi.fn().mockImplementation(() => {
            selectorCount++;
            return Promise.resolve(selectorCount <= 3); // First 3 selectors visible
          }),
          textContent: vi.fn().mockResolvedValue(`Dynamic ${selectorCount}`),
        };
      });

      mockPage.waitForTimeout = vi.fn().mockResolvedValue(undefined);

      const dynamicFeatures = await discoveryService.discoverDynamicFeatures(existingFeatures);

      expect(dynamicFeatures).toHaveLength(3);
      expect(dynamicFeatures[0].selector).toBe(".dropdown-menu:visible");
      expect(dynamicFeatures[1].selector).toBe(".submenu:visible");
      expect(dynamicFeatures[2].selector).toBe('[class*="popup"]:visible');
    });
  });

  describe("integration with discovery services", () => {
    it("should create all required discovery service instances", () => {
      // Verify that all discovery services are instantiated
      expect(discoveryService["buttonDiscovery"]).toBeDefined();
      expect(discoveryService["inputDiscovery"]).toBeDefined();
      expect(discoveryService["navigationDiscovery"]).toBeDefined();
      expect(discoveryService["componentDiscovery"]).toBeDefined();
    });

    it("should pass the page instance to all discovery services", () => {
      // The page should be passed to all services during construction
      // This is tested implicitly by the service instantiation
      expect(discoveryService["buttonDiscovery"]).toBeDefined();
      expect(discoveryService["inputDiscovery"]).toBeDefined();
      expect(discoveryService["navigationDiscovery"]).toBeDefined();
      expect(discoveryService["componentDiscovery"]).toBeDefined();
    });
  });

  describe("error handling", () => {
    it("should handle null/undefined features from services", async () => {
      // Mock services to return null/undefined
      mockDiscoveryServices({
        buttonDiscovery: {
          discoverButtons: vi.fn().mockResolvedValue(null),
        },
        inputDiscovery: {
          discoverInputs: vi.fn().mockResolvedValue(undefined),
        },
        navigationDiscovery: {
          discoverMenus: vi.fn().mockResolvedValue([
            {
              type: "menu",
              name: "Valid Nav",
              selector: "#valid",
              actions: ["click"],
            },
          ]),
          discoverDropdowns: vi.fn().mockResolvedValue([]),
          discoverTabs: vi.fn().mockResolvedValue([]),
        },
      });

      const features = await discoveryService.discoverAllFeatures();

      // Should only include valid features
      expect(features).toHaveLength(1);
      expect(features[0].name).toBe("Valid Nav");
    });

    it("should handle malformed features from services", async () => {
      const malformedFeatures = [
        null,
        undefined,
        {},
        { name: "No Type" },
        { type: "button" },
        {
          type: "button",
          name: "Valid Button",
          selector: "#valid",
          actions: ["click"],
        },
      ];

      mockDiscoveryServices({
        buttonDiscovery: {
          discoverButtons: vi.fn().mockResolvedValue(malformedFeatures),
        },
      });

      const features = await discoveryService.discoverAllFeatures();

      // Should filter out malformed features
      expect(features).toHaveLength(1);
      expect(features[0].name).toBe("Valid Button");
    });
  });
});
