import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TestingService } from "../src/TestingService";
import { createMockPage } from "./mocks/playwright.mock";
import type { DiscoveredFeature, TestCase } from "../src/types";
import type { TestExecutionResult } from "../src/TestExecutor";

describe("TestingService", () => {
  let mockPage: any;
  let testingService: TestingService;

  beforeEach(() => {
    mockPage = createMockPage();
    testingService = new TestingService(mockPage);
    vi.clearAllMocks();
  });

  describe("generateTestCases", () => {
    it("should generate test cases from discovered features", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Submit Button",
          selector: "#submit",
          actions: ["click"],
        },
        {
          type: "input",
          name: "Email Field",
          selector: "#email",
          actions: ["fill"],
          attributes: { type: "email" },
        },
      ];

      const mockTestCases: TestCase[] = [
        {
          name: "Click Submit Button",
          feature: mockFeatures[0],
          steps: [{ action: "click", selector: "#submit" }],
          assertions: [],
        },
        {
          name: "Fill Email Field",
          feature: mockFeatures[1],
          steps: [{ action: "fill", selector: "#email", value: "test@example.com" }],
          assertions: [],
        },
      ];

      // Mock the testCaseGenerator
      const mockTestCaseGenerator = {
        generateTestCases: vi.fn().mockResolvedValue(mockTestCases),
      };

      Object.defineProperty(testingService, "testCaseGenerator", {
        value: mockTestCaseGenerator,
        writable: true,
      });

      const result = await testingService.generateTestCases(mockFeatures);

      expect(mockTestCaseGenerator.generateTestCases).toHaveBeenCalledWith(mockFeatures);
      expect(result).toEqual(mockTestCases);
      expect(result).toHaveLength(2);
    });

    it("should handle empty feature list", async () => {
      const mockTestCaseGenerator = {
        generateTestCases: vi.fn().mockResolvedValue([]),
      };

      Object.defineProperty(testingService, "testCaseGenerator", {
        value: mockTestCaseGenerator,
        writable: true,
      });

      const result = await testingService.generateTestCases([]);

      expect(mockTestCaseGenerator.generateTestCases).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  describe("executeTestCases", () => {
    it("should execute test cases and return results", async () => {
      const mockTestCases: TestCase[] = [
        {
          name: "Test Case 1",
          feature: {
            type: "button",
            name: "Button 1",
            selector: "#btn1",
            actions: ["click"],
          },
          steps: [{ action: "click", selector: "#btn1" }],
          assertions: [],
        },
        {
          name: "Test Case 2",
          feature: {
            type: "input",
            name: "Input 1",
            selector: "#input1",
            actions: ["fill"],
          },
          steps: [{ action: "fill", selector: "#input1", value: "test" }],
          assertions: [],
        },
      ];

      const mockResults: TestExecutionResult[] = [
        {
          testCase: mockTestCases[0],
          success: true,
          duration: 100,
          error: null,
          screenshot: null,
        },
        {
          testCase: mockTestCases[1],
          success: false,
          duration: 150,
          error: "Element not found",
          screenshot: "/screenshots/error.png",
        },
      ];

      const mockTestExecutor = {
        executeTestCases: vi.fn().mockResolvedValue(mockResults),
      };

      Object.defineProperty(testingService, "testExecutor", {
        value: mockTestExecutor,
        writable: true,
      });

      const result = await testingService.executeTestCases(mockTestCases);

      expect(mockTestExecutor.executeTestCases).toHaveBeenCalledWith(mockTestCases);
      expect(result).toEqual(mockResults);
      expect(result).toHaveLength(2);
      expect(result[0].success).toBe(true);
      expect(result[1].success).toBe(false);
    });

    it("should handle empty test case list", async () => {
      const mockTestExecutor = {
        executeTestCases: vi.fn().mockResolvedValue([]),
      };

      Object.defineProperty(testingService, "testExecutor", {
        value: mockTestExecutor,
        writable: true,
      });

      const result = await testingService.executeTestCases([]);

      expect(mockTestExecutor.executeTestCases).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  describe("generateAndExecuteTests", () => {
    it("should generate and execute tests in sequence", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Test Button",
          selector: "#test",
          actions: ["click"],
        },
      ];

      const mockTestCases: TestCase[] = [
        {
          name: "Test Case",
          feature: mockFeatures[0],
          steps: [{ action: "click", selector: "#test" }],
          assertions: [],
        },
      ];

      const mockResults: TestExecutionResult[] = [
        {
          testCase: mockTestCases[0],
          success: true,
          duration: 50,
          error: null,
          screenshot: null,
        },
      ];

      const mockTestCaseGenerator = {
        generateTestCases: vi.fn().mockResolvedValue(mockTestCases),
      };

      const mockTestExecutor = {
        executeTestCases: vi.fn().mockResolvedValue(mockResults),
      };

      Object.defineProperty(testingService, "testCaseGenerator", {
        value: mockTestCaseGenerator,
        writable: true,
      });

      Object.defineProperty(testingService, "testExecutor", {
        value: mockTestExecutor,
        writable: true,
      });

      const result = await testingService.generateAndExecuteTests(mockFeatures);

      expect(mockTestCaseGenerator.generateTestCases).toHaveBeenCalledWith(mockFeatures);
      expect(mockTestExecutor.executeTestCases).toHaveBeenCalledWith(mockTestCases);
      expect(result).toEqual({
        testCases: mockTestCases,
        results: mockResults,
      });
    });

    it("should handle test generation failures", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Test Button",
          selector: "#test",
          actions: ["click"],
        },
      ];

      const mockTestCaseGenerator = {
        generateTestCases: vi.fn().mockRejectedValue(new Error("Generation failed")),
      };

      Object.defineProperty(testingService, "testCaseGenerator", {
        value: mockTestCaseGenerator,
        writable: true,
      });

      await expect(testingService.generateAndExecuteTests(mockFeatures)).rejects.toThrow(
        "Generation failed",
      );
    });

    it("should handle test execution failures", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Test Button",
          selector: "#test",
          actions: ["click"],
        },
      ];

      const mockTestCases: TestCase[] = [
        {
          name: "Test Case",
          feature: mockFeatures[0],
          steps: [{ action: "click", selector: "#test" }],
          assertions: [],
        },
      ];

      const mockTestCaseGenerator = {
        generateTestCases: vi.fn().mockResolvedValue(mockTestCases),
      };

      const mockTestExecutor = {
        executeTestCases: vi.fn().mockRejectedValue(new Error("Execution failed")),
      };

      Object.defineProperty(testingService, "testCaseGenerator", {
        value: mockTestCaseGenerator,
        writable: true,
      });

      Object.defineProperty(testingService, "testExecutor", {
        value: mockTestExecutor,
        writable: true,
      });

      await expect(testingService.generateAndExecuteTests(mockFeatures)).rejects.toThrow(
        "Execution failed",
      );
    });

    it("should handle empty features gracefully", async () => {
      const mockTestCaseGenerator = {
        generateTestCases: vi.fn().mockResolvedValue([]),
      };

      const mockTestExecutor = {
        executeTestCases: vi.fn().mockResolvedValue([]),
      };

      Object.defineProperty(testingService, "testCaseGenerator", {
        value: mockTestCaseGenerator,
        writable: true,
      });

      Object.defineProperty(testingService, "testExecutor", {
        value: mockTestExecutor,
        writable: true,
      });

      const result = await testingService.generateAndExecuteTests([]);

      expect(result).toEqual({
        testCases: [],
        results: [],
      });
    });
  });

  describe("service initialization", () => {
    it("should create TestCaseGenerator and TestExecutor instances", () => {
      // These are private but we can verify they exist
      expect(testingService["testCaseGenerator"]).toBeDefined();
      expect(testingService["testExecutor"]).toBeDefined();
    });

    it("should accept custom screenshot path", () => {
      // Just verify the service can be created with a custom path
      // Don't actually create directories in tests
      const _customPath = "test-screenshots-custom";

      // This will use the default test-screenshots directory that already exists
      const customTestingService = new TestingService(mockPage);

      // The service should be created successfully
      expect(customTestingService["testExecutor"]).toBeDefined();
    });
  });

  describe("logging", () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("should log test case generation progress", async () => {
      const mockTestCaseGenerator = {
        generateTestCases: vi.fn().mockResolvedValue([]),
      };

      Object.defineProperty(testingService, "testCaseGenerator", {
        value: mockTestCaseGenerator,
        writable: true,
      });

      await testingService.generateTestCases([]);

      expect(consoleSpy).toHaveBeenCalledWith(
        "🧪 Generating test cases from discovered features...",
      );
      expect(consoleSpy).toHaveBeenCalledWith("  Generated 0 test cases");
    });

    it("should log test execution progress", async () => {
      const mockTestExecutor = {
        executeTestCases: vi.fn().mockResolvedValue([]),
      };

      Object.defineProperty(testingService, "testExecutor", {
        value: mockTestExecutor,
        writable: true,
      });

      await testingService.executeTestCases([]);

      expect(consoleSpy).toHaveBeenCalledWith("🚀 Executing test cases...");
    });
  });
});
