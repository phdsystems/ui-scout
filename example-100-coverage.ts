#!/usr/bin/env bun

/**
 * UI Scout 2.0 - Achieve 100% Code Coverage Example
 *
 * This example demonstrates how to use the reorganized test generators
 * to achieve complete test coverage for any TypeScript/JavaScript project.
 */

import { UnifiedTestGenerator } from "./src/generators/UnifiedTestGenerator";
import { IntegrationTestGenerator } from "./src/generators/IntegrationTestGenerator";
import { E2ETestGenerator } from "./src/generators/E2ETestGenerator";
import { CoverageAnalyzer } from "./src/CoverageAnalyzer";

async function achieveFullCoverage(projectPath: string) {
  console.log("🎯 UI Scout 2.0 - Complete Test Coverage Generator");
  console.log("=".repeat(70));
  console.log("");

  // Option 1: Use Unified Generator (Recommended)
  console.log("📦 Using Unified Test Generator...\n");

  const unifiedGenerator = new UnifiedTestGenerator({
    projectPath,
    framework: "vitest",
    baseUrl: "http://localhost:3000",
    targetCoverage: 100,
    generateIntegration: true,
    generateE2E: true,
    outputStructure: "separate", // 'separate' or 'unified'
  });

  const report = await unifiedGenerator.generate();

  console.log("\n📊 Generation Report:");
  console.log(`  Integration tests: ${report.generated.integration.total}`);
  console.log(`  E2E tests: ${report.generated.e2e.total}`);
  console.log(`  Target coverage: ${report.coverage.target}%`);

  if (report.coverage.before) {
    console.log("\n📈 Coverage Improvement:");
    console.log(`  Before: ${report.coverage.before.lines.toFixed(1)}%`);
    console.log(`  Target: ${report.coverage.target}%`);
  }
}

