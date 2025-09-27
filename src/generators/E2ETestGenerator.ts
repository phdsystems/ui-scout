/**
 * E2E Test Generator
 * Generates end-to-end tests using UI discovery and Playwright
 */

import type { Page, Browser } from "playwright";
import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";
import { FeatureDiscoveryCoordinator } from "../FeatureDiscoveryCoordinator";
import type { DiscoveredFeature, TestCase } from "../types";

export interface E2ETestOptions {
  projectPath: string;
  baseUrl?: string;
  outputDir?: string;
  browsers?: ("chromium" | "firefox" | "webkit")[];
  testFramework?: "playwright" | "cypress" | "puppeteer";
  generateVisualTests?: boolean;
  generateAccessibilityTests?: boolean;
  generatePerformanceTests?: boolean;
  testScenarios?: E2ETestScenario[];
}

export interface E2ETestScenario {
  name: string;
  description: string;
  steps: E2ETestStep[];
  assertions: E2EAssertion[];
}

export interface E2ETestStep {
  action: "navigate" | "click" | "fill" | "select" | "hover" | "wait" | "screenshot";
  target?: string;
  value?: string;
  options?: any;
}

export interface E2EAssertion {
  type: "visible" | "text" | "value" | "count" | "url" | "title";
  target?: string;
  expected?: any;
}

export interface GeneratedE2ETest {
  filepath: string;
  testCode: string;
  scenarios: number;
  features: number;
  browsers: string[];
}

export class E2ETestGenerator {
  private options: E2ETestOptions;
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(options: E2ETestOptions) {
    this.options = {
      baseUrl: "http://localhost:3000",
      outputDir: "tests/e2e",
      browsers: ["chromium"],
      testFramework: "playwright",
      generateVisualTests: true,
      generateAccessibilityTests: true,
      generatePerformanceTests: true,
      testScenarios: [],
      ...options,
    };
  }

  async generate(): Promise<GeneratedE2ETest[]> {
    console.log("🌐 Generating E2E Tests...");

    const tests: GeneratedE2ETest[] = [];

    // Check if app is running
    const isAppRunning = await this.checkAppRunning();
    if (!isAppRunning) {
      console.log("  ⚠️  Application not running at " + this.options.baseUrl);
      console.log("  💡 Start your dev server and try again");
      return tests;
    }

    // Launch browser and discover features
    await this.launchBrowser();

    try {
      // Discover UI features
      const features = await this.discoverFeatures();
      console.log(`  Found ${features.length} UI features`);

      // Generate test cases from features
      const testCases = await this.generateTestCases(features);
      console.log(`  Generated ${testCases.length} test cases`);

      // Generate E2E test files
      for (const browser of this.options.browsers || ["chromium"]) {
        const test = await this.generateE2ETestFile(features, testCases, browser);
        tests.push(test);
      }

      // Generate specialized tests
      if (this.options.generateVisualTests) {
        const visualTest = await this.generateVisualRegressionTests(features);
        tests.push(visualTest);
      }

      if (this.options.generateAccessibilityTests) {
        const a11yTest = await this.generateAccessibilityTests(features);
        tests.push(a11yTest);
      }

      if (this.options.generatePerformanceTests) {
        const perfTest = await this.generatePerformanceTests();
        tests.push(perfTest);
      }

      // Generate custom scenarios
      if (this.options.testScenarios && this.options.testScenarios.length > 0) {
        const scenarioTest = await this.generateScenarioTests(this.options.testScenarios);
        tests.push(scenarioTest);
      }
    } finally {
      await this.closeBrowser();
    }

    await this.writeTests(tests);
    return tests;
  }

  private async checkAppRunning(): Promise<boolean> {
    try {
      const response = await fetch(this.options.baseUrl || "http://localhost:3000");
      return response.ok;
    } catch {
      return false;
    }
  }

  private async launchBrowser() {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    await this.page.goto(this.options.baseUrl || "http://localhost:3000", {
      waitUntil: "networkidle",
    });
  }

  private async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  private async discoverFeatures(): Promise<DiscoveredFeature[]> {
    if (!this.page) return [];

    const coordinator = new FeatureDiscoveryCoordinator(this.page);
    const result = await coordinator.discoverFeatures();
    return result.features;
  }

