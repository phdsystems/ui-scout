import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TestingService } from "../src/TestingService";
import { TestCaseGenerator } from "../src/TestCaseGenerator";
import { TestExecutor } from "../src/TestExecutor";
import { InputDiscovery } from "../src/InputDiscovery";
import { createMockPage } from "./mocks/playwright.mock";
import type { DiscoveredFeature, TestCase, TestExecutionResult } from "../src/types";

// Mock dependencies
vi.mock("../src/TestCaseGenerator");
vi.mock("../src/TestExecutor");
vi.mock("../src/InputDiscovery");

describe("TestingService - Comprehensive Tests", () => {
  let mockPage: any;
  let testingService: TestingService;
  let mockTestCaseGenerator: any;
  let mockTestExecutor: any;
  let mockInputDiscovery: any;

  beforeEach(() => {
    mockPage = createMockPage();
    
    // Setup mocks
    mockTestCaseGenerator = {
      generateTestCases: vi.fn()
    };
    mockTestExecutor = {
      executeTestCases: vi.fn()
    };
    mockInputDiscovery = {};

    (TestCaseGenerator as any).mockImplementation(() => mockTestCaseGenerator);
    (TestExecutor as any).mockImplementation(() => mockTestExecutor);
    (InputDiscovery as any).mockImplementation(() => mockInputDiscovery);

    testingService = new TestingService(mockPage);
    
    vi.clearAllMocks();
    
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Constructor and Initialization", () => {
    it("should initialize with required dependencies", () => {
      const service = new TestingService(mockPage);
      expect(service).toBeDefined();
      expect(InputDiscovery).toHaveBeenCalledWith(mockPage);
      expect(TestCaseGenerator).toHaveBeenCalledWith(mockInputDiscovery);
      expect(TestExecutor).toHaveBeenCalledWith(mockPage, "test-screenshots");
    });

    it("should accept custom screenshot path", () => {
      const customPath = "custom-screenshots";
      const service = new TestingService(mockPage, customPath);
      
      expect(service).toBeDefined();
      expect(TestExecutor).toHaveBeenCalledWith(mockPage, customPath);
    });

    it("should use default screenshot path when not provided", () => {
      const service = new TestingService(mockPage);
      
      expect(service).toBeDefined();
      expect(TestExecutor).toHaveBeenCalledWith(mockPage, "test-screenshots");
    });

    it("should handle null/undefined page", () => {
      expect(() => new TestingService(null as any)).not.toThrow();
      expect(() => new TestingService(undefined as any)).not.toThrow();
    });
  });

  describe("generateTestCases", () => {
    it("should generate test cases from features", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Submit Button",
          selector: "#submit",
          actions: ["click"]
        },
        {
          type: "input",
          name: "Email Field",
          selector: "#email",
          actions: ["fill"]
        }
      ];

      const mockTestCases: TestCase[] = [
        {
          feature: mockFeatures[0],
          steps: [{ action: "click", target: "#submit", value: "" }],
          assertions: [{ type: "visibility", target: "#success", expected: true }]
        },
        {
          feature: mockFeatures[1],
          steps: [{ action: "fill", target: "#email", value: "test@example.com" }],
          assertions: [{ type: "value", target: "#email", expected: "test@example.com" }]
        }
      ];

      mockTestCaseGenerator.generateTestCases.mockResolvedValue(mockTestCases);

      const result = await testingService.generateTestCases(mockFeatures);

      expect(result).toEqual(mockTestCases);
      expect(mockTestCaseGenerator.generateTestCases).toHaveBeenCalledWith(mockFeatures);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Generating test cases"));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Generated 2 test cases"));
    });

    it("should handle empty features array", async () => {
      const emptyFeatures: DiscoveredFeature[] = [];
      const emptyTestCases: TestCase[] = [];

      mockTestCaseGenerator.generateTestCases.mockResolvedValue(emptyTestCases);

      const result = await testingService.generateTestCases(emptyFeatures);

      expect(result).toEqual(emptyTestCases);
      expect(mockTestCaseGenerator.generateTestCases).toHaveBeenCalledWith(emptyFeatures);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Generated 0 test cases"));
    });

    it("should handle test case generator errors", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Error Button",
          selector: "#error",
          actions: ["click"]
        }
      ];

      mockTestCaseGenerator.generateTestCases.mockRejectedValue(new Error("Generation failed"));

      await expect(testingService.generateTestCases(mockFeatures)).rejects.toThrow("Generation failed");
    });

    it("should handle large feature sets", async () => {
      const largeFeatureSet: DiscoveredFeature[] = Array.from({ length: 100 }, (_, i) => ({
        type: "button",
        name: `Button ${i}`,
        selector: `#btn-${i}`,
        actions: ["click"]
      }));

      const largeTestCaseSet: TestCase[] = largeFeatureSet.map(feature => ({
        feature,
        steps: [{ action: "click", target: feature.selector, value: "" }],
        assertions: []
      }));

      mockTestCaseGenerator.generateTestCases.mockResolvedValue(largeTestCaseSet);

      const startTime = Date.now();
      const result = await testingService.generateTestCases(largeFeatureSet);
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete quickly
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Generated 100 test cases"));
    });

    it("should handle malformed features gracefully", async () => {
      const malformedFeatures: any[] = [
        null,
        undefined,
        {},
        { type: "button" }, // Missing required fields
        { name: "Test", selector: "#test" } // Missing type
      ];

      mockTestCaseGenerator.generateTestCases.mockResolvedValue([]);

      const result = await testingService.generateTestCases(malformedFeatures);

      expect(result).toEqual([]);
      expect(mockTestCaseGenerator.generateTestCases).toHaveBeenCalledWith(malformedFeatures);
    });
  });

  describe("executeTestCases", () => {
    it("should execute test cases and return results", async () => {
      const mockTestCases: TestCase[] = [
        {
          feature: {
            type: "button",
            name: "Submit Button",
            selector: "#submit",
            actions: ["click"]
          },
          steps: [{ action: "click", target: "#submit", value: "" }],
          assertions: [{ type: "visibility", target: "#success", expected: true }]
        }
      ];

      const mockResults: TestExecutionResult[] = [
        {
          testCase: mockTestCases[0],
          success: true,
          duration: 500,
          error: null,
          screenshot: null
        }
      ];

      mockTestExecutor.executeTestCases.mockResolvedValue(mockResults);

      const result = await testingService.executeTestCases(mockTestCases);

      expect(result).toEqual(mockResults);
      expect(mockTestExecutor.executeTestCases).toHaveBeenCalledWith(mockTestCases);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Executing test cases"));
    });

    it("should handle empty test cases array", async () => {
      const emptyTestCases: TestCase[] = [];
      const emptyResults: TestExecutionResult[] = [];

      mockTestExecutor.executeTestCases.mockResolvedValue(emptyResults);

      const result = await testingService.executeTestCases(emptyTestCases);

      expect(result).toEqual(emptyResults);
      expect(mockTestExecutor.executeTestCases).toHaveBeenCalledWith(emptyTestCases);
    });

    it("should handle test execution errors", async () => {
      const mockTestCases: TestCase[] = [
        {
          feature: {
            type: "button",
            name: "Error Button",
            selector: "#error",
            actions: ["click"]
          },
          steps: [{ action: "click", target: "#error", value: "" }],
          assertions: []
        }
      ];

      mockTestExecutor.executeTestCases.mockRejectedValue(new Error("Execution failed"));

      await expect(testingService.executeTestCases(mockTestCases)).rejects.toThrow("Execution failed");
    });

    it("should handle mixed success and failure results", async () => {
      const mockTestCases: TestCase[] = [
        {
          feature: { type: "button", name: "Success", selector: "#success", actions: ["click"] },
          steps: [{ action: "click", target: "#success", value: "" }],
          assertions: []
        },
        {
          feature: { type: "button", name: "Failure", selector: "#failure", actions: ["click"] },
          steps: [{ action: "click", target: "#failure", value: "" }],
          assertions: []
        }
      ];

      const mockResults: TestExecutionResult[] = [
        {
          testCase: mockTestCases[0],
          success: true,
          duration: 300,
          error: null,
          screenshot: null
        },
        {
          testCase: mockTestCases[1],
          success: false,
          duration: 150,
          error: "Element not found",
          screenshot: "failure-screenshot.png"
        }
      ];

      mockTestExecutor.executeTestCases.mockResolvedValue(mockResults);

      const result = await testingService.executeTestCases(mockTestCases);

      expect(result).toEqual(mockResults);
      expect(result[0].success).toBe(true);
      expect(result[1].success).toBe(false);
      expect(result[1].error).toBe("Element not found");
    });

    it("should handle large test case execution", async () => {
      const largeTestCaseSet: TestCase[] = Array.from({ length: 50 }, (_, i) => ({
        feature: {
          type: "button",
          name: `Button ${i}`,
          selector: `#btn-${i}`,
          actions: ["click"]
        },
        steps: [{ action: "click", target: `#btn-${i}`, value: "" }],
        assertions: []
      }));

      const largeResultSet: TestExecutionResult[] = largeTestCaseSet.map(testCase => ({
        testCase,
        success: true,
        duration: 100,
        error: null,
        screenshot: null
      }));

      mockTestExecutor.executeTestCases.mockResolvedValue(largeResultSet);

      const startTime = Date.now();
      const result = await testingService.executeTestCases(largeTestCaseSet);
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(50);
      expect(duration).toBeLessThan(2000); // Should complete within reasonable time
    });
  });

  describe("generateAndExecuteTests", () => {
    it("should generate and execute tests in sequence", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Test Button",
          selector: "#test",
          actions: ["click"]
        }
      ];

      const mockTestCases: TestCase[] = [
        {
          feature: mockFeatures[0],
          steps: [{ action: "click", target: "#test", value: "" }],
          assertions: [{ type: "visibility", target: "#result", expected: true }]
        }
      ];

      const mockResults: TestExecutionResult[] = [
        {
          testCase: mockTestCases[0],
          success: true,
          duration: 400,
          error: null,
          screenshot: null
        }
      ];

      mockTestCaseGenerator.generateTestCases.mockResolvedValue(mockTestCases);
      mockTestExecutor.executeTestCases.mockResolvedValue(mockResults);

      const result = await testingService.generateAndExecuteTests(mockFeatures);

      expect(result).toEqual({
        testCases: mockTestCases,
        results: mockResults
      });

      // Verify correct sequence of calls
      expect(mockTestCaseGenerator.generateTestCases).toHaveBeenCalledWith(mockFeatures);
      expect(mockTestExecutor.executeTestCases).toHaveBeenCalledWith(mockTestCases);
    });

    it("should handle complete workflow with empty features", async () => {
      const emptyFeatures: DiscoveredFeature[] = [];
      const emptyTestCases: TestCase[] = [];
      const emptyResults: TestExecutionResult[] = [];

      mockTestCaseGenerator.generateTestCases.mockResolvedValue(emptyTestCases);
      mockTestExecutor.executeTestCases.mockResolvedValue(emptyResults);

      const result = await testingService.generateAndExecuteTests(emptyFeatures);

      expect(result).toEqual({
        testCases: emptyTestCases,
        results: emptyResults
      });
    });

    it("should handle generation failure gracefully", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Error Button",
          selector: "#error",
          actions: ["click"]
        }
      ];

      mockTestCaseGenerator.generateTestCases.mockRejectedValue(new Error("Generation failed"));

      await expect(testingService.generateAndExecuteTests(mockFeatures)).rejects.toThrow("Generation failed");
      
      // Execution should not be called if generation fails
      expect(mockTestExecutor.executeTestCases).not.toHaveBeenCalled();
    });

    it("should handle execution failure after successful generation", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Test Button",
          selector: "#test",
          actions: ["click"]
        }
      ];

      const mockTestCases: TestCase[] = [
        {
          feature: mockFeatures[0],
          steps: [{ action: "click", target: "#test", value: "" }],
          assertions: []
        }
      ];

      mockTestCaseGenerator.generateTestCases.mockResolvedValue(mockTestCases);
      mockTestExecutor.executeTestCases.mockRejectedValue(new Error("Execution failed"));

      await expect(testingService.generateAndExecuteTests(mockFeatures)).rejects.toThrow("Execution failed");
      
      // Both generation and execution should have been attempted
      expect(mockTestCaseGenerator.generateTestCases).toHaveBeenCalledWith(mockFeatures);
      expect(mockTestExecutor.executeTestCases).toHaveBeenCalledWith(mockTestCases);
    });

    it("should handle complex workflow with multiple features", async () => {
      const complexFeatures: DiscoveredFeature[] = [
        { type: "button", name: "Submit", selector: "#submit", actions: ["click"] },
        { type: "input", name: "Email", selector: "#email", actions: ["fill"] },
        { type: "dropdown", name: "Country", selector: "#country", actions: ["select"] },
        { type: "checkbox", name: "Terms", selector: "#terms", actions: ["check"] }
      ];

      const complexTestCases: TestCase[] = complexFeatures.map(feature => ({
        feature,
        steps: [{ action: feature.actions[0], target: feature.selector, value: "test" }],
        assertions: [{ type: "visibility", target: feature.selector, expected: true }]
      }));

      const complexResults: TestExecutionResult[] = complexTestCases.map((testCase, index) => ({
        testCase,
        success: index % 2 === 0, // Alternate success/failure
        duration: 200 + index * 50,
        error: index % 2 === 0 ? null : "Test failed",
        screenshot: index % 2 === 0 ? null : `failure-${index}.png`
      }));

      mockTestCaseGenerator.generateTestCases.mockResolvedValue(complexTestCases);
      mockTestExecutor.executeTestCases.mockResolvedValue(complexResults);

      const result = await testingService.generateAndExecuteTests(complexFeatures);

      expect(result.testCases).toHaveLength(4);
      expect(result.results).toHaveLength(4);
      expect(result.results.filter(r => r.success)).toHaveLength(2);
      expect(result.results.filter(r => !r.success)).toHaveLength(2);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle dependency initialization errors", () => {
      (TestCaseGenerator as any).mockImplementation(() => {
        throw new Error("TestCaseGenerator initialization failed");
      });

      expect(() => new TestingService(mockPage)).toThrow("TestCaseGenerator initialization failed");
    });

    it("should handle concurrent test generation and execution", async () => {
      const features1: DiscoveredFeature[] = [
        { type: "button", name: "Button1", selector: "#btn1", actions: ["click"] }
      ];
      const features2: DiscoveredFeature[] = [
        { type: "button", name: "Button2", selector: "#btn2", actions: ["click"] }
      ];

      const testCases1: TestCase[] = [
        { feature: features1[0], steps: [], assertions: [] }
      ];
      const testCases2: TestCase[] = [
        { feature: features2[0], steps: [], assertions: [] }
      ];

      mockTestCaseGenerator.generateTestCases
        .mockResolvedValueOnce(testCases1)
        .mockResolvedValueOnce(testCases2);

      // Run concurrent operations
      const [result1, result2] = await Promise.all([
        testingService.generateTestCases(features1),
        testingService.generateTestCases(features2)
      ]);

      expect(result1).toEqual(testCases1);
      expect(result2).toEqual(testCases2);
    });

    it("should handle memory-intensive operations", async () => {
      const massiveFeatureSet: DiscoveredFeature[] = Array.from({ length: 1000 }, (_, i) => ({
        type: "button",
        name: `Button ${i}`,
        selector: `#btn-${i}`,
        actions: ["click"]
      }));

      const massiveTestCaseSet: TestCase[] = massiveFeatureSet.map(feature => ({
        feature,
        steps: [{ action: "click", target: feature.selector, value: "" }],
        assertions: []
      }));

      mockTestCaseGenerator.generateTestCases.mockResolvedValue(massiveTestCaseSet);

      const result = await testingService.generateTestCases(massiveFeatureSet);

      expect(result).toHaveLength(1000);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Generated 1000 test cases"));
    });

    it("should handle timeout scenarios", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        { type: "button", name: "Slow Button", selector: "#slow", actions: ["click"] }
      ];

      // Simulate slow generation
      mockTestCaseGenerator.generateTestCases.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      const startTime = Date.now();
      const result = await testingService.generateTestCases(mockFeatures);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it("should maintain state consistency across operations", async () => {
      const features: DiscoveredFeature[] = [
        { type: "button", name: "State Test", selector: "#state", actions: ["click"] }
      ];

      const testCases: TestCase[] = [
        { feature: features[0], steps: [], assertions: [] }
      ];

      const results: TestExecutionResult[] = [
        { testCase: testCases[0], success: true, duration: 100, error: null, screenshot: null }
      ];

      mockTestCaseGenerator.generateTestCases.mockResolvedValue(testCases);
      mockTestExecutor.executeTestCases.mockResolvedValue(results);

      // Multiple operations should maintain consistency
      const workflow1 = await testingService.generateAndExecuteTests(features);
      const workflow2 = await testingService.generateAndExecuteTests(features);

      expect(workflow1.testCases).toEqual(workflow2.testCases);
      expect(workflow1.results).toEqual(workflow2.results);
    });
  });

  describe("Integration Testing", () => {
    it("should properly integrate with TestCaseGenerator", async () => {
      const features: DiscoveredFeature[] = [
        { type: "input", name: "Search", selector: "#search", actions: ["fill"] }
      ];

      mockTestCaseGenerator.generateTestCases.mockResolvedValue([]);

      await testingService.generateTestCases(features);

      // Verify TestCaseGenerator was created with InputDiscovery
      expect(TestCaseGenerator).toHaveBeenCalledWith(mockInputDiscovery);
      expect(mockTestCaseGenerator.generateTestCases).toHaveBeenCalledWith(features);
    });

    it("should properly integrate with TestExecutor", async () => {
      const testCases: TestCase[] = [
        {
          feature: { type: "button", name: "Test", selector: "#test", actions: ["click"] },
          steps: [],
          assertions: []
        }
      ];

      mockTestExecutor.executeTestCases.mockResolvedValue([]);

      await testingService.executeTestCases(testCases);

      // Verify TestExecutor was created with correct parameters
      expect(TestExecutor).toHaveBeenCalledWith(mockPage, "test-screenshots");
      expect(mockTestExecutor.executeTestCases).toHaveBeenCalledWith(testCases);
    });

    it("should handle cross-dependency communication", async () => {
      const features: DiscoveredFeature[] = [
        { type: "form", name: "Login Form", selector: "#login", actions: ["submit"] }
      ];

      const testCases: TestCase[] = [
        { feature: features[0], steps: [], assertions: [] }
      ];

      const results: TestExecutionResult[] = [
        { testCase: testCases[0], success: true, duration: 200, error: null, screenshot: null }
      ];

      mockTestCaseGenerator.generateTestCases.mockResolvedValue(testCases);
      mockTestExecutor.executeTestCases.mockResolvedValue(results);

      const workflow = await testingService.generateAndExecuteTests(features);

      // Verify data flows correctly between components
      expect(workflow.testCases).toEqual(testCases);
      expect(workflow.results).toEqual(results);
      expect(workflow.results[0].testCase).toEqual(testCases[0]);
    });
  });
});