async function generateIntegrationTestsOnly(projectPath: string) {
  console.log("🧪 Generating Integration Tests Only...\n");

  const integrationGen = new IntegrationTestGenerator({
    projectPath,
    framework: "vitest",
    outputDir: "tests/integration",
    testTypes: ["unit", "component", "hook", "utility"],
    includePatterns: ["src/**/*.{ts,tsx}"],
    excludePatterns: ["**/*.test.*", "**/*.spec.*"],
  });

  const tests = await integrationGen.generate();

  console.log("\n📋 Integration Test Summary:");
  const byType = tests.reduce(
    (acc, t) => {
      acc[t.testType] = (acc[t.testType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} files`);
  });
}

async function generateE2ETestsOnly(projectPath: string) {
  console.log("🌐 Generating E2E Tests Only...\n");

  const e2eGen = new E2ETestGenerator({
    projectPath,
    baseUrl: "http://localhost:3000",
    outputDir: "tests/e2e",
    browsers: ["chromium", "firefox", "webkit"],
    testFramework: "playwright",
    generateVisualTests: true,
    generateAccessibilityTests: true,
    generatePerformanceTests: true,
    testScenarios: [
      {
        name: "User Registration Flow",
        description: "Complete user registration process",
        steps: [
          { action: "navigate", value: "/register" },
          { action: "fill", target: 'input[name="email"]', value: "test@example.com" },
          { action: "fill", target: 'input[name="password"]', value: "Test123!" },
          { action: "click", target: 'button[type="submit"]' },
          { action: "wait", value: "2000" },
        ],
        assertions: [
          { type: "url", expected: "/dashboard" },
          { type: "visible", target: ".welcome-message" },
        ],
      },
      {
        name: "Shopping Cart Flow",
        description: "Add items to cart and checkout",
        steps: [
          { action: "navigate", value: "/products" },
          { action: "click", target: ".product-card:first-child .add-to-cart" },
          { action: "navigate", value: "/cart" },
          { action: "click", target: ".checkout-button" },
        ],
        assertions: [
          { type: "visible", target: ".checkout-form" },
          { type: "text", target: ".cart-total", expected: "$" },
        ],
      },
    ],
  });

  const tests = await e2eGen.generate();

  console.log("\n📋 E2E Test Summary:");
  tests.forEach((test) => {
    console.log(`  ${test.filepath}:`);
    console.log(`    Scenarios: ${test.scenarios}`);
    console.log(`    Features: ${test.features}`);
    console.log(`    Browsers: ${test.browsers.join(", ")}`);
  });
}

async function analyzeCoverageGaps(projectPath: string) {
  console.log("🔍 Analyzing Coverage Gaps...\n");

  const analyzer = new CoverageAnalyzer(projectPath);

  try {
    const report = await analyzer.analyzeCoverage();

    console.log("📊 Current Coverage:");
    console.log(`  Lines:      ${report.totalCoverage.lines.toFixed(2)}%`);
    console.log(`  Functions:  ${report.totalCoverage.functions.toFixed(2)}%`);
    console.log(`  Branches:   ${report.totalCoverage.branches.toFixed(2)}%`);
    console.log(`  Statements: ${report.totalCoverage.statements.toFixed(2)}%`);

    if (report.gaps.length > 0) {
      console.log("\n⚠️  Files with Coverage Gaps:");
      report.gaps.slice(0, 10).forEach((gap) => {
        console.log(`  ${gap.file}: ${gap.currentCoverage.lines.toFixed(1)}%`);
        if (gap.uncoveredLines.length > 0) {
          const lineRanges = gap.uncoveredLines.slice(0, 5).join(", ");
          console.log(
            `    Uncovered lines: ${lineRanges}${gap.uncoveredLines.length > 5 ? "..." : ""}`,
          );
        }
      });

      if (report.gaps.length > 10) {
        console.log(`  ... and ${report.gaps.length - 10} more files`);
      }
    } else {
      console.log("\n✅ No coverage gaps found! You have 100% coverage!");
    }

    console.log("\n💡 Suggestions:");
    report.suggestions.slice(0, 5).forEach((suggestion) => {
      console.log(`  ${suggestion}`);
    });
  } catch (error) {
    console.log("No coverage data found. Run tests with coverage first:");
    console.log("  bun test --coverage");
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const projectPath = args[1] || process.cwd();

  console.log("🚀 UI Scout 2.0 - Test Generation Suite");
  console.log("========================================\n");

  switch (command) {
    case "all":
      await achieveFullCoverage(projectPath);
      break;

    case "integration":
      await generateIntegrationTestsOnly(projectPath);
      break;

    case "e2e":
      await generateE2ETestsOnly(projectPath);
      break;

    case "analyze":
      await analyzeCoverageGaps(projectPath);
      break;

    default:
      console.log("📖 Usage:");
      console.log("  bun example-100-coverage.ts <command> [project-path]\n");
      console.log("Commands:");
      console.log("  all         - Generate all test types (integration + E2E)");
      console.log("  integration - Generate only integration tests");
      console.log("  e2e         - Generate only E2E tests");
      console.log("  analyze     - Analyze coverage gaps\n");
      console.log("Examples:");
      console.log("  bun example-100-coverage.ts all /path/to/project");
      console.log("  bun example-100-coverage.ts integration");
      console.log("  bun example-100-coverage.ts e2e");
      console.log("  bun example-100-coverage.ts analyze\n");
      console.log("📦 Test Output Structure:");
      console.log("  tests/");
      console.log("    ├── integration/    # Unit, component, hook tests");
      console.log("    │   ├── unit/");
      console.log("    │   ├── component/");
      console.log("    │   ├── hook/");
      console.log("    │   └── utility/");
      console.log("    └── e2e/           # End-to-end tests");
      console.log("        ├── app.*.e2e.test.ts");
      console.log("        ├── visual-regression.test.ts");
      console.log("        ├── accessibility.test.ts");
      console.log("        └── performance.test.ts");
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
