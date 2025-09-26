import { describe, it, expect, beforeEach, vi } from "vitest";
import { FeatureDiscoveryCoordinator } from "../src/FeatureDiscoveryCoordinator";
import { createMockPage } from "./mocks/playwright.mock";

describe("FeatureDiscoveryCoordinator", () => {
  let mockPage: any;
  let coordinator: FeatureDiscoveryCoordinator;

  beforeEach(() => {
    mockPage = createMockPage();
    coordinator = new FeatureDiscoveryCoordinator(mockPage);
    vi.clearAllMocks();
  });

  describe("runComplete", () => {
    it("should coordinate complete discovery and testing process", async () => {
      // Mock all the services
      const mockDiscoveredFeatures = [
        {
          type: "button" as const,
          name: "Submit",
          selector: "#submit-btn",
          attributes: { type: "submit" },
          actions: ["click"],
          enabled: true,
        },
        {
          type: "input" as const,
          name: "Email",
          selector: "#email",
          inputType: "email",
          attributes: { type: "email", name: "email" },
          actions: ["fill"],
          required: true,
        },
      ];

      const mockTestCases = [
        {
          name: "Click Submit button",
          steps: [{ action: "click", selector: "#submit-btn" }],
          feature: mockDiscoveredFeatures[0],
          assertions: [],
        },
        {
          name: "Fill Email input",
          steps: [{ action: "fill", selector: "#email", value: "test@example.com" }],
          feature: mockDiscoveredFeatures[1],
          assertions: [],
        },
      ];

      const mockTestResults = [
        {
          testCase: mockTestCases[0],
          success: true,
          duration: 150,
          error: null,
          screenshot: null,
        },
        {
          testCase: mockTestCases[1],
          success: true,
          duration: 200,
          error: null,
          screenshot: null,
        },
      ];

      const mockStructure = {
        totalElements: 2,
        interactiveElements: 2,
        forms: 1,
        navigationItems: 0,
        complexity: "medium" as const,
      };

      const mockAccessibility = {
        missingLabels: 0,
        missingAltText: 0,
        keyboardNavigable: true,
      };

      // Mock the services
      const mockDiscoveryService = {
        discoverAllFeatures: vi.fn().mockResolvedValue(mockDiscoveredFeatures),
        discoverDynamicFeatures: vi.fn().mockResolvedValue([]),
      };

      const mockTestingService = {
        generateTestCases: vi.fn().mockResolvedValue(mockTestCases),
        executeTestCases: vi.fn().mockResolvedValue(mockTestResults),
      };

      const mockAnalysisService = {
        analyzePageStructure: vi.fn().mockResolvedValue(mockStructure),
        analyzeAccessibility: vi.fn().mockResolvedValue(mockAccessibility),
      };

      const mockReportGenerator = {
        generateDiscoveryReport: vi.fn().mockResolvedValue(undefined),
        generateHtmlReport: vi.fn().mockResolvedValue(undefined),
        generateMarkdownSummary: vi.fn().mockResolvedValue(undefined),
      };

      // Replace the coordinator's services with mocks
      Object.defineProperty(coordinator, "discoveryService", {
        value: mockDiscoveryService,
        writable: true,
      });
      Object.defineProperty(coordinator, "testingService", {
        value: mockTestingService,
        writable: true,
      });
      Object.defineProperty(coordinator, "analysisService", {
        value: mockAnalysisService,
        writable: true,
      });
      Object.defineProperty(coordinator, "reportGenerator", {
        value: mockReportGenerator,
        writable: true,
      });

      const result = await coordinator.runComplete();

      // Verify all services were called
      expect(mockDiscoveryService.discoverAllFeatures).toHaveBeenCalled();
      expect(mockDiscoveryService.discoverDynamicFeatures).toHaveBeenCalledWith(
        mockDiscoveredFeatures,
      );
      expect(mockTestingService.generateTestCases).toHaveBeenCalledWith(mockDiscoveredFeatures);
      expect(mockTestingService.executeTestCases).toHaveBeenCalledWith(mockTestCases);
      expect(mockAnalysisService.analyzePageStructure).toHaveBeenCalled();
      expect(mockAnalysisService.analyzeAccessibility).toHaveBeenCalled();
      expect(mockReportGenerator.generateDiscoveryReport).toHaveBeenCalled();
      expect(mockReportGenerator.generateHtmlReport).toHaveBeenCalled();
      expect(mockReportGenerator.generateMarkdownSummary).toHaveBeenCalled();

      // Verify the result structure
      expect(result).toHaveProperty("discovery");
      expect(result).toHaveProperty("analysis");
      expect(result).toHaveProperty("testing");
      expect(result.discovery.features).toEqual(mockDiscoveredFeatures);
      expect(result.discovery.count).toBe(2);
      expect(result.discovery.byType).toEqual({ button: 1, input: 1 });
      expect(result.testing.testCases).toEqual(mockTestCases);
      expect(result.testing.testResults).toEqual(mockTestResults);
      expect(result.testing.executed).toBe(true);
    });

    it("should handle discovery errors gracefully", async () => {
      const mockDiscoveryService = {
        discoverAllFeatures: vi.fn().mockRejectedValue(new Error("Discovery failed")),
        discoverDynamicFeatures: vi.fn().mockResolvedValue([]),
      };

      Object.defineProperty(coordinator, "discoveryService", {
        value: mockDiscoveryService,
        writable: true,
      });

      await expect(coordinator.runComplete()).rejects.toThrow("Discovery failed");
    });

    it("should handle testing errors and continue with analysis", async () => {
      const mockDiscoveredFeatures = [
        {
          type: "button" as const,
          name: "Test Button",
          selector: "#test",
          actions: ["click"],
        },
      ];

      const mockDiscoveryService = {
        discoverAllFeatures: vi.fn().mockResolvedValue(mockDiscoveredFeatures),
        discoverDynamicFeatures: vi.fn().mockResolvedValue([]),
      };

      const mockTestingService = {
        generateTestCases: vi.fn().mockRejectedValue(new Error("Testing failed")),
        executeTestCases: vi.fn().mockResolvedValue([]),
      };

      const mockAnalysisService = {
        analyzePageStructure: vi.fn().mockResolvedValue({}),
        analyzeAccessibility: vi.fn().mockResolvedValue({}),
      };

      Object.defineProperty(coordinator, "discoveryService", {
        value: mockDiscoveryService,
        writable: true,
      });
      Object.defineProperty(coordinator, "testingService", {
        value: mockTestingService,
        writable: true,
      });
      Object.defineProperty(coordinator, "analysisService", {
        value: mockAnalysisService,
        writable: true,
      });

      // Should throw the testing error
      await expect(coordinator.runComplete()).rejects.toThrow("Testing failed");
    });

    it("should handle empty discovery results", async () => {
      const mockDiscoveryService = {
        discoverAllFeatures: vi.fn().mockResolvedValue([]),
        discoverDynamicFeatures: vi.fn().mockResolvedValue([]),
      };

      const mockTestingService = {
        generateTestCases: vi.fn().mockResolvedValue([]),
        executeTestCases: vi.fn().mockResolvedValue([]),
      };

      const mockAnalysisService = {
        analyzePageStructure: vi.fn().mockResolvedValue({}),
        analyzeAccessibility: vi.fn().mockResolvedValue({}),
      };

      const mockReportGenerator = {
        generateDiscoveryReport: vi.fn().mockResolvedValue(undefined),
        generateHtmlReport: vi.fn().mockResolvedValue(undefined),
        generateMarkdownSummary: vi.fn().mockResolvedValue(undefined),
      };

      Object.defineProperty(coordinator, "discoveryService", {
        value: mockDiscoveryService,
        writable: true,
      });
      Object.defineProperty(coordinator, "testingService", {
        value: mockTestingService,
        writable: true,
      });
      Object.defineProperty(coordinator, "analysisService", {
        value: mockAnalysisService,
        writable: true,
      });
      Object.defineProperty(coordinator, "reportGenerator", {
        value: mockReportGenerator,
        writable: true,
      });

      const result = await coordinator.runComplete();

      expect(result.discovery.features).toEqual([]);
      expect(result.discovery.count).toBe(0);
      expect(result.testing.testCases).toEqual([]);
      expect(result.testing.testResults).toEqual([]);
    });

    it("should skip test execution when includeTestExecution is false", async () => {
      coordinator = new FeatureDiscoveryCoordinator(mockPage, {
        includeTestExecution: false,
      });

      const mockDiscoveredFeatures = [
        {
          type: "button" as const,
          name: "Test Button",
          selector: "#test",
          actions: ["click"],
        },
      ];

      const mockTestCases = [
        {
          name: "Test case",
          steps: [],
          feature: mockDiscoveredFeatures[0],
          assertions: [],
        },
      ];

      const mockDiscoveryService = {
        discoverAllFeatures: vi.fn().mockResolvedValue(mockDiscoveredFeatures),
        discoverDynamicFeatures: vi.fn().mockResolvedValue([]),
      };

      const mockTestingService = {
        generateTestCases: vi.fn().mockResolvedValue(mockTestCases),
        executeTestCases: vi.fn(),
      };

      const mockAnalysisService = {
        analyzePageStructure: vi.fn().mockResolvedValue({}),
        analyzeAccessibility: vi.fn().mockResolvedValue({}),
      };

      const mockReportGenerator = {
        generateDiscoveryReport: vi.fn().mockResolvedValue(undefined),
        generateHtmlReport: vi.fn().mockResolvedValue(undefined),
        generateMarkdownSummary: vi.fn().mockResolvedValue(undefined),
      };

      Object.defineProperty(coordinator, "discoveryService", {
        value: mockDiscoveryService,
        writable: true,
      });
      Object.defineProperty(coordinator, "testingService", {
        value: mockTestingService,
        writable: true,
      });
      Object.defineProperty(coordinator, "analysisService", {
        value: mockAnalysisService,
        writable: true,
      });
      Object.defineProperty(coordinator, "reportGenerator", {
        value: mockReportGenerator,
        writable: true,
      });

      const result = await coordinator.runComplete();

      expect(mockTestingService.executeTestCases).not.toHaveBeenCalled();
      expect(result.testing.executed).toBe(false);
      expect(result.testing.testResults).toEqual([]);
    });
  });

  describe("discoverFeatures", () => {
    it("should discover and aggregate features", async () => {
      const mockStaticFeatures = [
        {
          type: "button" as const,
          name: "Button 1",
          selector: "#btn1",
          actions: ["click"],
        },
      ];

      const mockDynamicFeatures = [
        {
          type: "menu" as const,
          name: "Dynamic Menu",
          selector: ".menu",
          actions: ["click"],
        },
      ];

      const mockDiscoveryService = {
        discoverAllFeatures: vi.fn().mockResolvedValue(mockStaticFeatures),
        discoverDynamicFeatures: vi.fn().mockResolvedValue(mockDynamicFeatures),
      };

      Object.defineProperty(coordinator, "discoveryService", {
        value: mockDiscoveryService,
        writable: true,
      });

      const result = await coordinator.discoverFeatures();

      expect(result.features).toHaveLength(2);
      expect(result.features).toEqual([...mockStaticFeatures, ...mockDynamicFeatures]);
      expect(result.count).toBe(2);
      expect(result.byType).toEqual({ button: 1, menu: 1 });
    });
  });

  describe("generateTests", () => {
    it("should generate test cases for features", async () => {
      const mockFeatures = [
        {
          type: "button" as const,
          name: "Test Button",
          selector: "#test",
          actions: ["click"],
        },
      ];

      const mockTestCases = [
        {
          name: "Test case",
          steps: [],
          feature: mockFeatures[0],
          assertions: [],
        },
      ];

      const mockTestingService = {
        generateTestCases: vi.fn().mockResolvedValue(mockTestCases),
      };

      Object.defineProperty(coordinator, "testingService", {
        value: mockTestingService,
        writable: true,
      });

      const result = await coordinator.generateTests(mockFeatures);

      expect(mockTestingService.generateTestCases).toHaveBeenCalledWith(mockFeatures);
      expect(result).toEqual(mockTestCases);
    });
  });

  describe("executeTests", () => {
    it("should execute test cases", async () => {
      const mockTestCases = [
        {
          name: "Test case",
          steps: [],
          feature: null as any,
          assertions: [],
        },
      ];

      const mockTestResults = [
        {
          testCase: mockTestCases[0],
          success: true,
          duration: 100,
          error: null,
          screenshot: null,
        },
      ];

      const mockTestingService = {
        executeTestCases: vi.fn().mockResolvedValue(mockTestResults),
      };

      Object.defineProperty(coordinator, "testingService", {
        value: mockTestingService,
        writable: true,
      });

      const result = await coordinator.executeTests(mockTestCases);

      expect(mockTestingService.executeTestCases).toHaveBeenCalledWith(mockTestCases);
      expect(result).toEqual(mockTestResults);
    });
  });

  describe("analyzePage", () => {
    it("should analyze page structure and accessibility", async () => {
      const mockStructure = { elements: 10 };
      const mockAccessibility = { issues: 0 };

      const mockAnalysisService = {
        analyzePageStructure: vi.fn().mockResolvedValue(mockStructure),
        analyzeAccessibility: vi.fn().mockResolvedValue(mockAccessibility),
      };

      Object.defineProperty(coordinator, "analysisService", {
        value: mockAnalysisService,
        writable: true,
      });

      const result = await coordinator.analyzePage();

      expect(mockAnalysisService.analyzePageStructure).toHaveBeenCalled();
      expect(mockAnalysisService.analyzeAccessibility).toHaveBeenCalled();
      expect(result).toEqual({
        structure: mockStructure,
        accessibility: mockAccessibility,
        url: mockPage.url(),
      });
    });
  });

  describe("generateReports", () => {
    it("should generate all report types", async () => {
      const mockFeatures = [
        {
          type: "button" as const,
          name: "Test",
          selector: "#test",
          actions: ["click"],
        },
      ];

      const mockTestCases = [
        {
          name: "Test case",
          steps: [],
          feature: mockFeatures[0],
          assertions: [],
        },
      ];

      const mockTestResults = [
        {
          testCase: mockTestCases[0],
          success: true,
          duration: 100,
          error: null,
          screenshot: null,
        },
      ];

      const mockReportGenerator = {
        generateDiscoveryReport: vi.fn().mockResolvedValue(undefined),
        generateHtmlReport: vi.fn().mockResolvedValue(undefined),
        generateMarkdownSummary: vi.fn().mockResolvedValue(undefined),
      };

      Object.defineProperty(coordinator, "reportGenerator", {
        value: mockReportGenerator,
        writable: true,
      });

      await coordinator.generateReports(mockFeatures, mockTestCases, mockTestResults);

      expect(mockReportGenerator.generateDiscoveryReport).toHaveBeenCalledWith(
        mockPage.url(),
        mockFeatures,
        mockTestCases,
        "feature-discovery-report.json",
      );
      expect(mockReportGenerator.generateHtmlReport).toHaveBeenCalledWith(
        mockFeatures,
        mockTestCases,
        mockTestResults,
        "intelligent-test-report.html",
      );
      expect(mockReportGenerator.generateMarkdownSummary).toHaveBeenCalledWith(
        mockFeatures,
        mockTestCases,
        mockTestResults,
        "combined-test-report.md",
      );
    });
  });
});
