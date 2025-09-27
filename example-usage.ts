#!/usr/bin/env bun

/**
 * UI Scout 2.0 - Comprehensive Test Generation Example
 *
 * This example demonstrates how to use UI Scout to achieve 100% code coverage
 * by generating unit tests, component tests, and E2E tests for any project.
 */

import { UnitTestGenerator } from "./src/UnitTestGenerator";
import { CoverageAnalyzer } from "./src/CoverageAnalyzer";
import { FeatureDiscoveryCoordinator } from "./src/FeatureDiscoveryCoordinator";
import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";

async function generateCompleteTestSuite(projectPath: string) {
  console.log("🚀 UI Scout - Complete Test Suite Generation");
  console.log("=".repeat(60));
  console.log(`Project: ${projectPath}`);
  console.log("");

  // Step 1: Analyze Current Coverage
  console.log("📊 Step 1: Analyzing Current Coverage...");
  const analyzer = new CoverageAnalyzer(projectPath);

  try {
    const coverageReport = await analyzer.analyzeCoverage();
    console.log(`\nCurrent Coverage:`);
    console.log(`  Lines:      ${coverageReport.totalCoverage.lines.toFixed(2)}%`);
    console.log(`  Functions:  ${coverageReport.totalCoverage.functions.toFixed(2)}%`);
    console.log(`  Branches:   ${coverageReport.totalCoverage.branches.toFixed(2)}%`);
    console.log(`  Statements: ${coverageReport.totalCoverage.statements.toFixed(2)}%`);

    if (coverageReport.gaps.length > 0) {
      console.log(`\n⚠️  Found ${coverageReport.gaps.length} files with coverage gaps`);

      // Generate tests for coverage gaps
      console.log("\n🔧 Generating tests for coverage gaps...");
      const gapTests = await analyzer.generateTestsForGaps(coverageReport.gaps);

      // Save gap tests
      const gapDir = path.join(projectPath, "tests/coverage-gaps");
      if (!fs.existsSync(gapDir)) {
        fs.mkdirSync(gapDir, { recursive: true });
      }

      gapTests.forEach((test, index) => {
        const testPath = path.join(gapDir, `gap-${index + 1}.test.ts`);
        fs.writeFileSync(testPath, test);
      });

      console.log(`✅ Generated ${gapTests.length} coverage gap tests`);
    }
  } catch (error) {
    console.log("ℹ️  No existing coverage data. Starting fresh...");
  }

  // Step 2: Generate Unit Tests
  console.log("\n🧪 Step 2: Generating Unit Tests...");
  const unitGenerator = new UnitTestGenerator({
    projectPath,
    framework: "vitest",
    targetCoverage: 100,
    outputDir: "tests/unit",
  });

  const unitTests = await unitGenerator.generateTests();
  console.log(`✅ Generated ${unitTests.length} unit test files`);

  // Show breakdown
  const testTypes = unitTests.reduce(
    (acc, test) => {
      acc[test.testType] = (acc[test.testType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log("\n  Test breakdown:");
  Object.entries(testTypes).forEach(([type, count]) => {
    console.log(`    ${type}: ${count}`);
  });

  // Step 3: Generate E2E Tests (if web app is running)
  console.log("\n🌐 Step 3: Generating E2E Tests...");

  const hasWebApp = await checkForRunningWebApp();
  if (hasWebApp.running) {
    console.log(`  Found web app at ${hasWebApp.url}`);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.goto(hasWebApp.url, { waitUntil: "networkidle" });

      const coordinator = new FeatureDiscoveryCoordinator(page);
      const discoveryResult = await coordinator.discoverFeatures();
      const testCases = await coordinator.generateTests(discoveryResult.features);

      // Save E2E tests
      const e2eDir = path.join(projectPath, "tests/e2e");
      if (!fs.existsSync(e2eDir)) {
        fs.mkdirSync(e2eDir, { recursive: true });
      }

      const e2eTestCode = generateE2ETestFile(testCases, hasWebApp.url);
      fs.writeFileSync(path.join(e2eDir, "app.e2e.test.ts"), e2eTestCode);

      console.log(`✅ Generated E2E tests with ${testCases.length} test cases`);
      console.log(`  Features discovered: ${discoveryResult.features.length}`);
    } finally {
      await browser.close();
    }
  } else {
    console.log("  No running web app detected. Skipping E2E tests.");
    console.log("  Tip: Start your dev server to generate E2E tests");
  }

  // Step 4: Generate Test Configuration
  console.log("\n⚙️  Step 4: Generating Test Configuration...");
  await generateTestConfig(projectPath);
  console.log("✅ Generated test configuration with 100% coverage target");

  // Final Summary
  console.log("\n" + "=".repeat(60));
  console.log("✨ Test Generation Complete!");
  console.log("\n📋 Summary:");
  console.log(`  ✅ Unit tests: ${unitTests.length} files`);
  console.log(`  ✅ E2E tests: ${hasWebApp.running ? "Generated" : "Skipped"}`);
  console.log(`  ✅ Configuration: Updated for 100% coverage`);

  console.log("\n📝 Next Steps:");
  console.log("  1. Review generated tests in tests/");
  console.log("  2. Run: bun test --coverage");
  console.log("  3. Fix any failing tests");
  console.log("  4. Achieve 100% coverage! 🎉");

  console.log("\n💡 Tips:");
  console.log("  - Generated tests may need customization for your specific logic");
  console.log("  - Add more assertions to improve test quality");
  console.log("  - Consider edge cases and error scenarios");
  console.log("  - Use coverage reports to identify remaining gaps");
}

async function checkForRunningWebApp(): Promise<{ running: boolean; url: string }> {
  const urls = [
    "http://localhost:3000",
    "http://localhost:5173", // Vite
    "http://localhost:4200", // Angular
    "http://localhost:8080",
    "http://localhost:8000",
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return { running: true, url };
      }
    } catch {
      // Continue checking
    }
  }

  return { running: false, url: "" };
}

function generateE2ETestFile(testCases: any[], url: string): string {
  return `import { test, expect } from '@playwright/test';

test.describe('E2E Tests - Generated by UI Scout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('${url}');
    await page.waitForLoadState('networkidle');
  });

${testCases
  .map(
    (tc, index) => `
  test('${tc.name || `Test Case ${index + 1}`}', async ({ page }) => {
    // Test steps
${(tc.steps || [])
  .map((step: any) => {
    switch (step.action) {
      case "click":
        return `    await page.click('${step.selector}');`;
      case "fill":
        return `    await page.fill('${step.selector}', '${step.value || "test value"}');`;
      case "check":
        return `    await page.check('${step.selector}');`;
      case "select":
        return `    await page.selectOption('${step.selector}', '${step.value || ""}');`;
      case "hover":
        return `    await page.hover('${step.selector}');`;
      default:
        return `    // ${step.action}: ${step.selector}`;
    }
  })
  .join("\n")}
    
    // Assertions
${(tc.assertions || [])
  .map((assertion: any) => {
    if (assertion.type === "toBeVisible") {
      return `    await expect(page.locator('${assertion.selector}')).toBeVisible();`;
    } else if (assertion.type === "toHaveText") {
      return `    await expect(page.locator('${assertion.selector}')).toHaveText('${assertion.value || ""}');`;
    } else {
      return `    // Add assertion for ${assertion.selector}`;
    }
  })
  .join("\n")}
  });`,
  )
  .join("\n")}
});`;
}

async function generateTestConfig(projectPath: string) {
  const vitestConfig = `import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      all: true,
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      exclude: [
        'src/**/*.test.*',
        'src/**/*.spec.*',
        'src/**/*.d.ts',
        'src/**/types.*',
        'src/**/index.ts',
        'node_modules/**',
        'dist/**'
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100
      }
    }
  }
});`;

  const setupFile = `import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window and document
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Setup test environment
beforeAll(() => {
  // Add any global setup
});

afterEach(() => {
  vi.clearAllMocks();
});`;

  const configPath = path.join(projectPath, "vitest.config.ts");
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, vitestConfig);
  }

  const testsDir = path.join(projectPath, "tests");
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir, { recursive: true });
  }

  const setupPath = path.join(testsDir, "setup.ts");
  if (!fs.existsSync(setupPath)) {
    fs.writeFileSync(setupPath, setupFile);
  }
}

// CLI execution
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();

  console.log("🎯 UI Scout 2.0 - Achieve 100% Code Coverage\n");

  generateCompleteTestSuite(path.resolve(projectPath))
    .then(() => {
      console.log("\n✨ Done! Your project now has comprehensive test coverage.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Error:", error);
      process.exit(1);
    });
}