  private async generateTestCases(features: DiscoveredFeature[]): Promise<TestCase[]> {
    if (!this.page) return [];

    const coordinator = new FeatureDiscoveryCoordinator(this.page);
    return await coordinator.generateTests(features);
  }

  private async generateE2ETestFile(
    features: DiscoveredFeature[],
    testCases: TestCase[],
    browser: string,
  ): Promise<GeneratedE2ETest> {
    const testCode =
      this.options.testFramework === "playwright"
        ? this.generatePlaywrightTest(features, testCases, browser)
        : this.options.testFramework === "cypress"
          ? this.generateCypressTest(features, testCases)
          : this.generatePuppeteerTest(features, testCases);

    return {
      filepath: `app.${browser}.e2e.test.ts`,
      testCode,
      scenarios: testCases.length,
      features: features.length,
      browsers: [browser],
    };
  }

  private generatePlaywrightTest(
    features: DiscoveredFeature[],
    testCases: TestCase[],
    browser: string,
  ): string {
    return `/**
 * E2E Tests for ${browser}
 * @generated by UI Scout
 * Features discovered: ${features.length}
 * Test cases: ${testCases.length}
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('E2E Tests - ${browser}', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'UI-Scout-E2E-Test'
    });
  });

  test.beforeEach(async () => {
    page = await context.newPage();
    await page.goto('${this.options.baseUrl}');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.afterAll(async () => {
    await context.close();
  });

  // Feature Discovery Tests
  test.describe('UI Features', () => {
${features
  .map(
    (feature) => `
    test('should interact with ${feature.type}: ${feature.text || feature.selector}', async () => {
      const element = page.locator('${feature.selector}');
      
      // Verify element exists
      await expect(element).toBeVisible();
      
      // Perform interaction
${this.generateFeatureInteraction(feature)}
      
      // Add assertions
${this.generateFeatureAssertions(feature)}
    });`,
  )
  .join("\n")}
  });

  // Generated Test Cases
  test.describe('Test Scenarios', () => {
${testCases
  .map(
    (tc, index) => `
    test('${(tc as any).name || `Scenario ${index + 1}`}', async () => {
      // Setup
      ${(tc as any).setup?.map((s: any) => this.generateStepCode(s)).join("\n      ") || "// No setup required"}
      
      // Test steps
${(tc.steps || []).map((step) => `      ${this.generateStepCode(step)}`).join("\n")}
      
      // Assertions
${(tc.assertions || []).map((assertion) => `      ${this.generateAssertionCode(assertion)}`).join("\n")}
      
      // Cleanup
      ${(tc as any).cleanup?.map((c: any) => this.generateStepCode(c)).join("\n      ") || "// No cleanup required"}
    });`,
  )
  .join("\n")}
  });

  // User Flow Tests
  test.describe('User Flows', () => {
    test('should complete main user journey', async () => {
      // Navigate through main user flow
      ${this.generateMainUserFlow(features)}
    });

    test('should handle form submission flow', async () => {
      // Find and fill all forms
      ${this.generateFormFlow(features)}
    });

    test('should navigate through all pages', async () => {
      // Test navigation
      ${this.generateNavigationFlow(features)}
    });
  });

  // Error Handling Tests
  test.describe('Error Handling', () => {
    test('should handle 404 pages', async () => {
      await page.goto('${this.options.baseUrl}/non-existent-page');
      await expect(page.locator('body')).toContainText(/404|not found/i);
    });

    test('should handle network errors', async () => {
      await page.route('**/api/**', route => route.abort());
      await page.reload();
      // Verify error handling
    });

    test('should handle JavaScript errors', async () => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      
      // Trigger potential errors
      await page.evaluate(() => {
        throw new Error('Test error');
      });
      
      expect(errors).toHaveLength(1);
    });
  });

  // Responsive Design Tests
  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];

    viewports.forEach(viewport => {
      test(\`should work on \${viewport.name}\`, async () => {
        await page.setViewportSize(viewport);
        await page.goto('${this.options.baseUrl}');
        
        // Verify responsive behavior
        const mainContent = page.locator('main, [role="main"], #root');
        await expect(mainContent).toBeVisible();
      });
    });
  });
});`;
  }

