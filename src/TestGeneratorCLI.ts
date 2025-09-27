#!/usr/bin/env bun

import { Command } from "commander";
import * as path from "path";
import * as fs from "fs";
import { UnitTestGenerator } from "./UnitTestGenerator";
import { CoverageAnalyzer } from "./CoverageAnalyzer";
import { FeatureDiscoveryCoordinator } from "./FeatureDiscoveryCoordinator";
import { chromium } from "playwright";

const program = new Command();

program
  .name("ui-scout")
  .description("Comprehensive test generation tool for achieving 100% code coverage")
  .version("2.0.0");

// Generate all types of tests
program
  .command("generate-all")
  .description("Generate unit, component, and E2E tests for complete coverage")
  .option("-p, --project <path>", "Project path", process.cwd())
  .option("-f, --framework <framework>", "Test framework (jest|vitest|mocha|bun)", "vitest")
  .option("-t, --target <coverage>", "Target coverage percentage", "100")
  .option("-o, --output <dir>", "Output directory for tests", "tests/generated")
  .action(async (options) => {
    console.log("🚀 UI Scout - Complete Test Generation");
    console.log("=".repeat(50));

    const projectPath = path.resolve(options.project);

    // Step 1: Analyze current coverage
    console.log("\n📊 Step 1: Analyzing current coverage...");
    const analyzer = new CoverageAnalyzer(projectPath);

    let coverageReport;
    try {
      coverageReport = await analyzer.analyzeCoverage();
      console.log(`Current coverage: ${coverageReport.totalCoverage.lines.toFixed(1)}%`);
    } catch (error) {
      console.log("No existing coverage data found. Proceeding with full test generation.");
    }

    // Step 2: Generate unit tests
    console.log("\n🧪 Step 2: Generating unit tests...");
    const unitGenerator = new UnitTestGenerator({
      projectPath,
      framework: options.framework,
      targetCoverage: parseInt(options.target),
      outputDir: path.join(options.output, "unit"),
    });

    const unitTests = await unitGenerator.generateTests();
    console.log(`Generated ${unitTests.length} unit test files`);

    // Step 3: Generate E2E tests if app is running
    console.log("\n🌐 Step 3: Checking for E2E test generation...");
    const hasWebApp = await checkForWebApp(projectPath);

    if (hasWebApp) {
      console.log("Web application detected. Generating E2E tests...");
      await generateE2ETests(projectPath, path.join(options.output, "e2e"));
    } else {
      console.log("No running web application found. Skipping E2E test generation.");
    }

    // Step 4: Generate coverage gap tests
    if (coverageReport && coverageReport.gaps.length > 0) {
      console.log("\n🔍 Step 4: Generating tests for coverage gaps...");
      const gapTests = await analyzer.generateTestsForGaps(coverageReport.gaps);

      const gapTestDir = path.join(projectPath, options.output, "gaps");
      if (!fs.existsSync(gapTestDir)) {
        fs.mkdirSync(gapTestDir, { recursive: true });
      }

      gapTests.forEach((test, index) => {
        const testPath = path.join(gapTestDir, `gap-test-${index + 1}.test.ts`);
        fs.writeFileSync(testPath, test);
      });

      console.log(`Generated ${gapTests.length} gap coverage tests`);
    }

    // Step 5: Generate test configuration
    console.log("\n⚙️ Step 5: Generating test configuration...");
    await generateTestConfig(projectPath, options.framework);

    // Final report
    console.log("\n✨ Test Generation Complete!");
    console.log("=".repeat(50));
    console.log("\n📋 Summary:");
    console.log(`  ✅ Unit tests: ${unitTests.length} files`);
    console.log(`  ✅ E2E tests: ${hasWebApp ? "Generated" : "Skipped"}`);
    console.log(`  ✅ Gap tests: ${coverageReport?.gaps.length || 0} files`);
    console.log("\n📝 Next steps:");
    console.log("  1. Review generated tests in " + options.output);
    console.log("  2. Run: bun test --coverage");
    console.log("  3. Fix any failing tests");
    console.log("  4. Achieve 100% coverage! 🎉");
  });

// Analyze coverage gaps
program
  .command("analyze")
  .description("Analyze current test coverage and identify gaps")
  .option("-p, --project <path>", "Project path", process.cwd())
  .action(async (options) => {
    const analyzer = new CoverageAnalyzer(path.resolve(options.project));
    const report = await analyzer.analyzeCoverage();

    console.log("\n📊 Coverage Analysis Complete");
    console.log(JSON.stringify(report, null, 2));
  });

