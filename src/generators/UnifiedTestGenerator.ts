/**
 * Unified Test Generator
 * Orchestrates both integration and E2E test generation for 100% coverage
 */

import { IntegrationTestGenerator } from "./IntegrationTestGenerator";
import { E2ETestGenerator } from "./E2ETestGenerator";
import { CoverageAnalyzer } from "../CoverageAnalyzer";
import * as path from "path";
import * as fs from "fs";

export interface UnifiedTestOptions {
  projectPath: string;
  framework?: "jest" | "vitest" | "mocha" | "bun";
  baseUrl?: string;
  targetCoverage?: number;
  generateIntegration?: boolean;
  generateE2E?: boolean;
  outputStructure?: "separate" | "unified";
}

export interface TestGenerationReport {
  projectPath: string;
  timestamp: string;
  coverage: {
    before?: {
      lines: number;
      functions: number;
      branches: number;
      statements: number;
    };
    target: number;
  };
  generated: {
    integration: {
      total: number;
      byType: Record<string, number>;
    };
    e2e: {
      total: number;
      scenarios: number;
      features: number;
    };
  };
  files: string[];
  nextSteps: string[];
}

export class UnifiedTestGenerator {
  private options: UnifiedTestOptions;

  constructor(options: UnifiedTestOptions) {
    this.options = {
      framework: "vitest",
      baseUrl: "http://localhost:3000",
      targetCoverage: 100,
      generateIntegration: true,
      generateE2E: true,
      outputStructure: "separate",
      ...options,
    };
  }

