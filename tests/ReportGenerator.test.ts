import { describe, it, beforeEach, vi } from "vitest";
import { ReportGenerator } from "../src/ReportGenerator";
import type { DiscoveredFeature, TestCase } from "../src/types";

describe("ReportGenerator", () => {
  let reportGenerator: ReportGenerator;

  beforeEach(() => {
    reportGenerator = new ReportGenerator();
    vi.clearAllMocks();
  });

  describe("generateDiscoveryReport", () => {
    it("should execute without errors", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Submit Button",
          selector: "#submit",
          attributes: { type: "submit" },
          actions: ["click"],
          text: "Submit",
        },
      ];

      const mockTestCases: TestCase[] = [
        {
          feature: mockFeatures[0],
          steps: [
            {
              action: "click",
              selector: "#submit",
              description: "Click Submit Button",
            },
          ],
          assertions: [
            {
              type: "visible",
              selector: "#submit",
              description: "Submit Button should be visible",
            },
          ],
        },
      ];

      // Test that the method completes successfully
      await reportGenerator.generateDiscoveryReport(
        "https://example.com/test",
        mockFeatures,
        mockTestCases,
        "test-report.json",
      );
      // If we reach here, the test passed
    });

    it("should handle empty input arrays", async () => {
      await reportGenerator.generateDiscoveryReport(
        "https://example.com",
        [],
        [],
        "empty-test.json",
      );
    });
  });

  describe("generateHtmlReport", () => {
    it("should execute without errors", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Submit",
          selector: "#submit",
          attributes: {},
          actions: ["click"],
          text: "Submit Form",
        },
      ];

      const mockTestCases: TestCase[] = [
        {
          feature: mockFeatures[0],
          steps: [],
          assertions: [],
        },
      ];

      const mockTestResults = [
        {
          featureName: "Submit",
          passed: true,
        },
      ];

      await reportGenerator.generateHtmlReport(
        mockFeatures,
        mockTestCases,
        mockTestResults,
        "test-report.html",
      );
    });

    it("should handle mixed test results", async () => {
      const mockTestResults = [
        { featureName: "Test 1", passed: true },
        { featureName: "Test 2", passed: false },
        { featureName: "Test 3", passed: true },
      ];

      await reportGenerator.generateHtmlReport([], [], mockTestResults, "mixed-results.html");
    });

    it("should handle empty test results", async () => {
      await reportGenerator.generateHtmlReport([], [], [], "no-results.html");
    });
  });

  describe("generateMarkdownSummary", () => {
    it("should execute without errors", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        {
          type: "input",
          name: "Search Input",
          selector: "#search",
          attributes: { type: "search" },
          actions: ["fill"],
          text: "",
        },
      ];

      const mockTestCases: TestCase[] = [
        {
          feature: mockFeatures[0],
          steps: [],
          assertions: [],
        },
      ];

      const mockTestResults = [
        {
          featureName: "Search Input",
          passed: false,
          error: "Element not found",
        },
      ];

      await reportGenerator.generateMarkdownSummary(
        mockFeatures,
        mockTestCases,
        mockTestResults,
        "report.md",
      );
    });

    it("should handle features with various properties", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        {
          type: "panel",
          name: "Dashboard Panel",
          selector: ".dashboard",
          attributes: { class: "panel widget" },
          actions: ["screenshot", "hover"],
          text: "Dashboard Content",
        },
        {
          type: "other",
          name: "Simple Element",
          selector: ".element",
          attributes: {},
          actions: undefined,
          text: undefined,
        },
      ];

      await reportGenerator.generateMarkdownSummary(mockFeatures, [], [], "feature-details.md");
    });

    it("should handle passed and failed tests", async () => {
      const mockTestResults = [
        { featureName: "Passed Test", passed: true },
        { featureName: "Failed Test", passed: false, error: "Timeout" },
      ];

      await reportGenerator.generateMarkdownSummary([], [], mockTestResults, "test-results.md");
    });
  });

  describe("feature statistics", () => {
    it("should handle various feature types and properties", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Button with text",
          selector: "#btn1",
          attributes: { type: "button", class: "primary" },
          actions: ["click"],
          text: "Click Me",
        },
        {
          type: "button",
          name: "Button without text",
          selector: "#btn2",
          attributes: { type: "button" },
          actions: ["click"],
        },
        {
          type: "input",
          name: "Input with no actions",
          selector: "#input1",
          attributes: { type: "text" },
        },
        {
          type: "chart",
          name: "Chart without attributes",
          selector: ".chart",
          actions: ["screenshot"],
        },
      ];

      // Test that it processes the various feature types without errors
      await reportGenerator.generateDiscoveryReport(
        "https://example.com",
        mockFeatures,
        [],
        "statistics-test.json",
      );
    });

    it("should handle features with empty attributes", async () => {
      const mockFeatures: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Button with empty attributes",
          selector: "#btn",
          attributes: {},
          actions: ["click"],
        },
      ];

      await reportGenerator.generateDiscoveryReport(
        "https://example.com",
        mockFeatures,
        [],
        "empty-attrs-test.json",
      );
    });
  });

  describe("large datasets", () => {
    it("should handle many features", async () => {
      const mockFeatures: DiscoveredFeature[] = Array.from({ length: 50 }, (_, i) => ({
        type: "button",
        name: `Button ${i + 1}`,
        selector: `#btn${i + 1}`,
        attributes: { id: `btn${i + 1}` },
        actions: ["click"],
      }));

      await reportGenerator.generateHtmlReport(mockFeatures, [], [], "many-features.html");
    });

    it("should handle many test results", async () => {
      const mockTestResults = Array.from({ length: 30 }, (_, i) => ({
        featureName: `Test ${i + 1}`,
        passed: i % 2 === 0, // Alternate between pass/fail
        error: i % 2 === 1 ? `Error ${i}` : undefined,
      }));

      await reportGenerator.generateMarkdownSummary([], [], mockTestResults, "many-results.md");
    });
  });
});