  private generateCypressTest(_features: DiscoveredFeature[], testCases: TestCase[]): string {
    return `/**
 * Cypress E2E Tests
 * @generated by UI Scout
 */

describe('E2E Tests', () => {
  beforeEach(() => {
    cy.visit('${this.options.baseUrl}');
  });

${testCases
  .map(
    (tc, index) => `
  it('${(tc as any).name || `Test ${index + 1}`}', () => {
${(tc.steps || []).map((step) => `    ${this.generateCypressStep(step)}`).join("\n")}
  });`,
  )
  .join("\n")}
});`;
  }

  private generatePuppeteerTest(_features: DiscoveredFeature[], testCases: TestCase[]): string {
    return `/**
 * Puppeteer E2E Tests
 * @generated by UI Scout
 */

import puppeteer from 'puppeteer';

describe('E2E Tests', () => {
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    await page.goto('${this.options.baseUrl}');
  });

${testCases
  .map(
    (tc, index) => `
  test('${(tc as any).name || `Test ${index + 1}`}', async () => {
${(tc.steps || []).map((step) => `    ${this.generatePuppeteerStep(step)}`).join("\n")}
  });`,
  )
  .join("\n")}
});`;
  }

  private generateVisualRegressionTests(features: DiscoveredFeature[]): Promise<GeneratedE2ETest> {
    const testCode = `/**
 * Visual Regression Tests
 * @generated by UI Scout
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('should match homepage screenshot', async ({ page }) => {
    await page.goto('${this.options.baseUrl}');
    await expect(page).toHaveScreenshot('homepage.png', { fullPage: true });
  });

${features
  .filter((f) => f.type === "button" || f.type === "link")
  .slice(0, 10)
  .map(
    (feature) => `
  test('should match ${feature.type} screenshot: ${feature.text}', async ({ page }) => {
    await page.goto('${this.options.baseUrl}');
    const element = page.locator('${feature.selector}');
    await expect(element).toHaveScreenshot('${feature.type}-${feature.text?.replace(/[^a-z0-9]/gi, "-")}.png');
  });`,
  )
  .join("\n")}

  test('should match form states', async ({ page }) => {
    await page.goto('${this.options.baseUrl}');
    
    // Empty state
    await expect(page).toHaveScreenshot('form-empty.png');
    
    // Filled state
    const inputs = await page.locator('input[type="text"]').all();
    for (const input of inputs) {
      await input.fill('Test Value');
    }
    await expect(page).toHaveScreenshot('form-filled.png');
    
    // Error state
    await page.click('button[type="submit"]');
    await expect(page).toHaveScreenshot('form-error.png');
  });
});`;

    return Promise.resolve({
      filepath: "visual-regression.e2e.test.ts",
      testCode,
      scenarios: features.length,
      features: features.length,
      browsers: ["chromium"],
    });
  }

  private generateAccessibilityTests(features: DiscoveredFeature[]): Promise<GeneratedE2ETest> {
    const testCode = `/**
 * Accessibility Tests
 * @generated by UI Scout
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

test.describe('Accessibility', () => {
  test('should have no accessibility violations on homepage', async ({ page }) => {
    await page.goto('${this.options.baseUrl}');
    await injectAxe(page);
    
    const violations = await getViolations(page);
    expect(violations).toHaveLength(0);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('${this.options.baseUrl}');
    
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
      elements.map(el => ({ level: parseInt(el.tagName[1]), text: el.textContent }))
    );
    
    // Verify there's exactly one h1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBe(1);
    
    // Verify heading hierarchy
    for (let i = 1; i < headings.length; i++) {
      const levelDiff = headings[i].level - headings[i - 1].level;
      expect(levelDiff).toBeLessThanOrEqual(1);
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('${this.options.baseUrl}');
    
    // Check buttons have accessible names
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      expect(text || ariaLabel).toBeTruthy();
    }
    
    // Check form inputs have labels
    const inputs = await page.$$('input, select, textarea');
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      if (id) {
        const label = await page.$(\`label[for="\${id}"]\`);
        expect(label).toBeTruthy();
      } else {
        const ariaLabel = await input.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('${this.options.baseUrl}');
    
    // Tab through all interactive elements
    const interactiveElements = await page.$$('button, a, input, select, textarea, [tabindex]');
    
    for (let i = 0; i < interactiveElements.length; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeDefined();
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('${this.options.baseUrl}');
    await injectAxe(page);
    
    const violations = await getViolations(page, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
    
    expect(violations).toHaveLength(0);
  });

  test('should have skip links', async ({ page }) => {
    await page.goto('${this.options.baseUrl}');
    
    const skipLink = await page.$('[href="#main"], [href="#content"], .skip-link');
    expect(skipLink).toBeTruthy();
  });

  test('should announce page changes to screen readers', async ({ page }) => {
    await page.goto('${this.options.baseUrl}');
    
    const liveRegion = await page.$('[aria-live], [role="alert"], [role="status"]');
    expect(liveRegion).toBeTruthy();
  });
});`;

    return Promise.resolve({
      filepath: "accessibility.e2e.test.ts",
      testCode,
      scenarios: 7,
      features: features.length,
      browsers: ["chromium"],
    });
  }

