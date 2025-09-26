import { describe, it, expect, beforeEach, vi } from "vitest";
import { TestCaseGenerator } from "../src/TestCaseGenerator";
import type { DiscoveredFeature } from "../src/types";

describe("TestCaseGenerator", () => {
  let testCaseGenerator: TestCaseGenerator;
  let mockInputDiscovery: any;

  beforeEach(() => {
    mockInputDiscovery = {
      getTestValueForInput: vi.fn().mockImplementation((type: string) => {
        const testDataMap: Record<string, string> = {
          text: "Test Text",
          email: "test@example.com",
          password: "Password123!",
          number: "42",
          date: "2024-01-01",
          tel: "555-1234",
        };
        return testDataMap[type] || "test value";
      }),
    };

    testCaseGenerator = new TestCaseGenerator(mockInputDiscovery);
    vi.clearAllMocks();
  });

  describe("generateTestCases", () => {
    it("should generate test cases for button features", async () => {
      const features: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Submit",
          selector: "#submit-btn",
          attributes: { type: "submit" },
          actions: ["click"],
        },
      ];

      const testCases = await testCaseGenerator.generateTestCases(features);

      expect(testCases).toHaveLength(1);
      expect(testCases[0].feature).toEqual(features[0]);
      expect(testCases[0].steps).toHaveLength(1);
      expect(testCases[0].steps[0].action).toBe("click");
      expect(testCases[0].steps[0].selector).toBe("#submit-btn");
      expect(testCases[0].assertions).toHaveLength(2);
      expect(testCases[0].assertions[0].type).toBe("visible");
      expect(testCases[0].assertions[1].type).toBe("visible");
      expect(testCases[0].assertions[1].description).toContain("remain visible after click");
    });

    it("should generate test cases for input features", async () => {
      const features: DiscoveredFeature[] = [
        {
          type: "input",
          name: "Email",
          selector: "#email",
          attributes: { type: "email", name: "email" },
          actions: ["fill"],
        },
      ];

      const testCases = await testCaseGenerator.generateTestCases(features);

      expect(testCases).toHaveLength(1);
      expect(testCases[0].steps).toHaveLength(1);
      expect(testCases[0].steps[0].action).toBe("fill");
      expect(testCases[0].steps[0].value).toBe("test@example.com");
      expect(mockInputDiscovery.getTestValueForInput).toHaveBeenCalledWith("email");
    });

    it("should generate test cases for navigation features", async () => {
      const features: DiscoveredFeature[] = [
        {
          type: "menu",
          name: "About Us",
          selector: "nav a[href='/about']",
          attributes: { href: "/about" },
          actions: ["click"],
        },
      ];

      const testCases = await testCaseGenerator.generateTestCases(features);

      expect(testCases).toHaveLength(1);
      expect(testCases[0].steps[0].action).toBe("click");
      expect(testCases[0].steps[0].selector).toBe("nav a[href='/about']");
    });

    it("should generate test cases for multiple actions", async () => {
      const features: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Interactive Button",
          selector: "#interactive-btn",
          attributes: { type: "button" },
          actions: ["click", "hover"],
        },
      ];

      const testCases = await testCaseGenerator.generateTestCases(features);

      expect(testCases).toHaveLength(1);
      expect(testCases[0].steps).toHaveLength(2);
      expect(testCases[0].steps[0].action).toBe("click");
      expect(testCases[0].steps[1].action).toBe("hover");
    });

    it("should handle features with no actions", async () => {
      const features: DiscoveredFeature[] = [
        {
          type: "panel",
          name: "Info Panel",
          selector: ".info-panel",
          attributes: {},
          actions: [],
        },
      ];

      const testCases = await testCaseGenerator.generateTestCases(features);

      // Should not generate test case for features with no actions
      expect(testCases).toHaveLength(0);
    });

    it("should generate test cases for dropdown selection", async () => {
      const features: DiscoveredFeature[] = [
        {
          type: "dropdown",
          name: "Country Selector",
          selector: "#country-select",
          attributes: {},
          actions: ["select"],
        },
      ];

      const testCases = await testCaseGenerator.generateTestCases(features);

      expect(testCases).toHaveLength(1);
      expect(testCases[0].steps[0].action).toBe("select");
    });

    it("should generate test cases for checkbox actions", async () => {
      const features: DiscoveredFeature[] = [
        {
          type: "input",
          name: "Terms Checkbox",
          selector: "#terms",
          attributes: { type: "checkbox" },
          actions: ["check"],
        },
      ];

      const testCases = await testCaseGenerator.generateTestCases(features);

      expect(testCases).toHaveLength(1);
      expect(testCases[0].steps[0].action).toBe("check");
    });

    it("should handle empty features array", async () => {
      const testCases = await testCaseGenerator.generateTestCases([]);
      expect(testCases).toEqual([]);
    });

    it("should generate proper assertions for all test cases", async () => {
      const features: DiscoveredFeature[] = [
        {
          type: "button",
          name: "Submit",
          selector: "#submit",
          attributes: {},
          actions: ["click"],
        },
      ];

      const testCases = await testCaseGenerator.generateTestCases(features);

      expect(testCases).toHaveLength(1);
      expect(testCases[0].assertions).toHaveLength(2);
      expect(testCases[0].assertions[0]).toMatchObject({
        type: "visible",
        selector: "#submit",
        description: "Submit should be visible",
      });
      expect(testCases[0].assertions[1]).toMatchObject({
        type: "visible",
        selector: "#submit",
        description: "Submit should remain visible after click",
      });
    });

    it("should call getDefaultTestValue when InputDiscovery method fails", async () => {
      mockInputDiscovery.getTestValueForInput.mockReturnValue(undefined);

      const features: DiscoveredFeature[] = [
        {
          type: "input",
          name: "Custom Input",
          selector: "#custom",
          attributes: { type: "custom" },
          actions: ["fill"],
        },
      ];

      const testCases = await testCaseGenerator.generateTestCases(features);

      expect(testCases).toHaveLength(1);
      expect(testCases[0].steps[0].value).toBe("Test Value"); // Default fallback
    });

    it("should handle features with complex attributes", async () => {
      const features: DiscoveredFeature[] = [
        {
          type: "input",
          name: "Password Field",
          selector: "#password",
          attributes: {
            type: "password",
            required: "true",
            minlength: "8",
            maxlength: "50",
          },
          actions: ["fill"],
        },
      ];

      const testCases = await testCaseGenerator.generateTestCases(features);

      expect(testCases).toHaveLength(1);
      expect(testCases[0].steps[0].value).toBe("Password123!");
      expect(mockInputDiscovery.getTestValueForInput).toHaveBeenCalledWith("password");
    });

    it("should generate test cases with screenshot actions", async () => {
      const features: DiscoveredFeature[] = [
        {
          type: "panel",
          name: "Dashboard Panel",
          selector: ".dashboard",
          actions: ["screenshot"],
        },
        {
          type: "chart",
          name: "Analytics Chart",
          selector: "#chart",
          actions: ["hover", "screenshot"],
        },
      ];

      const testCases = await testCaseGenerator.generateTestCases(features);

      expect(testCases).toHaveLength(2);

      // First test case - panel with screenshot
      expect(testCases[0].steps).toHaveLength(1);
      expect(testCases[0].steps[0]).toMatchObject({
        action: "screenshot",
        selector: ".dashboard",
        description: "Take screenshot of Dashboard Panel",
      });

      // Second test case - chart with hover and screenshot
      expect(testCases[1].steps).toHaveLength(2);
      expect(testCases[1].steps[0]).toMatchObject({
        action: "hover",
        selector: "#chart",
        description: "Hover over Analytics Chart",
      });
      expect(testCases[1].steps[1]).toMatchObject({
        action: "screenshot",
        selector: "#chart",
        description: "Take screenshot of Analytics Chart",
      });
    });

    it("should filter out null test cases", async () => {
      // Mock createTestCase to return null for some features
      const originalCreateTestCase = testCaseGenerator["createTestCase"];
      testCaseGenerator["createTestCase"] = vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          feature: { name: "Valid", type: "button", selector: "#valid" },
          steps: [{ action: "click", selector: "#valid", description: "Click" }],
          assertions: [{ type: "visible", selector: "#valid", description: "Should be visible" }],
        });

      const features: DiscoveredFeature[] = [
        { type: "other", name: "Invalid", selector: "#invalid", actions: [] },
        { type: "button", name: "Valid", selector: "#valid", actions: ["click"] },
      ];

      const testCases = await testCaseGenerator.generateTestCases(features);

      expect(testCases).toHaveLength(1);
      expect(testCases[0].feature.name).toBe("Valid");

      // Restore original method
      testCaseGenerator["createTestCase"] = originalCreateTestCase;
    });
  });
});