// Generate unit tests only
program
  .command("generate-unit")
  .description("Generate unit tests for TypeScript/JavaScript files")
  .option("-p, --project <path>", "Project path", process.cwd())
  .option("-f, --framework <framework>", "Test framework", "vitest")
  .option("-o, --output <dir>", "Output directory", "tests/unit")
  .action(async (options) => {
    const generator = new UnitTestGenerator({
      projectPath: path.resolve(options.project),
      framework: options.framework,
      outputDir: options.output,
    });

    const tests = await generator.generateTests();
    console.log(`✅ Generated ${tests.length} unit test files`);
  });

// Generate E2E tests only
program
  .command("generate-e2e")
  .description("Generate E2E tests using UI discovery")
  .option("-p, --project <path>", "Project path", process.cwd())
  .option("-u, --url <url>", "Application URL", "http://localhost:3000")
  .option("-o, --output <dir>", "Output directory", "tests/e2e")
  .action(async (options) => {
    await generateE2ETests(path.resolve(options.project), options.output, options.url);
  });

// Helper functions
async function checkForWebApp(projectPath: string): Promise<boolean> {
  const packageJsonPath = path.join(projectPath, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  // Check for web frameworks
  const webFrameworks = ["react", "vue", "angular", "svelte", "next", "nuxt", "gatsby"];
  const hasWebFramework = webFrameworks.some(
    (fw) => packageJson.dependencies?.[fw] || packageJson.devDependencies?.[fw],
  );

  // Check if dev server is running
  try {
    const response = await fetch("http://localhost:3000");
    return response.ok;
  } catch {
    try {
      const response = await fetch("http://localhost:5173"); // Vite default
      return response.ok;
    } catch {
      return hasWebFramework;
    }
  }
}

async function generateE2ETests(
  projectPath: string,
  outputDir: string,
  url: string = "http://localhost:3000",
) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle" });

    const coordinator = new FeatureDiscoveryCoordinator(page);
    const result = await coordinator.discoverFeatures();
    const testCases = await coordinator.generateTests(result.features);

    // Write E2E tests
    const e2eDir = path.join(projectPath, outputDir);
    if (!fs.existsSync(e2eDir)) {
      fs.mkdirSync(e2eDir, { recursive: true });
    }

    const e2eTestCode = generateE2ETestCode(testCases, url);
    fs.writeFileSync(path.join(e2eDir, "app.e2e.test.ts"), e2eTestCode);

    console.log(`✅ Generated E2E tests with ${testCases.length} test cases`);
  } finally {
    await browser.close();
  }
}

function generateE2ETestCode(testCases: any[], url: string): string {
  return `import { test, expect } from '@playwright/test';

test.describe('E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('${url}');
  });

${testCases
  .map(
    (tc, index) => `
  test('${tc.name || `Test Case ${index + 1}`}', async ({ page }) => {
${tc.steps
  .map((step: any) => {
    switch (step.action) {
      case "click":
        return `    await page.click('${step.selector}');`;
      case "fill":
        return `    await page.fill('${step.selector}', '${step.value}');`;
      case "check":
        return `    await page.check('${step.selector}');`;
      case "select":
        return `    await page.selectOption('${step.selector}', '${step.value}');`;
      default:
        return `    // ${step.action}: ${step.selector}`;
    }
  })
  .join("\n")}
    
${tc.assertions
  .map(
    (assertion: any) =>
      `    await expect(page.locator('${assertion.selector}')).${assertion.type}(${assertion.value ? `'${assertion.value}'` : ""});`,
  )
  .join("\n")}
  });
`,
  )
  .join("\n")}
});`;
}

async function generateTestConfig(projectPath: string, framework: string) {
  const configPath = path.join(
    projectPath,
    framework === "vitest"
      ? "vitest.config.ts"
      : framework === "jest"
        ? "jest.config.js"
        : "test.config.js",
  );

  if (fs.existsSync(configPath)) {
    console.log("Test configuration already exists. Skipping...");
    return;
  }

  const config =
    framework === "vitest"
      ? `
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      all: true,
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      exclude: [
        'src/**/*.test.*',
        'src/**/*.spec.*',
        'src/**/types.ts',
        'node_modules/**'
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100
      }
    }
  }
});`
      : framework === "jest"
        ? `
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.test.*',
    '!src/**/*.spec.*',
    '!src/**/types.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};`
        : `
export default {
  coverage: true,
  coverageThreshold: 100,
  coverageReporter: ['text', 'html']
};`;

  fs.writeFileSync(configPath, config);
  console.log(`✅ Generated ${framework} configuration with 100% coverage target`);
}

// Parse CLI arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