  private generatePerformanceTests(): Promise<GeneratedE2ETest> {
    const testCode = `/**
 * Performance Tests
 * @generated by UI Scout
 */

import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('${this.options.baseUrl}');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 seconds
  });

  test('should have acceptable First Contentful Paint', async ({ page }) => {
    await page.goto('${this.options.baseUrl}');
    
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        fcp: perfData.loadEventEnd - perfData.fetchStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
        loadComplete: perfData.loadEventEnd - perfData.fetchStart
      };
    });
    
    expect(metrics.fcp).toBeLessThan(1500); // 1.5 seconds
    expect(metrics.domContentLoaded).toBeLessThan(2000); // 2 seconds
    expect(metrics.loadComplete).toBeLessThan(3000); // 3 seconds
  });

  test('should have acceptable Largest Contentful Paint', async ({ page }) => {
    await page.goto('${this.options.baseUrl}');
    
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      });
    });
    
    expect(lcp).toBeLessThan(2500); // 2.5 seconds
  });

  test('should not have memory leaks', async ({ page }) => {
    await page.goto('${this.options.baseUrl}');
    
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Perform actions
    for (let i = 0; i < 10; i++) {
      await page.click('body');
      await page.keyboard.press('Tab');
    }
    
    // Force garbage collection
    await page.evaluate(() => {
      if ((window as any).gc) (window as any).gc();
    });
    
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
  });

  test('should handle concurrent requests efficiently', async ({ page }) => {
    await page.goto('${this.options.baseUrl}');
    
    const requests: Promise<any>[] = [];
    
    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('api')) {
        requests.push(request.response());
      }
    });
    
    // Trigger multiple actions
    await Promise.all([
      page.click('button:first-of-type').catch(() => {}),
      page.fill('input:first-of-type', 'test').catch(() => {}),
      page.selectOption('select:first-of-type', { index: 0 }).catch(() => {})
    ]);
    
    // Wait for all requests to complete
    const responses = await Promise.all(requests);
    
    // Verify all requests succeeded
    responses.forEach(response => {
      if (response) {
        expect(response.status()).toBeLessThan(400);
      }
    });
  });

  test('should optimize images', async ({ page }) => {
    await page.goto('${this.options.baseUrl}');
    
    const images = await page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        loading: img.loading,
        naturalWidth: img.naturalWidth,
        displayWidth: img.clientWidth
      }))
    );
    
    images.forEach(img => {
      // Check lazy loading
      if (img.src.includes('http')) {
        expect(img.loading).toBe('lazy');
      }
      
      // Check image not oversized
      if (img.displayWidth > 0) {
        expect(img.naturalWidth).toBeLessThanOrEqual(img.displayWidth * 2);
      }
    });
  });
});`;

    return Promise.resolve({
      filepath: "performance.e2e.test.ts",
      testCode,
      scenarios: 6,
      features: 0,
      browsers: ["chromium"],
    });
  }