  async generate(): Promise<TestGenerationReport> {
    console.log("🎯 UI Scout - Unified Test Generation");
    console.log("=".repeat(60));
    console.log(`Project: ${this.options.projectPath}`);
    console.log(`Target Coverage: ${this.options.targetCoverage}%`);
    console.log("");

    const report: TestGenerationReport = {
      projectPath: this.options.projectPath,
      timestamp: new Date().toISOString(),
      coverage: {
        target: this.options.targetCoverage || 80,
      },
      generated: {
        integration: { total: 0, byType: {} },
        e2e: { total: 0, scenarios: 0, features: 0 },
      },
      files: [],
      nextSteps: [],
    };

    // Step 1: Analyze current coverage
    console.log("📊 Step 1: Analyzing Current Coverage...");
    try {
      const analyzer = new CoverageAnalyzer(this.options.projectPath);
      const coverageReport = await analyzer.analyzeCoverage();

      report.coverage.before = coverageReport.totalCoverage;

      console.log(`  Current Coverage:`);
      console.log(`    Lines:      ${coverageReport.totalCoverage.lines.toFixed(2)}%`);
      console.log(`    Functions:  ${coverageReport.totalCoverage.functions.toFixed(2)}%`);
      console.log(`    Branches:   ${coverageReport.totalCoverage.branches.toFixed(2)}%`);
      console.log(`    Statements: ${coverageReport.totalCoverage.statements.toFixed(2)}%`);

      if (coverageReport.gaps.length > 0) {
        console.log(`  ⚠️  Found ${coverageReport.gaps.length} files with coverage gaps`);
        report.nextSteps.push(
          `Review and fix ${coverageReport.gaps.length} files with coverage gaps`,
        );
      }
    } catch (error) {
      console.log("  ℹ️  No existing coverage data found");
    }

    // Step 2: Generate Integration Tests
    if (this.options.generateIntegration) {
      console.log("\n🧪 Step 2: Generating Integration Tests...");

      const integrationGen = new IntegrationTestGenerator({
        projectPath: this.options.projectPath,
        framework: this.options.framework,
        outputDir: this.getIntegrationOutputDir(),
      });

      const integrationTests = await integrationGen.generate();

      report.generated.integration.total = integrationTests.length;

      // Count by type
      integrationTests.forEach((test) => {
        report.generated.integration.byType[test.testType] =
          (report.generated.integration.byType[test.testType] || 0) + 1;
        report.files.push(test.filepath);
      });

      console.log(`  ✅ Generated ${integrationTests.length} integration tests`);
      Object.entries(report.generated.integration.byType).forEach(([type, count]) => {
        console.log(`     ${type}: ${count}`);
      });
    }

    // Step 3: Generate E2E Tests
    if (this.options.generateE2E) {
      console.log("\n🌐 Step 3: Generating E2E Tests...");

      const e2eGen = new E2ETestGenerator({
        projectPath: this.options.projectPath,
        baseUrl: this.options.baseUrl,
        outputDir: this.getE2EOutputDir(),
      });

      const e2eTests = await e2eGen.generate();

      report.generated.e2e.total = e2eTests.length;

      if (e2eTests.length > 0) {
        report.generated.e2e.scenarios = e2eTests.reduce((sum, t) => sum + t.scenarios, 0);
        report.generated.e2e.features = e2eTests.reduce((sum, t) => sum + t.features, 0);

        e2eTests.forEach((test) => {
          report.files.push(test.filepath);
        });

        console.log(`  ✅ Generated ${e2eTests.length} E2E test files`);
        console.log(`     Scenarios: ${report.generated.e2e.scenarios}`);
        console.log(`     Features: ${report.generated.e2e.features}`);
      } else {
        console.log("  ⚠️  No E2E tests generated (app may not be running)");
        report.nextSteps.push("Start your dev server and regenerate E2E tests");
      }
    }

    // Step 4: Generate unified test configuration
    console.log("\n⚙️  Step 4: Generating Test Configuration...");
    await this.generateTestConfiguration();
    console.log("  ✅ Generated test configuration");

    // Step 5: Generate coverage scripts
    console.log("\n📝 Step 5: Generating Coverage Scripts...");
    await this.generateCoverageScripts();
    console.log("  ✅ Generated coverage scripts");

    // Add next steps
    report.nextSteps.push(
      "Review generated tests in tests/ directory",
      `Run: ${this.getTestCommand()} to execute all tests`,
      `Run: ${this.getCoverageCommand()} to check coverage`,
      "Fix any failing tests",
      "Customize generated tests for your specific logic",
      "Add additional assertions as needed",
    );

    // Generate final report
    await this.generateReport(report);

    console.log("\n" + "=".repeat(60));
    console.log("✨ Test Generation Complete!");
    console.log("\n📋 Summary:");
    console.log(`  Integration tests: ${report.generated.integration.total}`);
    console.log(`  E2E tests: ${report.generated.e2e.total}`);
    console.log(`  Total files: ${report.files.length}`);

    console.log("\n📝 Next Steps:");
    report.nextSteps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`);
    });

    return report;
  }

  private getIntegrationOutputDir(): string {
    if (this.options.outputStructure === "unified") {
      return "tests/generated/integration";
    }
    return "tests/integration";
  }

  private getE2EOutputDir(): string {
    if (this.options.outputStructure === "unified") {
      return "tests/generated/e2e";
    }
    return "tests/e2e";
  }

  private getTestCommand(): string {
    switch (this.options.framework) {
      case "jest":
        return "npm test";
      case "vitest":
        return "npm run test";
      case "mocha":
        return "npm run test";
      case "bun":
        return "bun test";
      default:
        return "npm test";
    }
  }

  private getCoverageCommand(): string {
    switch (this.options.framework) {
      case "jest":
        return "npm test -- --coverage";
      case "vitest":
        return "npm run test -- --coverage";
      case "mocha":
        return "npm run test:coverage";
      case "bun":
        return "bun test --coverage";
      default:
        return "npm test -- --coverage";
    }
  }

  private async generateTestConfiguration() {
    const configPath = path.join(
      this.options.projectPath,
      this.options.framework === "vitest"
        ? "vitest.config.ts"
        : this.options.framework === "jest"
          ? "jest.config.js"
          : "test.config.js",
    );

    if (fs.existsSync(configPath)) {
      console.log("    Test configuration already exists");
      return;
    }

    const config = this.getTestConfigContent();
    fs.writeFileSync(configPath, config);

    // Generate test setup file
    const setupDir = path.join(this.options.projectPath, "tests");
    if (!fs.existsSync(setupDir)) {
      fs.mkdirSync(setupDir, { recursive: true });
    }

    const setupContent = this.getTestSetupContent();
    fs.writeFileSync(path.join(setupDir, "setup.ts"), setupContent);
  }

  private getTestConfigContent(): string {
    if (this.options.framework === "vitest") {
      return `import { defineConfig } from 'vitest/config';
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
        'node_modules/**',
        'dist/**',
        'tests/**'
      ],
      thresholds: {
        lines: ${this.options.targetCoverage},
        functions: ${this.options.targetCoverage},
        branches: ${this.options.targetCoverage},
        statements: ${this.options.targetCoverage}
      }
    },
    testMatch: [
      'tests/**/*.test.{ts,tsx,js,jsx}',
      'tests/**/*.spec.{ts,tsx,js,jsx}'
    ]
  }
});`;
    } else if (this.options.framework === "jest") {
      return `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.test.*',
    '!src/**/*.spec.*',
    '!src/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: ${this.options.targetCoverage},
      functions: ${this.options.targetCoverage},
      lines: ${this.options.targetCoverage},
      statements: ${this.options.targetCoverage}
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.{ts,tsx,js,jsx}',
    '<rootDir>/tests/**/*.spec.{ts,tsx,js,jsx}'
  ]
};`;
    } else {
      return `export default {
  coverage: true,
  coverageThreshold: ${this.options.targetCoverage},
  coverageReporter: ['text', 'html'],
  testMatch: ['tests/**/*.test.*']
};`;
    }
  }

  private getTestSetupContent(): string {
    return `/**
 * Test Setup
 * @generated by UI Scout
 */

