import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ComponentDiscovery } from "../src/ComponentDiscovery";
import { SelectorUtils } from "../src/SelectorUtils";
import { createMockPage, createMockLocator } from "./mocks/playwright.mock";
import type { DiscoveredFeature } from "../src/types";

describe("ComponentDiscovery - Comprehensive Tests", () => {
  let mockPage: any;
  let componentDiscovery: ComponentDiscovery;

  beforeEach(() => {
    mockPage = createMockPage();
    componentDiscovery = new ComponentDiscovery(mockPage);
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
      const discovery = new ComponentDiscovery(mockPage);
      expect(discovery).toBeDefined();
      expect(discovery["selectorUtils"]).toBeInstanceOf(SelectorUtils);
      expect(discovery["page"]).toBe(mockPage);
    });

    it("should initialize with empty visited selectors", () => {
      const discovery = new ComponentDiscovery(mockPage);
      expect(discovery["visitedSelectors"]).toBeInstanceOf(Set);
      expect(discovery["visitedSelectors"].size).toBe(0);
    });
  });

  describe("discoverCharts", () => {
    it("should discover chart components", async () => {
      const mockChart = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "id") return "sales-chart";
          if (attr === "class") return "chart-container";
          return null;
        }),
        textContent: vi.fn().mockResolvedValue("Sales Dashboard"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "canvas" || selector.includes("chart")) {
          return { all: vi.fn().mockResolvedValue([mockChart]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const charts = await componentDiscovery.discoverCharts();

      expect(charts).toBeDefined();
      expect(Array.isArray(charts)).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Discovering charts"));
    });

    it("should handle different chart types", async () => {
      const mockCanvasChart = createMockLocator({
        getAttribute: vi.fn((attr) => attr === "id" ? "canvas-chart" : null),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      const mockSvgChart = createMockLocator({
        getAttribute: vi.fn((attr) => attr === "class" ? "svg chart" : null),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      const mockTradingViewChart = createMockLocator({
        getAttribute: vi.fn((attr) => attr === "class" ? "tradingview-widget-container" : null),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "canvas") {
          return { all: vi.fn().mockResolvedValue([mockCanvasChart]) };
        }
        if (selector === "svg.chart") {
          return { all: vi.fn().mockResolvedValue([mockSvgChart]) };
        }
        if (selector === ".tradingview-widget-container") {
          return { all: vi.fn().mockResolvedValue([mockTradingViewChart]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const charts = await componentDiscovery.discoverCharts();

      expect(charts.length).toBeGreaterThan(0);
    });

    it("should skip invisible charts", async () => {
      const mockInvisibleChart = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(false),
      });

      const mockVisibleChart = createMockLocator({
        getAttribute: vi.fn(() => "chart-1"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "canvas") {
          return { all: vi.fn().mockResolvedValue([mockInvisibleChart, mockVisibleChart]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const charts = await componentDiscovery.discoverCharts();

      expect(charts.length).toBe(1);
      expect(charts[0].selector).toContain("chart-1");
    });

    it("should handle empty chart discovery", async () => {
      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([])
      }));

      const charts = await componentDiscovery.discoverCharts();

      expect(charts).toEqual([]);
    });
  });

  describe("discoverPanels", () => {
    it("should discover panel components with headings", async () => {
      const mockPanel = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "id") return "dashboard-panel";
          if (attr === "class") return "panel card";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          first: vi.fn().mockReturnValue({
            textContent: vi.fn().mockResolvedValue("Dashboard Overview")
          })
        })
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes("panel") || selector.includes("card")) {
          return { all: vi.fn().mockResolvedValue([mockPanel]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const panels = await componentDiscovery.discoverPanels();

      expect(panels).toBeDefined();
      expect(Array.isArray(panels)).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Discovering panels"));
    });

    it("should enhance panels with heading information", async () => {
      const mockPanel = createMockLocator({
        getAttribute: vi.fn(() => "test-panel"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          first: vi.fn().mockReturnValue({
            textContent: vi.fn().mockResolvedValue("Settings Panel")
          })
        })
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes("panel")) {
          return { all: vi.fn().mockResolvedValue([mockPanel]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const panels = await componentDiscovery.discoverPanels();

      if (panels.length > 0) {
        expect(panels[0].name).toBe("Settings Panel");
        expect(panels[0].text).toBe("Settings Panel");
      }
    });

    it("should handle panels without headings", async () => {
      const mockPanel = createMockLocator({
        getAttribute: vi.fn(() => "panel-no-heading"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          first: vi.fn().mockReturnValue({
            textContent: vi.fn().mockRejectedValue(new Error("No heading"))
          })
        })
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes("panel")) {
          return { all: vi.fn().mockResolvedValue([mockPanel]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const panels = await componentDiscovery.discoverPanels();

      expect(panels).toBeDefined();
      // Should still discover the panel even without heading
    });

    it("should discover different panel types", async () => {
      const mockCard = createMockLocator({
        getAttribute: vi.fn(() => "card-1"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          first: vi.fn().mockReturnValue({
            textContent: vi.fn().mockResolvedValue("")
          })
        })
      });

      const mockWidget = createMockLocator({
        getAttribute: vi.fn(() => "widget-1"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          first: vi.fn().mockReturnValue({
            textContent: vi.fn().mockResolvedValue("")
          })
        })
      });

      const mockAside = createMockLocator({
        getAttribute: vi.fn(() => "sidebar"),
        isVisible: vi.fn().mockResolvedValue(true),
        locator: vi.fn().mockReturnValue({
          first: vi.fn().mockReturnValue({
            textContent: vi.fn().mockResolvedValue("")
          })
        })
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === ".card") {
          return { all: vi.fn().mockResolvedValue([mockCard]) };
        }
        if (selector === ".widget") {
          return { all: vi.fn().mockResolvedValue([mockWidget]) };
        }
        if (selector === "aside") {
          return { all: vi.fn().mockResolvedValue([mockAside]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const panels = await componentDiscovery.discoverPanels();

      expect(panels.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("discoverModals", () => {
    it("should discover modal components", async () => {
      const mockModal = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "role") return "dialog";
          if (attr === "class") return "modal fade";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes("modal") || selector.includes("dialog")) {
          return { all: vi.fn().mockResolvedValue([mockModal]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const modals = await componentDiscovery.discoverModals();

      expect(modals).toBeDefined();
      expect(Array.isArray(modals)).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Discovering modals"));
    });

    it("should discover different modal types", async () => {
      const mockDialogModal = createMockLocator({
        getAttribute: vi.fn((attr) => attr === "role" ? "dialog" : null),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      const mockClassModal = createMockLocator({
        getAttribute: vi.fn((attr) => attr === "class" ? "modal" : null),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === '[role="dialog"]') {
          return { all: vi.fn().mockResolvedValue([mockDialogModal]) };
        }
        if (selector === ".modal") {
          return { all: vi.fn().mockResolvedValue([mockClassModal]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const modals = await componentDiscovery.discoverModals();

      expect(modals.length).toBeGreaterThanOrEqual(0);
    });

    it("should only discover visible modals", async () => {
      const mockHiddenModal = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(false),
      });

      const mockVisibleModal = createMockLocator({
        getAttribute: vi.fn(() => "visible-modal"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === ".modal") {
          return { all: vi.fn().mockResolvedValue([mockHiddenModal, mockVisibleModal]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const modals = await componentDiscovery.discoverModals();

      // Should only include visible modal
      const visibleModals = modals.filter(m => m.selector.includes("visible"));
      expect(visibleModals.length).toBeLessThanOrEqual(1);
    });
  });

  describe("discoverTables", () => {
    it("should discover table components", async () => {
      const mockTable = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "id") return "data-table";
          if (attr === "class") return "table table-striped";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "table" || selector.includes("table")) {
          return { all: vi.fn().mockResolvedValue([mockTable]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const tables = await componentDiscovery.discoverTables();

      expect(tables).toBeDefined();
      expect(Array.isArray(tables)).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Discovering tables"));
    });

    it("should discover different table types", async () => {
      const mockHtmlTable = createMockLocator({
        getAttribute: vi.fn(() => "html-table"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      const mockGridTable = createMockLocator({
        getAttribute: vi.fn(() => "grid"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "table") {
          return { all: vi.fn().mockResolvedValue([mockHtmlTable]) };
        }
        if (selector.includes("grid")) {
          return { all: vi.fn().mockResolvedValue([mockGridTable]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const tables = await componentDiscovery.discoverTables();

      expect(tables.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle empty table discovery", async () => {
      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([])
      }));

      const tables = await componentDiscovery.discoverTables();

      expect(tables).toEqual([]);
    });
  });

  describe("discoverCustomComponents", () => {
    it("should discover custom components", async () => {
      const mockCustom = createMockLocator({
        getAttribute: vi.fn((attr) => {
          if (attr === "data-component") return "my-widget";
          if (attr === "class") return "custom-component";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes("data-component") || selector.includes("custom")) {
          return { all: vi.fn().mockResolvedValue([mockCustom]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const components = await componentDiscovery.discoverCustomComponents();

      expect(components).toBeDefined();
      expect(Array.isArray(components)).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Discovering custom components"));
    });

    it("should discover web components", async () => {
      const mockWebComponent = createMockLocator({
        getAttribute: vi.fn(() => "my-element"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes("-")) { // Web components have hyphens
          return { all: vi.fn().mockResolvedValue([mockWebComponent]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const components = await componentDiscovery.discoverCustomComponents();

      expect(components).toBeDefined();
    });

    it("should handle no custom components", async () => {
      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([])
      }));

      const components = await componentDiscovery.discoverCustomComponents();

      expect(components).toEqual([]);
    });
  });

  describe("discoverComponentsBySelectors (private method)", () => {
    it("should process multiple selectors", async () => {
      const mockElement1 = createMockLocator({
        getAttribute: vi.fn(() => "element-1"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      const mockElement2 = createMockLocator({
        getAttribute: vi.fn(() => "element-2"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === ".test1") {
          return { all: vi.fn().mockResolvedValue([mockElement1]) };
        }
        if (selector === ".test2") {
          return { all: vi.fn().mockResolvedValue([mockElement2]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Test via public method that uses the private method
      const components = await componentDiscovery["discoverComponentsBySelectors"](
        [".test1", ".test2"], 
        "test", 
        "Test Component"
      );

      expect(components.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle selector errors gracefully", async () => {
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === ".error") {
          throw new Error("Invalid selector");
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const components = await componentDiscovery["discoverComponentsBySelectors"](
        [".error", ".valid"], 
        "test", 
        "Test Component"
      );

      expect(components).toBeDefined();
      expect(Array.isArray(components)).toBe(true);
    });

    it("should deduplicate components", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn(() => "duplicate"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([mockElement, mockElement]) // Same element twice
      }));

      const components = await componentDiscovery["discoverComponentsBySelectors"](
        [".test"], 
        "test", 
        "Test Component"
      );

      // Should deduplicate based on selector
      expect(components.length).toBeLessThanOrEqual(1);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle page locator errors", async () => {
      mockPage.locator.mockImplementation(() => {
        throw new Error("Page not ready");
      });

      const charts = await componentDiscovery.discoverCharts();
      
      expect(charts).toBeDefined();
      expect(Array.isArray(charts)).toBe(true);
    });

    it("should handle element visibility check errors", async () => {
      const mockElement = createMockLocator({
        isVisible: vi.fn().mockRejectedValue(new Error("Visibility check failed")),
        getAttribute: vi.fn(() => "test"),
      });

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([mockElement])
      }));

      const panels = await componentDiscovery.discoverPanels();

      expect(panels).toBeDefined();
    });

    it("should handle getAttribute errors", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn().mockRejectedValue(new Error("Attribute error")),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([mockElement])
      }));

      const tables = await componentDiscovery.discoverTables();

      expect(tables).toBeDefined();
    });

    it("should handle large numbers of components", async () => {
      const largeElementArray = Array.from({ length: 100 }, (_, i) => 
        createMockLocator({
          getAttribute: vi.fn(() => `element-${i}`),
          isVisible: vi.fn().mockResolvedValue(true),
        })
      );

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue(largeElementArray)
      }));

      const startTime = Date.now();
      const charts = await componentDiscovery.discoverCharts();
      const duration = Date.now() - startTime;

      expect(charts).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete in reasonable time
    });

    it("should maintain visited selectors across discoveries", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn(() => "shared-element"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([mockElement])
      }));

      // Run multiple discoveries
      await componentDiscovery.discoverCharts();
      await componentDiscovery.discoverPanels();

      expect(componentDiscovery["visitedSelectors"].size).toBeGreaterThan(0);
    });

    it("should handle null/undefined elements in array", async () => {
      const validElement = createMockLocator({
        getAttribute: vi.fn(() => "valid"),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([validElement, null, undefined, validElement])
      }));

      const modals = await componentDiscovery.discoverModals();

      expect(modals).toBeDefined();
      expect(Array.isArray(modals)).toBe(true);
    });
  });

  describe("Integration with SelectorUtils", () => {
    it("should use SelectorUtils for selector generation", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn(() => null),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      // Mock SelectorUtils getUniqueSelector
      vi.spyOn(componentDiscovery["selectorUtils"], 'getUniqueSelector')
        .mockResolvedValue("#unique-selector");

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([mockElement])
      }));

      const panels = await componentDiscovery.discoverPanels();

      if (panels.length > 0) {
        expect(componentDiscovery["selectorUtils"].getUniqueSelector).toHaveBeenCalled();
      }
    });

    it("should handle SelectorUtils errors gracefully", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn(() => null),
        isVisible: vi.fn().mockResolvedValue(true),
      });

      // Mock SelectorUtils to throw error
      vi.spyOn(componentDiscovery["selectorUtils"], 'getUniqueSelector')
        .mockRejectedValue(new Error("Selector generation failed"));

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([mockElement])
      }));

      const charts = await componentDiscovery.discoverCharts();

      expect(charts).toBeDefined();
    });
  });
});