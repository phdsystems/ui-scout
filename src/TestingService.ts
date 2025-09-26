import type { Page } from "@playwright/test";
import type { DiscoveredFeature, TestCase, TestExecutionResult } from "./types";
import { TestCaseGenerator } from "./TestCaseGenerator";
import { TestExecutor } from "./TestExecutor";
import { InputDiscovery } from "./InputDiscovery";

/**
 * Service responsible ONLY for test generation and execution
 * Single Responsibility: Generate and execute tests from discovered features
 */
export class TestingService {
  private testCaseGenerator: TestCaseGenerator;
  private testExecutor: TestExecutor;

  constructor(page: Page, screenshotPath: string = "test-screenshots") {
    const inputDiscovery = new InputDiscovery(page);
    this.testCaseGenerator = new TestCaseGenerator(inputDiscovery);
    this.testExecutor = new TestExecutor(page, screenshotPath);
  }

  async generateTestCases(features: DiscoveredFeature[]): Promise<TestCase[]> {
    console.log("🧪 Generating test cases from discovered features...");
    const testCases = await this.testCaseGenerator.generateTestCases(features);
    console.log(`  Generated ${testCases.length} test cases`);
    return testCases;
  }

  async executeTestCases(testCases: TestCase[]): Promise<TestExecutionResult[]> {
    console.log("🚀 Executing test cases...");
    const results = await this.testExecutor.executeTestCases(testCases);
    return results;
  }

  async generateAndExecuteTests(features: DiscoveredFeature[]): Promise<{
    testCases: TestCase[];
    results: TestExecutionResult[];
  }> {
    const testCases = await this.generateTestCases(features);
    const results = await this.executeTestCases(testCases);

    return {
      testCases,
      results,
    };
  }
}