import '@testing-library/jest-dom';
${this.options.framework === "vitest" ? "import { vi } from 'vitest';" : ""}

// Mock window and document
global.ResizeObserver = ${this.options.framework === "vitest" ? "vi.fn()" : "jest.fn()"}.mockImplementation(() => ({
  observe: ${this.options.framework === "vitest" ? "vi.fn()" : "jest.fn()"},
  unobserve: ${this.options.framework === "vitest" ? "vi.fn()" : "jest.fn()"},
  disconnect: ${this.options.framework === "vitest" ? "vi.fn()" : "jest.fn()"},
}));

// Mock fetch
global.fetch = ${this.options.framework === "vitest" ? "vi.fn()" : "jest.fn()"};

// Mock localStorage
const localStorageMock = {
  getItem: ${this.options.framework === "vitest" ? "vi.fn()" : "jest.fn()"},
  setItem: ${this.options.framework === "vitest" ? "vi.fn()" : "jest.fn()"},
  removeItem: ${this.options.framework === "vitest" ? "vi.fn()" : "jest.fn()"},
  clear: ${this.options.framework === "vitest" ? "vi.fn()" : "jest.fn()"},
};
global.localStorage = localStorageMock as any;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return []; }
};

// Setup test environment
beforeAll(() => {
  // Add any global setup
});

afterEach(() => {
  ${this.options.framework === "vitest" ? "vi.clearAllMocks();" : "jest.clearAllMocks();"}
});`;
  }

  private async generateCoverageScripts() {
    const scriptsPath = path.join(this.options.projectPath, "tests", "scripts");
    if (!fs.existsSync(scriptsPath)) {
      fs.mkdirSync(scriptsPath, { recursive: true });
    }

    // Generate coverage checker script
    const coverageChecker = `#!/usr/bin/env node

/**
 * Coverage Checker
 * @generated by UI Scout
 */

const fs = require('fs');
const path = require('path');

const targetCoverage = ${this.options.targetCoverage};

// Read coverage summary
const coveragePath = path.join(__dirname, '../../coverage/coverage-summary.json');

if (!fs.existsSync(coveragePath)) {
  console.error('❌ No coverage data found. Run tests with coverage first.');
  process.exit(1);
}

const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
const total = coverage.total;

