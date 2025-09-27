import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockPage } from "./mocks/playwright.mock";

// Test all main exports
import {
  // Core types should exist
  ButtonDiscovery,
  InputDiscovery,
  ComponentDiscovery,
  NavigationDiscovery,
  DiscoveryService,
  TestCaseGenerator,
  TestExecutor,
  ReportGenerator,
  SelectorUtils,
} from "../src/index";

describe("UI Scout - Integration Tests", () => {
  let mockPage: any;

  beforeEach(() => {
    mockPage = createMockPage();
    vi.clearAllMocks();
  });

  describe("Core Module Exports", () => {
    it("should export all discovery modules", () => {
      expect(ButtonDiscovery).toBeDefined();
      expect(InputDiscovery).toBeDefined();
      expect(ComponentDiscovery).toBeDefined();
      expect(NavigationDiscovery).toBeDefined();
      expect(DiscoveryService).toBeDefined();
    });

    it("should export test generation modules", () => {
      expect(TestCaseGenerator).toBeDefined();
      expect(TestExecutor).toBeDefined();
    });

    it("should export utility modules", () => {
      expect(ReportGenerator).toBeDefined();
      expect(SelectorUtils).toBeDefined();
    });
  });

  describe("Module Instantiation", () => {
    it("should create discovery service instances", () => {
      const buttonDiscovery = new ButtonDiscovery(mockPage);
      const inputDiscovery = new InputDiscovery(mockPage);
      const componentDiscovery = new ComponentDiscovery(mockPage);
      const navigationDiscovery = new NavigationDiscovery(mockPage);
      const discoveryService = new DiscoveryService(mockPage);

      expect(buttonDiscovery).toBeInstanceOf(ButtonDiscovery);
      expect(inputDiscovery).toBeInstanceOf(InputDiscovery);
      expect(componentDiscovery).toBeInstanceOf(ComponentDiscovery);
      expect(navigationDiscovery).toBeInstanceOf(NavigationDiscovery);
      expect(discoveryService).toBeInstanceOf(DiscoveryService);
    });

    it("should create test generation instances", () => {
      const testCaseGenerator = new TestCaseGenerator();
      const testExecutor = new TestExecutor(mockPage);
      const reportGenerator = new ReportGenerator();
      const selectorUtils = new SelectorUtils(mockPage);

      expect(testCaseGenerator).toBeInstanceOf(TestCaseGenerator);
      expect(testExecutor).toBeInstanceOf(TestExecutor);
      expect(reportGenerator).toBeInstanceOf(ReportGenerator);
      expect(selectorUtils).toBeInstanceOf(SelectorUtils);
    });
  });

  describe("End-to-End Workflow Integration", () => {
    it("should perform complete discovery and test generation workflow", async () => {
      // Setup mock page with elements
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "button") {
          return {
            all: vi.fn().mockResolvedValue([
              {
                getAttribute: vi.fn((attr) => attr === "id" ? "submit-btn" : null),
                textContent: vi.fn().mockResolvedValue("Submit"),
                isVisible: vi.fn().mockResolvedValue(true),
                isEnabled: vi.fn().mockResolvedValue(true),
              }
            ])
          };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // 1. Discovery phase
      const discoveryService = new DiscoveryService(mockPage);
      const features = await discoveryService.discoverEssentials();

      expect(features).toBeDefined();
      expect(Array.isArray(features)).toBe(true);

      // 2. Test generation phase
      const testGenerator = new TestCaseGenerator();
      const testCases = testGenerator.generateTestCases(features);

      expect(testCases).toBeDefined();
      expect(Array.isArray(testCases)).toBe(true);

      // 3. Report generation phase
      const reportGenerator = new ReportGenerator();
      const report = reportGenerator.generateDiscoveryReport(features, {
        url: "http://test.example.com",
        timestamp: new Date().toISOString(),
        totalTime: 1000,
        featuresDiscovered: features.length,
      });

      expect(report).toBeDefined();
      expect(typeof report).toBe("object");
    });

    it("should handle empty discovery gracefully", async () => {
      // Mock empty page
      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([])
      }));

      const discoveryService = new DiscoveryService(mockPage);
      const features = await discoveryService.discoverEssentials();

      expect(features).toEqual([]);

      const testGenerator = new TestCaseGenerator();
      const testCases = testGenerator.generateTestCases(features);

      expect(testCases).toEqual([]);

      const reportGenerator = new ReportGenerator();
      const report = reportGenerator.generateDiscoveryReport(features, {
        url: "http://empty.example.com",
        timestamp: new Date().toISOString(),
        totalTime: 500,
        featuresDiscovered: 0,
      });

      expect(report).toBeDefined();
      expect(report.features).toEqual([]);
    });

    it("should integrate specialized discovery modules", async () => {
      // Setup different element types
      const mockButton = {
        getAttribute: vi.fn((attr) => attr === "id" ? "btn" : null),
        textContent: vi.fn().mockResolvedValue("Click"),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
      };

      const mockInput = {
        getAttribute: vi.fn((attr) => {
          if (attr === "type") return "text";
          if (attr === "name") return "username";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
      };

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "button") {
          return { all: vi.fn().mockResolvedValue([mockButton]) };
        }
        if (selector === "input") {
          return { all: vi.fn().mockResolvedValue([mockInput]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Test individual discovery modules
      const buttonDiscovery = new ButtonDiscovery(mockPage);
      const inputDiscovery = new InputDiscovery(mockPage);

      const buttons = await buttonDiscovery.discoverButtons();
      const inputs = await inputDiscovery.discoverInputs();

      expect(buttons.length).toBeGreaterThan(0);
      expect(inputs.length).toBeGreaterThan(0);

      // Test integrated discovery
      const discoveryService = new DiscoveryService(mockPage);
      const allFeatures = await discoveryService.discoverEssentials();

      expect(allFeatures.length).toBeGreaterThanOrEqual(buttons.length + inputs.length);
    });

    it("should handle complex page structures", async () => {
      // Mock complex page with multiple element types
      const elements = {
        buttons: [
          {
            getAttribute: vi.fn((attr) => attr === "id" ? "submit" : null),
            textContent: vi.fn().mockResolvedValue("Submit"),
            isVisible: vi.fn().mockResolvedValue(true),
            isEnabled: vi.fn().mockResolvedValue(true),
          },
          {
            getAttribute: vi.fn((attr) => attr === "id" ? "cancel" : null),
            textContent: vi.fn().mockResolvedValue("Cancel"),
            isVisible: vi.fn().mockResolvedValue(true),
            isEnabled: vi.fn().mockResolvedValue(true),
          }
        ],
        inputs: [
          {
            getAttribute: vi.fn((attr) => {
              if (attr === "type") return "email";
              if (attr === "name") return "email";
              return null;
            }),
            isVisible: vi.fn().mockResolvedValue(true),
          }
        ],
        panels: [
          {
            getAttribute: vi.fn((attr) => attr === "class" ? "dashboard-panel" : null),
            isVisible: vi.fn().mockResolvedValue(true),
            locator: vi.fn().mockReturnValue({
              first: vi.fn().mockReturnValue({
                textContent: vi.fn().mockResolvedValue("Dashboard")
              })
            })
          }
        ]
      };

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "button") {
          return { all: vi.fn().mockResolvedValue(elements.buttons) };
        }
        if (selector === "input") {
          return { all: vi.fn().mockResolvedValue(elements.inputs) };
        }
        if (selector.includes("panel") || selector.includes("card")) {
          return { all: vi.fn().mockResolvedValue(elements.panels) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const discoveryService = new DiscoveryService(mockPage);
      const features = await discoveryService.discoverAllFeatures();

      expect(features.length).toBeGreaterThan(0);

      // Verify different types were discovered
      const buttonFeatures = features.filter(f => f.type === "button");
      const inputFeatures = features.filter(f => f.type === "input");
      
      expect(buttonFeatures.length).toBeGreaterThan(0);
      expect(inputFeatures.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle discovery errors gracefully", async () => {
      // Mock page that throws errors
      mockPage.locator.mockImplementation(() => {
        throw new Error("Page not ready");
      });

      const discoveryService = new DiscoveryService(mockPage);
      
      // Should handle errors without crashing
      await expect(discoveryService.discoverEssentials()).rejects.toThrow("Page not ready");
    });

    it("should continue workflow after partial failures", async () => {
      let callCount = 0;
      mockPage.locator.mockImplementation((selector: string) => {
        callCount++;
        if (callCount === 1) {
          throw new Error("First call fails");
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Individual modules should still work after first failure
      const buttonDiscovery = new ButtonDiscovery(mockPage);
      
      await expect(buttonDiscovery.discoverButtons()).rejects.toThrow("First call fails");
      
      // Second call should work
      const buttons = await buttonDiscovery.discoverButtons();
      expect(buttons).toBeDefined();
    });
  });

  describe("Performance Integration", () => {
    it("should complete discovery within reasonable time", async () => {
      // Mock large number of elements
      const largeElementSet = Array.from({ length: 20 }, (_, i) => ({
        getAttribute: vi.fn(() => `element-${i}`),
        textContent: vi.fn().mockResolvedValue(`Element ${i}`),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
      }));

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue(largeElementSet)
      }));

      const discoveryService = new DiscoveryService(mockPage);
      
      const startTime = Date.now();
      const features = await discoveryService.discoverEssentials();
      const duration = Date.now() - startTime;

      expect(features).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it("should handle parallel discoveries efficiently", async () => {
      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([])
      }));

      const buttonDiscovery = new ButtonDiscovery(mockPage);
      const inputDiscovery = new InputDiscovery(mockPage);
      const componentDiscovery = new ComponentDiscovery(mockPage);

      const startTime = Date.now();
      
      // Run discoveries in parallel
      const [buttons, inputs, charts] = await Promise.all([
        buttonDiscovery.discoverButtons(),
        inputDiscovery.discoverInputs(),
        componentDiscovery.discoverCharts(),
      ]);

      const duration = Date.now() - startTime;

      expect(buttons).toBeDefined();
      expect(inputs).toBeDefined();
      expect(charts).toBeDefined();
      expect(duration).toBeLessThan(2000); // Parallel should be faster
    });
  });

  describe("Data Flow Integration", () => {
    it("should maintain data integrity through workflow", async () => {
      const testButtonId = "integration-test-button";
      const testButtonText = "Integration Test";
      
      const mockButton = {
        getAttribute: vi.fn((attr) => attr === "id" ? testButtonId : null),
        textContent: vi.fn().mockResolvedValue(testButtonText),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
      };

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "button") {
          return { all: vi.fn().mockResolvedValue([mockButton]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Discovery
      const discoveryService = new DiscoveryService(mockPage);
      const features = await discoveryService.discoverEssentials();

      expect(features.length).toBe(1);
      expect(features[0].name).toBe(testButtonText);
      expect(features[0].selector).toContain(testButtonId);

      // Test generation
      const testGenerator = new TestCaseGenerator();
      const testCases = testGenerator.generateTestCases(features);

      expect(testCases.length).toBe(1);
      expect(testCases[0].feature.name).toBe(testButtonText);
      expect(testCases[0].steps.length).toBeGreaterThan(0);

      // Report generation
      const reportGenerator = new ReportGenerator();
      const report = reportGenerator.generateDiscoveryReport(features, {
        url: "http://integration.test",
        timestamp: new Date().toISOString(),
        totalTime: 1000,
        featuresDiscovered: features.length,
      });

      expect(report.features[0].name).toBe(testButtonText);
      expect(report.statistics.featuresDiscovered).toBe(1);
    });

    it("should handle feature deduplication correctly", async () => {
      const duplicateButton = {
        getAttribute: vi.fn((attr) => attr === "id" ? "duplicate-btn" : null),
        textContent: vi.fn().mockResolvedValue("Duplicate"),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
      };

      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([duplicateButton, duplicateButton]) // Same element twice
      }));

      const discoveryService = new DiscoveryService(mockPage);
      const features = await discoveryService.discoverEssentials();

      // Should deduplicate based on selector
      expect(features.length).toBe(1);
    });
  });

  describe("API Compatibility", () => {
    it("should maintain consistent return types", async () => {
      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([])
      }));

      const discoveryService = new DiscoveryService(mockPage);
      const features = await discoveryService.discoverEssentials();

      // Features should be properly typed array
      expect(Array.isArray(features)).toBe(true);
      features.forEach(feature => {
        expect(feature).toHaveProperty('type');
        expect(feature).toHaveProperty('name');
        expect(feature).toHaveProperty('selector');
        expect(feature).toHaveProperty('actions');
      });

      const testGenerator = new TestCaseGenerator();
      const testCases = testGenerator.generateTestCases(features);

      expect(Array.isArray(testCases)).toBe(true);
      testCases.forEach(testCase => {
        expect(testCase).toHaveProperty('feature');
        expect(testCase).toHaveProperty('steps');
        expect(testCase).toHaveProperty('assertions');
      });
    });

    it("should handle optional parameters correctly", async () => {
      mockPage.locator.mockImplementation(() => ({
        all: vi.fn().mockResolvedValue([])
      }));

      const discoveryService = new DiscoveryService(mockPage);
      
      // Test different parameter combinations
      const essentials1 = await discoveryService.discoverEssentials();
      const essentials2 = await discoveryService.discoverEssentials({});
      const essentials3 = await discoveryService.discoverEssentials({ maxElementsPerType: 5 });
      const essentials4 = await discoveryService.discoverEssentials({ adaptive: true });

      expect(essentials1).toBeDefined();
      expect(essentials2).toBeDefined();
      expect(essentials3).toBeDefined();
      expect(essentials4).toBeDefined();
    });
  });
});