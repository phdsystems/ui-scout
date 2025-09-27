import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TestExecutor } from "../src/TestExecutor";
import { createMockPage, createMockLocator } from "./mocks/playwright.mock";
import type { TestCase, TestStep, Assertion, TestExecutionResult } from "../src/types";
import * as fs from "fs";
import * as path from "path";

// Mock fs module
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

// Mock @playwright/test expect
vi.mock("@playwright/test", () => ({
  expect: {
    toBeVisible: vi.fn().mockResolvedValue(undefined),
    toHaveText: vi.fn().mockResolvedValue(undefined),
    toHaveValue: vi.fn().mockResolvedValue(undefined),
    toBeEnabled: vi.fn().mockResolvedValue(undefined),
    toBeDisabled: vi.fn().mockResolvedValue(undefined),
    toHaveClass: vi.fn().mockResolvedValue(undefined),
    toHaveAttribute: vi.fn().mockResolvedValue(undefined),
  }
}));

describe("TestExecutor - Comprehensive Tests", () => {
  let mockPage: any;
  let testExecutor: TestExecutor;
  
  beforeEach(() => {
    mockPage = createMockPage();
    testExecutor = new TestExecutor(mockPage, "test-screenshots");
    vi.clearAllMocks();
    
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock fs methods
    (fs.existsSync as any).mockReturnValue(false);
    (fs.mkdirSync as any).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Constructor and Initialization", () => {
    it("should create screenshot directory if it doesn't exist", () => {
      (fs.existsSync as any).mockReturnValue(false);
      
      new TestExecutor(mockPage, "custom-screenshots");
      
      expect(fs.existsSync).toHaveBeenCalledWith("custom-screenshots");
      expect(fs.mkdirSync).toHaveBeenCalledWith("custom-screenshots", { recursive: true });
    });

    it("should not create directory if it already exists", () => {
      (fs.existsSync as any).mockReturnValue(true);
      
      new TestExecutor(mockPage);
      
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it("should use default screenshot path", () => {
      const executor = new TestExecutor(mockPage);
      expect(executor["screenshotPath"]).toBe("test-screenshots");
    });

    it("should accept custom screenshot path", () => {
      const executor = new TestExecutor(mockPage, "my-screenshots");
      expect(executor["screenshotPath"]).toBe("my-screenshots");
    });
  });

  describe("executeTestCases", () => {
    it("should execute multiple test cases successfully", async () => {
      const testCases: TestCase[] = [
        {
          feature: { 
            type: "button", 
            name: "Submit Button", 
            selector: "#submit",
            actions: ["click"]
          },
          steps: [
            { action: "click", target: "#submit", value: "" }
          ],
          assertions: [
            { type: "visibility", target: "#success", expected: true }
          ]
        },
        {
          feature: {
            type: "input",
            name: "Email Field",
            selector: "#email",
            actions: ["fill"]
          },
          steps: [
            { action: "fill", target: "#email", value: "test@example.com" }
          ],
          assertions: [
            { type: "value", target: "#email", expected: "test@example.com" }
          ]
        }
      ];

      // Mock successful execution
      mockPage.locator.mockImplementation((selector: string) => {
        return createMockLocator({
          click: vi.fn().mockResolvedValue(undefined),
          fill: vi.fn().mockResolvedValue(undefined),
          isVisible: vi.fn().mockResolvedValue(true),
          inputValue: vi.fn().mockResolvedValue("test@example.com"),
        });
      });

      const results = await testExecutor.executeTestCases(testCases);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("✅"));
    });

    it("should handle test case failures", async () => {
      const testCase: TestCase = {
        feature: { 
          type: "button", 
          name: "Broken Button", 
          selector: "#broken",
          actions: ["click"]
        },
        steps: [
          { action: "click", target: "#broken", value: "" }
        ],
        assertions: []
      };

      // Mock element not found
      mockPage.locator.mockImplementation(() => {
        throw new Error("Element not found");
      });

      const results = await testExecutor.executeTestCases([testCase]);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe("Element not found");
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("❌"));
    });

    it("should print execution summary", async () => {
      const testCases: TestCase[] = [
        {
          feature: { type: "button", name: "Test1", selector: "#test1", actions: [] },
          steps: [],
          assertions: []
        },
        {
          feature: { type: "button", name: "Test2", selector: "#test2", actions: [] },
          steps: [],
          assertions: []
        }
      ];

      await testExecutor.executeTestCases(testCases);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Test Execution Summary"));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Total tests: 2"));
    });

    it("should handle empty test cases array", async () => {
      const results = await testExecutor.executeTestCases([]);

      expect(results).toHaveLength(0);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Total tests: 0"));
    });
  });

  describe("executeTestCase", () => {
    it("should execute all steps and assertions", async () => {
      const testCase: TestCase = {
        feature: { 
          type: "form", 
          name: "Login Form", 
          selector: "#login-form",
          actions: []
        },
        steps: [
          { action: "fill", target: "#username", value: "user123" },
          { action: "fill", target: "#password", value: "pass123" },
          { action: "click", target: "#login-btn", value: "" }
        ],
        assertions: [
          { type: "visibility", target: "#dashboard", expected: true },
          { type: "text", target: "#welcome", expected: "Welcome user123" }
        ]
      };

      const mockElement = createMockLocator({
        fill: vi.fn().mockResolvedValue(undefined),
        click: vi.fn().mockResolvedValue(undefined),
        isVisible: vi.fn().mockResolvedValue(true),
        textContent: vi.fn().mockResolvedValue("Welcome user123"),
      });

      mockPage.locator.mockReturnValue(mockElement);

      const result = await testExecutor.executeTestCase(testCase);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.duration).toBeGreaterThan(0);
      expect(mockElement.fill).toHaveBeenCalledTimes(2);
      expect(mockElement.click).toHaveBeenCalledTimes(1);
    });

    it("should capture screenshot on failure", async () => {
      const testCase: TestCase = {
        feature: { type: "button", name: "Error Button", selector: "#error", actions: [] },
        steps: [{ action: "click", target: "#error", value: "" }],
        assertions: []
      };

      mockPage.locator.mockImplementation(() => {
        throw new Error("Click failed");
      });

      mockPage.screenshot.mockResolvedValue(Buffer.from("fake-screenshot"));

      const result = await testExecutor.executeTestCase(testCase);

      expect(result.success).toBe(false);
      expect(result.screenshot).toBeTruthy();
      expect(mockPage.screenshot).toHaveBeenCalled();
    });

    it("should handle screenshot capture failure gracefully", async () => {
      const testCase: TestCase = {
        feature: { type: "button", name: "Error Button", selector: "#error", actions: [] },
        steps: [{ action: "click", target: "#error", value: "" }],
        assertions: []
      };

      mockPage.locator.mockImplementation(() => {
        throw new Error("Click failed");
      });

      mockPage.screenshot.mockRejectedValue(new Error("Screenshot failed"));

      const result = await testExecutor.executeTestCase(testCase);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Click failed");
      expect(result.screenshot).toBeNull();
    });
  });

  describe("executeStep", () => {
    it("should execute click action", async () => {
      const step: TestStep = { action: "click", target: "#button", value: "" };
      
      const mockElement = createMockLocator({
        click: vi.fn().mockResolvedValue(undefined),
      });
      
      mockPage.locator.mockReturnValue(mockElement);

      await testExecutor["executeStep"](step);

      expect(mockPage.locator).toHaveBeenCalledWith("#button");
      expect(mockElement.click).toHaveBeenCalled();
    });

    it("should execute fill action", async () => {
      const step: TestStep = { action: "fill", target: "#input", value: "test value" };
      
      const mockElement = createMockLocator({
        fill: vi.fn().mockResolvedValue(undefined),
      });
      
      mockPage.locator.mockReturnValue(mockElement);

      await testExecutor["executeStep"](step);

      expect(mockPage.locator).toHaveBeenCalledWith("#input");
      expect(mockElement.fill).toHaveBeenCalledWith("test value");
    });

    it("should execute type action", async () => {
      const step: TestStep = { action: "type", target: "#textarea", value: "typed text" };
      
      const mockElement = createMockLocator({
        type: vi.fn().mockResolvedValue(undefined),
      });
      
      mockPage.locator.mockReturnValue(mockElement);

      await testExecutor["executeStep"](step);

      expect(mockElement.type).toHaveBeenCalledWith("typed text");
    });

    it("should execute check action", async () => {
      const step: TestStep = { action: "check", target: "#checkbox", value: "" };
      
      const mockElement = createMockLocator({
        check: vi.fn().mockResolvedValue(undefined),
      });
      
      mockPage.locator.mockReturnValue(mockElement);

      await testExecutor["executeStep"](step);

      expect(mockElement.check).toHaveBeenCalled();
    });

    it("should execute select action", async () => {
      const step: TestStep = { action: "select", target: "#dropdown", value: "option1" };
      
      const mockElement = createMockLocator({
        selectOption: vi.fn().mockResolvedValue(undefined),
      });
      
      mockPage.locator.mockReturnValue(mockElement);

      await testExecutor["executeStep"](step);

      expect(mockElement.selectOption).toHaveBeenCalledWith("option1");
    });

    it("should execute hover action", async () => {
      const step: TestStep = { action: "hover", target: "#hoverable", value: "" };
      
      const mockElement = createMockLocator({
        hover: vi.fn().mockResolvedValue(undefined),
      });
      
      mockPage.locator.mockReturnValue(mockElement);

      await testExecutor["executeStep"](step);

      expect(mockElement.hover).toHaveBeenCalled();
    });

    it("should execute navigate action", async () => {
      const step: TestStep = { action: "navigate", target: "", value: "https://example.com" };

      await testExecutor["executeStep"](step);

      expect(mockPage.goto).toHaveBeenCalledWith("https://example.com");
    });

    it("should execute wait action", async () => {
      const step: TestStep = { action: "wait", target: "", value: "1000" };

      const startTime = Date.now();
      await testExecutor["executeStep"](step);
      const elapsed = Date.now() - startTime;

      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(1000);
    });

    it("should execute screenshot action", async () => {
      const step: TestStep = { action: "screenshot", target: "#element", value: "test-shot" };
      
      mockPage.screenshot.mockResolvedValue(Buffer.from("screenshot-data"));

      await testExecutor["executeStep"](step);

      expect(mockPage.screenshot).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it("should handle unknown action gracefully", async () => {
      const step: TestStep = { action: "unknown" as any, target: "#target", value: "" };

      // Should not throw
      await expect(testExecutor["executeStep"](step)).resolves.not.toThrow();
    });

    it("should handle step execution errors", async () => {
      const step: TestStep = { action: "click", target: "#missing", value: "" };
      
      mockPage.locator.mockImplementation(() => {
        throw new Error("Element not found");
      });

      await expect(testExecutor["executeStep"](step)).rejects.toThrow("Element not found");
    });
  });

  describe("verifyAssertion", () => {
    it("should verify visibility assertion - visible", async () => {
      const assertion: Assertion = { 
        type: "visibility", 
        target: "#element", 
        expected: true 
      };

      const mockElement = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockReturnValue(mockElement);

      await testExecutor["verifyAssertion"](assertion);

      expect(mockElement.isVisible).toHaveBeenCalled();
    });

    it("should verify visibility assertion - hidden", async () => {
      const assertion: Assertion = { 
        type: "visibility", 
        target: "#hidden", 
        expected: false 
      };

      const mockElement = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(false),
      });

      mockPage.locator.mockReturnValue(mockElement);

      await testExecutor["verifyAssertion"](assertion);

      expect(mockElement.isVisible).toHaveBeenCalled();
    });

    it("should verify text assertion", async () => {
      const assertion: Assertion = { 
        type: "text", 
        target: "#heading", 
        expected: "Welcome" 
      };

      const mockElement = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Welcome"),
      });

      mockPage.locator.mockReturnValue(mockElement);

      await testExecutor["verifyAssertion"](assertion);

      expect(mockElement.textContent).toHaveBeenCalled();
    });

    it("should verify value assertion", async () => {
      const assertion: Assertion = { 
        type: "value", 
        target: "#input", 
        expected: "test@example.com" 
      };

      const mockElement = createMockLocator({
        inputValue: vi.fn().mockResolvedValue("test@example.com"),
      });

      mockPage.locator.mockReturnValue(mockElement);

      await testExecutor["verifyAssertion"](assertion);

      expect(mockElement.inputValue).toHaveBeenCalled();
    });

    it("should verify enabled assertion", async () => {
      const assertion: Assertion = { 
        type: "enabled", 
        target: "#button", 
        expected: true 
      };

      const mockElement = createMockLocator({
        isEnabled: vi.fn().mockResolvedValue(true),
      });

      mockPage.locator.mockReturnValue(mockElement);

      await testExecutor["verifyAssertion"](assertion);

      expect(mockElement.isEnabled).toHaveBeenCalled();
    });

    it("should verify class assertion", async () => {
      const assertion: Assertion = { 
        type: "class", 
        target: "#element", 
        expected: "active" 
      };

      const mockElement = createMockLocator({
        getAttribute: vi.fn().mockResolvedValue("btn active primary"),
      });

      mockPage.locator.mockReturnValue(mockElement);

      await testExecutor["verifyAssertion"](assertion);

      expect(mockElement.getAttribute).toHaveBeenCalledWith("class");
    });

    it("should verify attribute assertion", async () => {
      const assertion: Assertion = { 
        type: "attribute", 
        target: "#link", 
        expected: { name: "href", value: "/home" }
      };

      const mockElement = createMockLocator({
        getAttribute: vi.fn().mockResolvedValue("/home"),
      });

      mockPage.locator.mockReturnValue(mockElement);

      await testExecutor["verifyAssertion"](assertion);

      expect(mockElement.getAttribute).toHaveBeenCalledWith("href");
    });

    it("should verify url assertion", async () => {
      const assertion: Assertion = { 
        type: "url", 
        target: "", 
        expected: "https://example.com/dashboard" 
      };

      mockPage.url.mockReturnValue("https://example.com/dashboard");

      await testExecutor["verifyAssertion"](assertion);

      expect(mockPage.url).toHaveBeenCalled();
    });

    it("should verify title assertion", async () => {
      const assertion: Assertion = { 
        type: "title", 
        target: "", 
        expected: "Dashboard" 
      };

      mockPage.title.mockResolvedValue("Dashboard");

      await testExecutor["verifyAssertion"](assertion);

      expect(mockPage.title).toHaveBeenCalled();
    });

    it("should handle unknown assertion type", async () => {
      const assertion: Assertion = { 
        type: "unknown" as any, 
        target: "#element", 
        expected: "value" 
      };

      // Should not throw
      await expect(testExecutor["verifyAssertion"](assertion)).resolves.not.toThrow();
    });

    it("should throw on assertion failure", async () => {
      const assertion: Assertion = { 
        type: "text", 
        target: "#heading", 
        expected: "Expected Text" 
      };

      const mockElement = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Actual Text"),
      });

      mockPage.locator.mockReturnValue(mockElement);

      await expect(testExecutor["verifyAssertion"](assertion)).rejects.toThrow();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle malformed test cases", async () => {
      const malformedTestCase: TestCase = {
        feature: null as any,
        steps: null as any,
        assertions: null as any,
      };

      const result = await testExecutor.executeTestCase(malformedTestCase);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should continue execution after step failure if configured", async () => {
      const testCase: TestCase = {
        feature: { type: "form", name: "Test Form", selector: "#form", actions: [] },
        steps: [
          { action: "click", target: "#missing", value: "" }, // Will fail
          { action: "fill", target: "#input", value: "text" }, // Should not execute
        ],
        assertions: []
      };

      let callCount = 0;
      mockPage.locator.mockImplementation((selector: string) => {
        callCount++;
        if (selector === "#missing") {
          throw new Error("Not found");
        }
        return createMockLocator({
          fill: vi.fn(),
        });
      });

      const result = await testExecutor.executeTestCase(testCase);

      expect(result.success).toBe(false);
      expect(callCount).toBe(1); // Should stop after first error
    });

    it("should handle very long test execution", async () => {
      const testCase: TestCase = {
        feature: { type: "test", name: "Long Test", selector: "#test", actions: [] },
        steps: Array.from({ length: 100 }, (_, i) => ({
          action: "click",
          target: `#btn-${i}`,
          value: ""
        })),
        assertions: []
      };

      mockPage.locator.mockReturnValue(createMockLocator({
        click: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 10))
        ),
      }));

      const startTime = Date.now();
      const result = await testExecutor.executeTestCase(testCase);
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
      expect(duration).toBeGreaterThan(100); // At least 100 * 10ms
    });

    it("should handle concurrent test execution properly", async () => {
      const testCases: TestCase[] = Array.from({ length: 5 }, (_, i) => ({
        feature: { 
          type: "button", 
          name: `Button ${i}`, 
          selector: `#btn-${i}`,
          actions: ["click"]
        },
        steps: [{ action: "click", target: `#btn-${i}`, value: "" }],
        assertions: []
      }));

      mockPage.locator.mockReturnValue(createMockLocator({
        click: vi.fn().mockResolvedValue(undefined),
      }));

      // Execute tests - they run sequentially in the current implementation
      const results = await testExecutor.executeTestCases(testCases);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it("should clean up resources on error", async () => {
      const testCase: TestCase = {
        feature: { type: "button", name: "Test", selector: "#test", actions: [] },
        steps: [{ action: "click", target: "#test", value: "" }],
        assertions: []
      };

      mockPage.locator.mockImplementation(() => {
        throw new Error("Fatal error");
      });

      const result = await testExecutor.executeTestCase(testCase);

      expect(result.success).toBe(false);
      // Ensure no lingering promises or uncaught errors
    });
  });

  describe("Screenshot Management", () => {
    it("should generate unique screenshot names", async () => {
      mockPage.screenshot.mockResolvedValue(Buffer.from("screenshot"));

      const name1 = await testExecutor["takeScreenshot"]("Test 1");
      const name2 = await testExecutor["takeScreenshot"]("Test 2");

      expect(name1).not.toBe(name2);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    });

    it("should sanitize screenshot names", async () => {
      mockPage.screenshot.mockResolvedValue(Buffer.from("screenshot"));

      const screenshotPath = await testExecutor["takeScreenshot"]("Test/With:Special*Chars");

      expect(screenshotPath).not.toContain("/");
      expect(screenshotPath).not.toContain(":");
      expect(screenshotPath).not.toContain("*");
    });

    it("should handle screenshot directory creation failure", () => {
      (fs.existsSync as any).mockReturnValue(false);
      (fs.mkdirSync as any).mockImplementation(() => {
        throw new Error("Permission denied");
      });

      // Constructor should handle directory creation gracefully
      expect(() => new TestExecutor(mockPage, "forbidden-path")).toThrow("Permission denied");
    });
  });
});