  private generateScenarioTests(scenarios: E2ETestScenario[]): Promise<GeneratedE2ETest> {
    const testCode = `/**
 * Custom Scenario Tests
 * @generated by UI Scout
 */

import { test, expect } from '@playwright/test';

test.describe('Custom Scenarios', () => {
${scenarios
  .map(
    (scenario) => `
  test('${scenario.name}', async ({ page }) => {
    // ${scenario.description}
    
${scenario.steps.map((step) => `    ${this.generateCustomStepCode(step)}`).join("\n")}
    
    // Assertions
${scenario.assertions.map((assertion) => `    ${this.generateCustomAssertionCode(assertion)}`).join("\n")}
  });`,
  )
  .join("\n")}
});`;

    return Promise.resolve({
      filepath: "scenarios.e2e.test.ts",
      testCode,
      scenarios: scenarios.length,
      features: 0,
      browsers: ["chromium"],
    });
  }

  // Helper methods for code generation
  private generateFeatureInteraction(feature: DiscoveredFeature): string {
    switch (feature.type) {
      case "button":
        return `      await element.click();
      await page.waitForLoadState('networkidle');`;
      case "input":
        return `      await element.fill('Test Value');
      await element.press('Tab');`;
      case "link":
        return `      const href = await element.getAttribute('href');
      if (href && !href.startsWith('#')) {
        await element.click();
        await page.waitForLoadState('networkidle');
        await page.goBack();
      }`;
      default:
        return `      // Interact with ${feature.type}`;
    }
  }

  private generateFeatureAssertions(feature: DiscoveredFeature): string {
    switch (feature.type) {
      case "button":
        return `      await expect(element).toBeEnabled();
      await expect(element).toHaveText(/${feature.text}/i);`;
      case "input":
        return `      await expect(element).toBeEditable();
      await expect(element).toHaveValue('Test Value');`;
      default:
        return `      await expect(element).toBeVisible();`;
    }
  }

  private generateStepCode(step: any): string {
    switch (step.action) {
      case "click":
        return `await page.click('${step.selector}');`;
      case "fill":
        return `await page.fill('${step.selector}', '${step.value}');`;
      case "check":
        return `await page.check('${step.selector}');`;
      case "select":
        return `await page.selectOption('${step.selector}', '${step.value}');`;
      default:
        return `// ${step.action}`;
    }
  }

  private generateAssertionCode(assertion: any): string {
    switch (assertion.type) {
      case "toBeVisible":
        return `await expect(page.locator('${assertion.selector}')).toBeVisible();`;
      case "toHaveText":
        return `await expect(page.locator('${assertion.selector}')).toHaveText('${assertion.value}');`;
      default:
        return `// Assertion: ${assertion.type}`;
    }
  }

  private generateCypressStep(step: any): string {
    switch (step.action) {
      case "click":
        return `cy.get('${step.selector}').click();`;
      case "fill":
        return `cy.get('${step.selector}').type('${step.value}');`;
      default:
        return `// ${step.action}`;
    }
  }

  private generatePuppeteerStep(step: any): string {
    switch (step.action) {
      case "click":
        return `await page.click('${step.selector}');`;
      case "fill":
        return `await page.type('${step.selector}', '${step.value}');`;
      default:
        return `// ${step.action}`;
    }
  }

  private generateCustomStepCode(step: E2ETestStep): string {
    switch (step.action) {
      case "navigate":
        return `await page.goto('${step.value}');`;
      case "click":
        return `await page.click('${step.target}');`;
      case "fill":
        return `await page.fill('${step.target}', '${step.value}');`;
      case "hover":
        return `await page.hover('${step.target}');`;
      case "wait":
        return `await page.waitForTimeout(${step.value || 1000});`;
      case "screenshot":
        return `await page.screenshot({ path: '${step.value || "screenshot.png"}' });`;
      default:
        return `// ${step.action}`;
    }
  }

  private generateCustomAssertionCode(assertion: E2EAssertion): string {
    switch (assertion.type) {
      case "visible":
        return `await expect(page.locator('${assertion.target}')).toBeVisible();`;
      case "text":
        return `await expect(page.locator('${assertion.target}')).toHaveText('${assertion.expected}');`;
      case "value":
        return `await expect(page.locator('${assertion.target}')).toHaveValue('${assertion.expected}');`;
      case "count":
        return `await expect(page.locator('${assertion.target}')).toHaveCount(${assertion.expected});`;
      case "url":
        return `expect(page.url()).toContain('${assertion.expected}');`;
      case "title":
        return `await expect(page).toHaveTitle('${assertion.expected}');`;
      default:
        return `// Assertion: ${assertion.type}`;
    }
  }

