import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { TestCase, TestStep, Assertion, TestExecutionResult } from "./types";
import * as fs from "fs";
import * as path from "path";

/**
 * Service class for executing generated test cases
 * Single Responsibility: Test execution, step execution, and assertion verification
 */
export class TestExecutor {
  constructor(
    private page: Page,
    private screenshotPath: string = "test-screenshots",
  ) {
    this.ensureScreenshotDirectory();
  }

  async executeTestCases(testCases: TestCase[]): Promise<TestExecutionResult[]> {
    console.log("\n🚀 Executing generated test cases...\n");

    const results: TestExecutionResult[] = [];
    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
      const result = await this.executeTestCase(testCase);
      results.push(result);

      if (result.success) {
        passed++;
        console.log(`  ✅ ${testCase.feature.name} - Passed`);
      } else {
        failed++;
        console.log(`  ❌ ${testCase.feature.name} - Failed: ${result.error}`);
      }
    }

    this.printExecutionSummary(passed, failed, testCases.length);
    return results;
  }

  async executeTestCase(testCase: TestCase): Promise<TestExecutionResult> {
    const startTime = Date.now();

    try {
      console.log(`Testing: ${testCase.feature.name}`);

      // Execute all test steps
      for (const step of testCase.steps) {
        await this.executeStep(step);
      }

      // Verify all assertions
      for (const assertion of testCase.assertions) {
        await this.verifyAssertion(assertion);
      }

      return {
        testCase,
        success: true,
        duration: Date.now() - startTime,
        error: null,
        screenshot: null,
      };
    } catch (error: any) {
      // Take screenshot on failure if possible
      let screenshot: string | null = null;
      try {
        screenshot = await this.takeScreenshot(testCase.feature.name);
      } catch {
        // Ignore screenshot errors
      }

      return {
        testCase,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
        screenshot,
      };
    }
  }

  private async executeStep(step: TestStep): Promise<void> {
    const element = this.page.locator(step.selector);

    switch (step.action) {
      case "click":
        await element.click();
        break;

      case "fill":
        await element.fill(step.value || "");
        break;

      case "hover":
        await element.hover();
        break;

      case "focus":
        await element.focus();
        break;

      case "select":
        await element.selectOption(step.value || "");
        break;

      case "check":
        await element.check();
        break;

      case "uncheck":
        await element.uncheck();
        break;

      case "press":
        await element.press(step.value || "Enter");
        break;

      case "screenshot":
        await this.takeElementScreenshot(element);
        break;

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }

    // Small delay between actions to allow for UI updates
    await this.page.waitForTimeout(100);
  }

  private async verifyAssertion(assertion: Assertion): Promise<void> {
    const element = this.page.locator(assertion.selector);

    switch (assertion.type) {
      case "visible":
        await expect(element).toBeVisible();
        break;

      case "hidden":
        await expect(element).toBeHidden();
        break;

      case "enabled":
        await expect(element).toBeEnabled();
        break;

      case "disabled":
        await expect(element).toBeDisabled();
        break;

      case "text":
        await expect(element).toHaveText(assertion.expected);
        break;

      case "count":
        await expect(element).toHaveCount(assertion.expected);
        break;

      case "attribute":
        if (assertion.selector.includes("input")) {
          await expect(element).toHaveValue(assertion.expected);
        } else {
          await expect(element).toHaveAttribute("value", assertion.expected);
        }
        break;

      case "class":
        await expect(element).toHaveClass(assertion.expected);
        break;

      default:
        throw new Error(`Unknown assertion type: ${assertion.type}`);
    }
  }

  private async takeElementScreenshot(element: any): Promise<void> {
    try {
      const timestamp = Date.now();
      const filename = path.join(this.screenshotPath, `element-${timestamp}.png`);
      await element.screenshot({ path: filename });
    } catch (error) {
      // Screenshot failed, continue with test
      console.warn("Screenshot failed:", error);
    }
  }

  private ensureScreenshotDirectory(): void {
    if (!fs.existsSync(this.screenshotPath)) {
      fs.mkdirSync(this.screenshotPath, { recursive: true });
    }
  }

  private async takeScreenshot(testName: string): Promise<string> {
    const timestamp = Date.now();
    const filename = `${testName.replace(/[^a-z0-9]/gi, "_")}_${timestamp}.png`;
    const filepath = path.join(this.screenshotPath, filename);
    await this.page.screenshot({ path: filepath });
    return filepath;
  }

  private printExecutionSummary(passed: number, failed: number, total: number): void {
    console.log("\n" + "=".repeat(50));
    console.log("📊 Test Execution Summary:");
    console.log(`  Total tests: ${total}`);
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Success rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log("=".repeat(50));
  }
}
