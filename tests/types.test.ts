import { describe, it, expect } from "vitest";
import type {
  DiscoveredFeature,
  TestCase,
  TestStep,
  Assertion,
  DiscoveryReport,
  DiscoveryOptions,
} from "../src/types";

describe("Types and Interfaces", () => {
  describe("DiscoveredFeature", () => {
    it("should have all required properties", () => {
      const feature: DiscoveredFeature = {
        name: "Login Button",
        type: "button",
        selector: "#login-btn",
      };

      expect(feature.name).toBe("Login Button");
      expect(feature.type).toBe("button");
      expect(feature.selector).toBe("#login-btn");
    });

    it("should support all valid types", () => {
      const types = [
        "button",
        "menu",
        "panel",
        "input",
        "chart",
        "table",
        "modal",
        "dropdown",
        "tab",
        "other",
      ] as const;

      types.forEach((type) => {
        const feature: DiscoveredFeature = {
          name: `Test ${type}`,
          type: type,
          selector: `.${type}`,
        };

        expect(feature.type).toBe(type);
      });
    });

    it("should support optional properties", () => {
      const feature: DiscoveredFeature = {
        name: "Complex Feature",
        type: "panel",
        selector: ".panel",
        text: "Panel content text",
        attributes: {
          id: "main-panel",
          class: "panel primary",
          "data-testid": "main-panel",
        },
        children: [
          {
            name: "Child Button",
            type: "button",
            selector: ".child-btn",
          },
        ],
        actions: ["click", "hover", "screenshot"],
        screenshot: "base64-screenshot-data",
      };

      expect(feature.text).toBe("Panel content text");
      expect(feature.attributes).toEqual({
        id: "main-panel",
        class: "panel primary",
        "data-testid": "main-panel",
      });
      expect(feature.children).toHaveLength(1);
      expect(feature.children?.[0]?.name).toBe("Child Button");
      expect(feature.actions).toEqual(["click", "hover", "screenshot"]);
      expect(feature.screenshot).toBe("base64-screenshot-data");
    });

    it("should allow nested children", () => {
      const feature: DiscoveredFeature = {
        name: "Parent",
        type: "panel",
        selector: ".parent",
        children: [
          {
            name: "Child",
            type: "menu",
            selector: ".child",
            children: [
              {
                name: "Grandchild",
                type: "button",
                selector: ".grandchild",
              },
            ],
          },
        ],
      };

      expect(feature.children?.[0]?.children?.[0]?.name).toBe("Grandchild");
    });
  });

  describe("TestStep", () => {
    it("should support all action types", () => {
      const actions = [
        "click",
        "fill",
        "hover",
        "focus",
        "select",
        "check",
        "uncheck",
        "press",
        "screenshot",
      ] as const;

      actions.forEach((action) => {
        const step: TestStep = {
          action: action,
          selector: ".test-element",
          description: `Test ${action} action`,
        };

        expect(step.action).toBe(action);
      });
    });

    it("should support optional value property", () => {
      const stepWithValue: TestStep = {
        action: "fill",
        selector: "#email-input",
        value: "user@example.com",
        description: "Fill email field",
      };

      const stepWithoutValue: TestStep = {
        action: "click",
        selector: "#submit-btn",
        description: "Click submit button",
      };

      expect(stepWithValue.value).toBe("user@example.com");
      expect(stepWithoutValue.value).toBeUndefined();
    });
  });

  describe("Assertion", () => {
    it("should support all assertion types", () => {
      const types = [
        "visible",
        "hidden",
        "enabled",
        "disabled",
        "text",
        "count",
        "attribute",
        "class",
      ] as const;

      types.forEach((type) => {
        const assertion: Assertion = {
          type: type,
          selector: ".test-element",
          description: `Element should be ${type}`,
        };

        expect(assertion.type).toBe(type);
      });
    });

    it("should support expected value for complex assertions", () => {
      const textAssertion: Assertion = {
        type: "text",
        selector: "#message",
        expected: "Success!",
        description: "Message should show success text",
      };

      const countAssertion: Assertion = {
        type: "count",
        selector: ".list-item",
        expected: 5,
        description: "Should have 5 list items",
      };

      const attributeAssertion: Assertion = {
        type: "attribute",
        selector: "#input",
        expected: { name: "email", type: "email" },
        description: "Input should have correct attributes",
      };

      expect(textAssertion.expected).toBe("Success!");
      expect(countAssertion.expected).toBe(5);
      expect(attributeAssertion.expected).toEqual({ name: "email", type: "email" });
    });
  });

  describe("TestCase", () => {
    it("should combine feature, steps, and assertions", () => {
      const feature: DiscoveredFeature = {
        name: "Login Form",
        type: "panel",
        selector: "#login-form",
      };

      const steps: TestStep[] = [
        {
          action: "fill",
          selector: "#username",
          value: "testuser",
          description: "Enter username",
        },
        {
          action: "fill",
          selector: "#password",
          value: "password123",
          description: "Enter password",
        },
        {
          action: "click",
          selector: "#login-btn",
          description: "Click login button",
        },
      ];

      const assertions: Assertion[] = [
        {
          type: "visible",
          selector: "#dashboard",
          description: "Dashboard should be visible after login",
        },
        {
          type: "text",
          selector: "#welcome-message",
          expected: "Welcome, testuser!",
          description: "Welcome message should show username",
        },
      ];

      const testCase: TestCase = {
        feature,
        steps,
        assertions,
      };

      expect(testCase.feature.name).toBe("Login Form");
      expect(testCase.steps).toHaveLength(3);
      expect(testCase.assertions).toHaveLength(2);
    });
  });

  describe("DiscoveryReport", () => {
    it("should contain all required report data", () => {
      const features: DiscoveredFeature[] = [
        { name: "Button 1", type: "button", selector: "#btn1" },
        { name: "Input 1", type: "input", selector: "#input1" },
        { name: "Panel 1", type: "panel", selector: "#panel1" },
      ];

      const testCases: TestCase[] = [
        {
          feature: features[0],
          steps: [{ action: "click", selector: "#btn1", description: "Click button" }],
          assertions: [{ type: "visible", selector: "#result", description: "Result visible" }],
        },
      ];

      const report: DiscoveryReport = {
        timestamp: "2024-01-15T10:30:00Z",
        url: "https://example.com/app",
        featuresDiscovered: 3,
        features,
        testCases,
        statistics: {
          byType: {
            button: 1,
            input: 1,
            panel: 1,
          },
          interactive: 2,
          withText: 0,
          withAttributes: 0,
        },
      };

      expect(report.timestamp).toBe("2024-01-15T10:30:00Z");
      expect(report.url).toBe("https://example.com/app");
      expect(report.featuresDiscovered).toBe(3);
      expect(report.features).toHaveLength(3);
      expect(report.testCases).toHaveLength(1);
      expect(report.statistics.byType.button).toBe(1);
      expect(report.statistics.interactive).toBe(2);
    });

    it("should validate statistics consistency", () => {
      const features: DiscoveredFeature[] = [
        { name: "Button", type: "button", selector: "#btn", text: "Click me" },
        { name: "Input", type: "input", selector: "#input", attributes: { type: "text" } },
      ];

      const report: DiscoveryReport = {
        timestamp: new Date().toISOString(),
        url: "https://test.com",
        featuresDiscovered: features.length,
        features,
        testCases: [],
        statistics: {
          byType: { button: 1, input: 1 },
          interactive: 2,
          withText: 1,
          withAttributes: 1,
        },
      };

      // Verify statistics match the features
      const actualByType = features.reduce(
        (acc, f) => {
          acc[f.type] = (acc[f.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const actualWithText = features.filter((f) => f.text).length;
      const actualWithAttributes = features.filter((f) => f.attributes).length;

      expect(report.statistics.byType).toEqual(actualByType);
      expect(report.statistics.withText).toBe(actualWithText);
      expect(report.statistics.withAttributes).toBe(actualWithAttributes);
    });
  });

  describe("DiscoveryOptions", () => {
    it("should have all optional properties", () => {
      const options: DiscoveryOptions = {};
      expect(options).toBeDefined();

      const fullOptions: DiscoveryOptions = {
        maxDepth: 3,
        timeout: 5000,
        includeHidden: true,
        screenshotPath: "/screenshots",
      };

      expect(fullOptions.maxDepth).toBe(3);
      expect(fullOptions.timeout).toBe(5000);
      expect(fullOptions.includeHidden).toBe(true);
      expect(fullOptions.screenshotPath).toBe("/screenshots");
    });

    it("should allow partial options", () => {
      const partialOptions: DiscoveryOptions = {
        timeout: 3000,
        includeHidden: false,
      };

      expect(partialOptions.timeout).toBe(3000);
      expect(partialOptions.includeHidden).toBe(false);
      expect(partialOptions.maxDepth).toBeUndefined();
      expect(partialOptions.screenshotPath).toBeUndefined();
    });
  });

  describe("Type compatibility", () => {
    it("should allow assignment between compatible types", () => {
      const button: DiscoveredFeature = {
        name: "Test Button",
        type: "button",
        selector: "#test-btn",
      };

      const features: DiscoveredFeature[] = [button];
      const step: TestStep = {
        action: "click",
        selector: button.selector,
        description: "Click the test button",
      };

      expect(features[0]).toBe(button);
      expect(step.selector).toBe(button.selector);
    });

    it("should preserve type information in arrays", () => {
      const mixedFeatures: DiscoveredFeature[] = [
        { name: "Button", type: "button", selector: "#btn" },
        { name: "Input", type: "input", selector: "#input" },
        { name: "Panel", type: "panel", selector: "#panel" },
      ];

      const buttonFeatures = mixedFeatures.filter((f) => f.type === "button");
      const inputFeatures = mixedFeatures.filter((f) => f.type === "input");

      expect(buttonFeatures).toHaveLength(1);
      expect(inputFeatures).toHaveLength(1);
      expect(buttonFeatures[0].type).toBe("button");
      expect(inputFeatures[0].type).toBe("input");
    });

    it("should support complex nested structures", () => {
      const complexFeature: DiscoveredFeature = {
        name: "Navigation Menu",
        type: "menu",
        selector: "nav",
        children: [
          {
            name: "Home Link",
            type: "button",
            selector: "nav a[href='/']",
            actions: ["click", "hover"],
          },
          {
            name: "Products Dropdown",
            type: "dropdown",
            selector: "nav .dropdown",
            children: [
              {
                name: "Product 1",
                type: "button",
                selector: "nav .dropdown a:nth-child(1)",
              },
            ],
          },
        ],
      };

      expect(complexFeature.children).toHaveLength(2);
      expect(complexFeature.children?.[1]?.children).toHaveLength(1);
      expect(complexFeature.children?.[0]?.actions).toContain("click");
    });
  });
});
