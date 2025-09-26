import type { DiscoveredFeature, TestCase, TestStep, Assertion } from "./types";
import type { InputDiscovery } from "./InputDiscovery";

/**
 * Service class for generating test cases from discovered features
 * Single Responsibility: Test case generation and test step creation
 */
export class TestCaseGenerator {
  constructor(private inputDiscovery?: InputDiscovery) {}

  async generateTestCases(features: DiscoveredFeature[]): Promise<TestCase[]> {
    console.log("\n🧪 Generating test cases...");

    const testCases: TestCase[] = [];

    for (const feature of features) {
      const testCase = await this.createTestCase(feature);
      if (testCase) {
        testCases.push(testCase);
      }
    }

    console.log(`  Generated ${testCases.length} test cases`);
    return testCases;
  }

  private async createTestCase(feature: DiscoveredFeature): Promise<TestCase | null> {
    const steps: TestStep[] = [];
    const assertions: Assertion[] = [];

    // Add initial visibility assertion
    assertions.push({
      type: "visible",
      selector: feature.selector,
      description: `${feature.name} should be visible`,
    });

    // Generate steps based on feature type and actions
    if (feature.actions?.includes("click")) {
      this.addClickSteps(feature, steps, assertions);
    }

    if (feature.actions?.includes("fill") && feature.type === "input") {
      this.addFillSteps(feature, steps, assertions);
    }

    if (feature.actions?.includes("hover")) {
      this.addHoverSteps(feature, steps);
    }

    if (feature.actions?.includes("screenshot")) {
      this.addScreenshotSteps(feature, steps);
    }

    if (feature.actions?.includes("select") && feature.type === "dropdown") {
      this.addSelectSteps(feature, steps, assertions);
    }

    if (feature.actions?.includes("check") || feature.actions?.includes("uncheck")) {
      this.addCheckSteps(feature, steps, assertions);
    }

    return steps.length > 0 ? { feature, steps, assertions } : null;
  }

  private addClickSteps(
    feature: DiscoveredFeature,
    steps: TestStep[],
    assertions: Assertion[],
  ): void {
    steps.push({
      action: "click",
      selector: feature.selector,
      description: `Click on ${feature.name}`,
    });

    // Add post-click assertion for interactive elements
    if (feature.type === "button" || feature.type === "menu") {
      assertions.push({
        type: "visible",
        selector: feature.selector,
        description: `${feature.name} should remain visible after click`,
      });
    }
  }

  private addFillSteps(
    feature: DiscoveredFeature,
    steps: TestStep[],
    assertions: Assertion[],
  ): void {
    const inputType = feature.attributes?.type || "text";
    const testValue =
      this.inputDiscovery?.getTestValueForInput(inputType) || this.getDefaultTestValue(inputType);

    steps.push({
      action: "fill",
      selector: feature.selector,
      value: testValue,
      description: `Fill ${feature.name} with test value`,
    });

    assertions.push({
      type: "attribute",
      selector: feature.selector,
      expected: testValue,
      description: `${feature.name} should contain the test value`,
    });
  }

  private addHoverSteps(feature: DiscoveredFeature, steps: TestStep[]): void {
    steps.push({
      action: "hover",
      selector: feature.selector,
      description: `Hover over ${feature.name}`,
    });
  }

  private addScreenshotSteps(feature: DiscoveredFeature, steps: TestStep[]): void {
    steps.push({
      action: "screenshot",
      selector: feature.selector,
      description: `Take screenshot of ${feature.name}`,
    });
  }

  private addSelectSteps(
    feature: DiscoveredFeature,
    steps: TestStep[],
    assertions: Assertion[],
  ): void {
    // Try to get first option from attributes
    const options = feature.attributes?.options?.split(", ") || [];
    const firstOption = options[0] || "first-option";

    steps.push({
      action: "select",
      selector: feature.selector,
      value: firstOption,
      description: `Select option in ${feature.name}`,
    });

    assertions.push({
      type: "attribute",
      selector: feature.selector,
      expected: firstOption,
      description: `${feature.name} should have selected option`,
    });
  }

  private addCheckSteps(
    feature: DiscoveredFeature,
    steps: TestStep[],
    assertions: Assertion[],
  ): void {
    const inputType = feature.attributes?.type;

    if (inputType === "checkbox") {
      steps.push({
        action: "check",
        selector: feature.selector,
        description: `Check ${feature.name}`,
      });

      assertions.push({
        type: "attribute",
        selector: feature.selector,
        expected: "true",
        description: `${feature.name} should be checked`,
      });
    } else if (inputType === "radio") {
      steps.push({
        action: "click",
        selector: feature.selector,
        description: `Select ${feature.name} radio button`,
      });

      assertions.push({
        type: "attribute",
        selector: feature.selector,
        expected: "true",
        description: `${feature.name} should be selected`,
      });
    }
  }

  private getDefaultTestValue(type: string): string {
    switch (type) {
      case "email":
        return "test@example.com";
      case "password":
        return "TestPassword123!";
      case "number":
        return "42";
      case "tel":
        return "+1234567890";
      case "url":
        return "https://example.com";
      case "date":
        return "2024-01-01";
      case "time":
        return "12:00";
      case "search":
        return "test search query";
      default:
        return "Test Value";
    }
  }
}