  private generateMainUserFlow(features: DiscoveredFeature[]): string {
    const buttons = features.filter((f) => f.type === "button");
    const inputs = features.filter((f) => f.type === "input");
    const links = features.filter((f) => f.type === "link");

    return `
      // Fill all inputs
${inputs
  .slice(0, 5)
  .map((input) => `      await page.fill('${input.selector}', 'Test Value');`)
  .join("\n")}
      
      // Click primary buttons
${buttons
  .slice(0, 3)
  .map(
    (button) => `      await page.click('${button.selector}');
      await page.waitForLoadState('networkidle');`,
  )
  .join("\n")}
      
      // Navigate via links
${links
  .slice(0, 3)
  .map(
    (link) => `      const link${links.indexOf(link)} = page.locator('${link.selector}');
      if (await link${links.indexOf(link)}.isVisible()) {
        await link${links.indexOf(link)}.click();
        await page.waitForLoadState('networkidle');
        await page.goBack();
      }`,
  )
  .join("\n")}`;
  }

  private generateFormFlow(_features: DiscoveredFeature[]): string {
    return `
      // Find all forms
      const forms = await page.$$('form');
      
      for (const form of forms) {
        // Fill inputs within form
        const formInputs = await form.$$('input[type="text"], input[type="email"], input[type="password"]');
        for (const input of formInputs) {
          await input.fill('Test Value');
        }
        
        // Submit form
        const submitButton = await form.$('button[type="submit"], input[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          await page.waitForLoadState('networkidle');
        }
      }`;
  }

  private generateNavigationFlow(features: DiscoveredFeature[]): string {
    const links = features.filter((f) => f.type === "link");

    return `
      const visitedUrls = new Set();
      visitedUrls.add(page.url());
      
${links
  .slice(0, 10)
  .map(
    (link) => `      
      const link = page.locator('${link.selector}');
      const href = await link.getAttribute('href');
      
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !visitedUrls.has(href)) {
        await link.click();
        await page.waitForLoadState('networkidle');
        visitedUrls.add(page.url());
        
        // Verify page loaded
        await expect(page.locator('body')).toBeVisible();
        
        await page.goBack();
        await page.waitForLoadState('networkidle');
      }`,
  )
  .join("\n")}`;
  }

  private async writeTests(tests: GeneratedE2ETest[]): Promise<void> {
    const outputDir = path.join(this.options.projectPath, this.options.outputDir || "tests/e2e");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const test of tests) {
      const testPath = path.join(outputDir, test.filepath);
      fs.writeFileSync(testPath, test.testCode);
      console.log(`  ✅ Generated E2E test: ${test.filepath}`);
    }

    // Generate Playwright configuration
    this.generatePlaywrightConfig(outputDir);

    // Generate test runner script
    this.generateTestRunner(outputDir, tests);
  }

  private generatePlaywrightConfig(outputDir: string) {
    const config = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  use: {
    baseURL: '${this.options.baseUrl}',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: '${this.options.baseUrl}',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});`;

    fs.writeFileSync(path.join(outputDir, "playwright.config.ts"), config);
  }

  private generateTestRunner(outputDir: string, tests: GeneratedE2ETest[]) {
    const runner = `#!/usr/bin/env node

/**
 * E2E Test Runner
 * @generated by UI Scout
 */

const { execSync } = require('child_process');
const path = require('path');

const tests = ${JSON.stringify(
      tests.map((t) => t.filepath),
      null,
      2,
    )};

console.log('🚀 Running E2E Tests...');
console.log('========================');

// Run tests
try {
  execSync('npx playwright test', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('\\n✅ All E2E tests passed!');
} catch (error) {
  console.log('\\n❌ Some E2E tests failed. Check the report for details.');
  process.exit(1);
}

// Generate report
try {
  execSync('npx playwright show-report', {
    cwd: __dirname,
    stdio: 'inherit'
  });
} catch (error) {
  console.log('Report generation failed');
}`;

    const runnerPath = path.join(outputDir, "run-tests.js");
    fs.writeFileSync(runnerPath, runner);
    fs.chmodSync(runnerPath, "755");
  }
}