console.log('📊 Coverage Report');
console.log('==================');
console.log(\`Lines:      \${total.lines.pct.toFixed(2)}%\`);
console.log(\`Functions:  \${total.functions.pct.toFixed(2)}%\`);
console.log(\`Branches:   \${total.branches.pct.toFixed(2)}%\`);
console.log(\`Statements: \${total.statements.pct.toFixed(2)}%\`);
console.log('');

const metrics = ['lines', 'functions', 'branches', 'statements'];
let passed = true;

metrics.forEach(metric => {
  if (total[metric].pct < targetCoverage) {
    console.error(\`❌ \${metric} coverage (\${total[metric].pct.toFixed(2)}%) is below target (\${targetCoverage}%)\`);
    passed = false;
  }
});

if (passed) {
  console.log(\`✅ All coverage metrics meet or exceed the target of \${targetCoverage}%\`);
  process.exit(0);
} else {
  console.log('');
  console.log('💡 Run the following to see detailed coverage report:');
  console.log('   npx open coverage/index.html');
  process.exit(1);
}`;

    fs.writeFileSync(path.join(scriptsPath, "check-coverage.js"), coverageChecker);
    fs.chmodSync(path.join(scriptsPath, "check-coverage.js"), "755");

    // Generate test runner script
    const testRunner = `#!/usr/bin/env node

/**
 * Test Runner
 * @generated by UI Scout
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Running All Tests...');
console.log('======================');

const commands = [
  { name: 'Unit Tests', cmd: '${this.getTestCommand()} tests/integration/unit' },
  { name: 'Component Tests', cmd: '${this.getTestCommand()} tests/integration/component' },
  { name: 'Hook Tests', cmd: '${this.getTestCommand()} tests/integration/hook' },
  { name: 'Utility Tests', cmd: '${this.getTestCommand()} tests/integration/utility' },
  { name: 'E2E Tests', cmd: 'npx playwright test' }
];

let failed = false;

commands.forEach(({ name, cmd }) => {
  console.log(\`\\n📝 Running \${name}...\`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
    console.log(\`✅ \${name} passed\`);
  } catch (error) {
    console.error(\`❌ \${name} failed\`);
    failed = true;
  }
});

console.log('\\n======================');
if (failed) {
  console.log('❌ Some tests failed');
  process.exit(1);
} else {
  console.log('✅ All tests passed!');
  
  // Run coverage check
  console.log('\\n📊 Checking coverage...');
  execSync('node tests/scripts/check-coverage.js', { 
    stdio: 'inherit', 
    cwd: path.join(__dirname, '../..') 
  });
}`;

    fs.writeFileSync(path.join(scriptsPath, "run-all-tests.js"), testRunner);
    fs.chmodSync(path.join(scriptsPath, "run-all-tests.js"), "755");
  }

  private async generateReport(report: TestGenerationReport) {
    const reportPath = path.join(this.options.projectPath, "tests", "test-generation-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown report
    const mdReport = `# Test Generation Report

Generated by UI Scout on ${new Date(report.timestamp).toLocaleString()}

## Project Information
- **Path**: ${report.projectPath}
- **Target Coverage**: ${report.coverage.target}%

## Current Coverage
${
  report.coverage.before
    ? `
- Lines: ${report.coverage.before.lines.toFixed(2)}%
- Functions: ${report.coverage.before.functions.toFixed(2)}%
- Branches: ${report.coverage.before.branches.toFixed(2)}%
- Statements: ${report.coverage.before.statements.toFixed(2)}%
`
    : "No existing coverage data found"
}

## Generated Tests

### Integration Tests
- **Total**: ${report.generated.integration.total}
${Object.entries(report.generated.integration.byType)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join("\n")}

### E2E Tests
- **Total Files**: ${report.generated.e2e.total}
- **Scenarios**: ${report.generated.e2e.scenarios}
- **Features**: ${report.generated.e2e.features}

## Generated Files
${report.files
  .slice(0, 20)
  .map((file) => `- ${file}`)
  .join("\n")}
${report.files.length > 20 ? `\n... and ${report.files.length - 20} more files` : ""}

## Next Steps
${report.nextSteps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

## Commands
- Run all tests: \`npm test\`
- Run with coverage: \`npm test -- --coverage\`
- Run E2E tests: \`npx playwright test\`
- Check coverage: \`node tests/scripts/check-coverage.js\`
- View coverage report: \`npx open coverage/index.html\`
`;

    const mdPath = path.join(this.options.projectPath, "tests", "TEST_GENERATION_REPORT.md");
    fs.writeFileSync(mdPath, mdReport);
  }
}
