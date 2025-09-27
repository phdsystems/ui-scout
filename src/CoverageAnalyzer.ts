#!/usr/bin/env bun

import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface CoverageGap {
  file: string;
  uncoveredLines: number[];
  uncoveredFunctions: string[];
  uncoveredBranches: string[];
  currentCoverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

export interface CoverageReport {
  totalCoverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  gaps: CoverageGap[];
  suggestions: string[];
}

export class CoverageAnalyzer {
  private projectPath: string;
  private coverageData: any = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async analyzeCoverage(): Promise<CoverageReport> {
    console.log("📊 Running coverage analysis...");

    // Run tests with coverage
    await this.runTestsWithCoverage();

    // Load coverage data
    await this.loadCoverageData();

    // Analyze gaps
    const gaps = this.identifyGaps();

    // Generate suggestions
    const suggestions = this.generateSuggestions(gaps);

    // Calculate total coverage
    const totalCoverage = this.calculateTotalCoverage();

    return {
      totalCoverage,
      gaps,
      suggestions,
    };
  }

  private async runTestsWithCoverage(): Promise<void> {
    const packageJson = path.join(this.projectPath, "package.json");

    if (!fs.existsSync(packageJson)) {
      throw new Error("No package.json found");
    }

    const pkg = JSON.parse(fs.readFileSync(packageJson, "utf-8"));

    // Detect test runner
    let testCommand = "";
    if (pkg.scripts?.["test:coverage"]) {
      testCommand = "npm run test:coverage";
    } else if (pkg.scripts?.test) {
      if (pkg.scripts.test.includes("vitest")) {
        testCommand = "npx vitest run --coverage";
      } else if (pkg.scripts.test.includes("jest")) {
        testCommand = "npx jest --coverage";
      } else if (pkg.scripts.test.includes("bun")) {
        testCommand = "bun test --coverage";
      }
    } else {
      // Try to detect from dependencies
      if (pkg.devDependencies?.vitest || pkg.dependencies?.vitest) {
        testCommand = "npx vitest run --coverage";
      } else if (pkg.devDependencies?.jest || pkg.dependencies?.jest) {
        testCommand = "npx jest --coverage";
      } else {
        testCommand = "bun test --coverage";
      }
    }

    console.log(`Running: ${testCommand}`);

    try {
      await execAsync(testCommand, { cwd: this.projectPath });
    } catch (error) {
      console.warn("Tests may have failed, but coverage data might still be available");
    }
  }

  private async loadCoverageData(): Promise<void> {
    const coveragePaths = [
      "coverage/coverage-final.json",
      "coverage/coverage.json",
      ".nyc_output/coverage.json",
      "coverage-final.json",
    ];

    for (const coveragePath of coveragePaths) {
      const fullPath = path.join(this.projectPath, coveragePath);
      if (fs.existsSync(fullPath)) {
        this.coverageData = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        console.log(`Loaded coverage data from ${coveragePath}`);
        return;
      }
    }

    throw new Error("No coverage data found. Please run tests with coverage first.");
  }

  private identifyGaps(): CoverageGap[] {
    const gaps: CoverageGap[] = [];

    for (const [filePath, fileData] of Object.entries(this.coverageData)) {
      const data = fileData as any;

      // Skip files with 100% coverage
      const lineCoverage = this.calculateLineCoverage(data);
      const functionCoverage = this.calculateFunctionCoverage(data);
      const branchCoverage = this.calculateBranchCoverage(data);
      const statementCoverage = this.calculateStatementCoverage(data);

      if (lineCoverage === 100 && functionCoverage === 100 && branchCoverage === 100) {
        continue;
      }

      // Find uncovered lines
      const uncoveredLines: number[] = [];
      for (const [line, count] of Object.entries(data.s || {})) {
        if (count === 0) {
          const lineNum = data.statementMap[line]?.start?.line;
          if (lineNum) uncoveredLines.push(lineNum);
        }
      }

      // Find uncovered functions
      const uncoveredFunctions: string[] = [];
      for (const [funcId, count] of Object.entries(data.f || {})) {
        if (count === 0) {
          const funcName = data.fnMap[funcId]?.name || `anonymous_${funcId}`;
          uncoveredFunctions.push(funcName);
        }
      }

      // Find uncovered branches
      const uncoveredBranches: string[] = [];
      for (const [branchId, coverage] of Object.entries(data.b || {})) {
        const branches = coverage as number[];
        branches.forEach((count, index) => {
          if (count === 0) {
            uncoveredBranches.push(`${branchId}[${index}]`);
          }
        });
      }

      gaps.push({
        file: path.relative(this.projectPath, filePath),
        uncoveredLines: [...new Set(uncoveredLines)].sort((a, b) => a - b),
        uncoveredFunctions,
        uncoveredBranches,
        currentCoverage: {
          lines: lineCoverage,
          functions: functionCoverage,
          branches: branchCoverage,
          statements: statementCoverage,
        },
      });
    }

    return gaps.sort((a, b) => a.currentCoverage.lines - b.currentCoverage.lines);
  }

  private generateSuggestions(gaps: CoverageGap[]): string[] {
    const suggestions: string[] = [];

    // Priority 1: Files with lowest coverage
    const lowestCoverage = gaps.filter((g) => g.currentCoverage.lines < 50);
    if (lowestCoverage.length > 0) {
      suggestions.push(`🔴 Critical: ${lowestCoverage.length} files have less than 50% coverage`);
      lowestCoverage.slice(0, 3).forEach((g) => {
        suggestions.push(`  - ${g.file}: ${g.currentCoverage.lines.toFixed(1)}% coverage`);
      });
    }

    // Priority 2: Uncovered functions
    const filesWithUncoveredFuncs = gaps.filter((g) => g.uncoveredFunctions.length > 0);
    if (filesWithUncoveredFuncs.length > 0) {
      const totalFuncs = filesWithUncoveredFuncs.reduce(
        (sum, g) => sum + g.uncoveredFunctions.length,
        0,
      );
      suggestions.push(`🟡 ${totalFuncs} functions need test coverage`);

      filesWithUncoveredFuncs.slice(0, 3).forEach((g) => {
        suggestions.push(`  - ${g.file}: ${g.uncoveredFunctions.slice(0, 3).join(", ")}`);
      });
    }

    // Priority 3: Branch coverage
    const filesWithUncoveredBranches = gaps.filter((g) => g.uncoveredBranches.length > 0);
    if (filesWithUncoveredBranches.length > 0) {
      suggestions.push(`🟠 ${filesWithUncoveredBranches.length} files have uncovered branches`);
    }

    // Generate specific test suggestions
    suggestions.push("\n📝 Recommended test additions:");

    gaps.slice(0, 5).forEach((gap) => {
      if (gap.uncoveredFunctions.length > 0) {
        suggestions.push(`\nFor ${gap.file}:`);
        gap.uncoveredFunctions.slice(0, 3).forEach((func) => {
          suggestions.push(`  ✅ Add tests for function: ${func}`);
        });
      }

      if (gap.uncoveredLines.length > 0) {
        const lineRanges = this.groupConsecutiveLines(gap.uncoveredLines);
        if (lineRanges.length > 0) {
          suggestions.push(`  ✅ Cover lines: ${lineRanges.slice(0, 3).join(", ")}`);
        }
      }
    });

    return suggestions;
  }

  private groupConsecutiveLines(lines: number[]): string[] {
    if (lines.length === 0) return [];

    const ranges: string[] = [];
    let start = lines[0];
    let end = lines[0];

    for (let i = 1; i < lines.length; i++) {
      if (end !== undefined && lines[i] === end + 1) {
        end = lines[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = lines[i];
        end = lines[i];
      }
    }

    if (end !== undefined) {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
    } else {
      ranges.push(`${start}`);
    }
    return ranges;
  }

  private calculateLineCoverage(data: any): number {
    const lines = Object.values(data.l || {}) as number[];
    if (lines.length === 0) return 100;

    const covered = lines.filter((count) => count > 0).length;
    return (covered / lines.length) * 100;
  }

  private calculateFunctionCoverage(data: any): number {
    const functions = Object.values(data.f || {}) as number[];
    if (functions.length === 0) return 100;

    const covered = functions.filter((count) => count > 0).length;
    return (covered / functions.length) * 100;
  }

  private calculateBranchCoverage(data: any): number {
    const branches = Object.values(data.b || {}) as number[][];
    if (branches.length === 0) return 100;

    const total = branches.reduce((sum, b) => sum + b.length, 0);
    const covered = branches.reduce((sum, b) => sum + b.filter((count) => count > 0).length, 0);

    return total > 0 ? (covered / total) * 100 : 100;
  }

  private calculateStatementCoverage(data: any): number {
    const statements = Object.values(data.s || {}) as number[];
    if (statements.length === 0) return 100;

    const covered = statements.filter((count) => count > 0).length;
    return (covered / statements.length) * 100;
  }

  private calculateTotalCoverage(): any {
    let totalLines = 0;
    let coveredLines = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalStatements = 0;
    let coveredStatements = 0;

    for (const fileData of Object.values(this.coverageData)) {
      const data = fileData as any;

      // Lines
      const lines = Object.values(data.l || {}) as number[];
      totalLines += lines.length;
      coveredLines += lines.filter((count) => count > 0).length;

      // Functions
      const functions = Object.values(data.f || {}) as number[];
      totalFunctions += functions.length;
      coveredFunctions += functions.filter((count) => count > 0).length;

      // Branches
      const branches = Object.values(data.b || {}) as number[][];
      totalBranches += branches.reduce((sum, b) => sum + b.length, 0);
      coveredBranches += branches.reduce(
        (sum, b) => sum + b.filter((count) => count > 0).length,
        0,
      );

      // Statements
      const statements = Object.values(data.s || {}) as number[];
      totalStatements += statements.length;
      coveredStatements += statements.filter((count) => count > 0).length;
    }

    return {
      lines: totalLines > 0 ? (coveredLines / totalLines) * 100 : 100,
      functions: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 100,
      branches: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 100,
      statements: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 100,
    };
  }

  async generateTestsForGaps(gaps: CoverageGap[]): Promise<string[]> {
    const tests: string[] = [];

    for (const gap of gaps) {
      const testCode = await this.generateTestForFile(gap);
      if (testCode) {
        tests.push(testCode);
      }
    }

    return tests;
  }

  private async generateTestForFile(gap: CoverageGap): Promise<string> {
    // const filePath = path.join(this.projectPath, gap.file);
    // const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Generate targeted tests for uncovered parts
    let testCode = `// Tests to improve coverage for ${gap.file}\n`;
    testCode += `// Current coverage: ${gap.currentCoverage.lines.toFixed(1)}%\n`;
    testCode += `// Uncovered lines: ${gap.uncoveredLines.join(", ")}\n\n`;

    testCode += `import { describe, it, expect, vi } from 'vitest';\n\n`;

    testCode += `describe('Coverage improvement for ${path.basename(gap.file)}', () => {\n`;

    // Add tests for uncovered functions
    for (const func of gap.uncoveredFunctions) {
      testCode += `  it('should test ${func}', () => {\n`;
      testCode += `    // TODO: Add test for ${func}\n`;
      testCode += `    // This function is currently not covered\n`;
      testCode += `  });\n\n`;
    }

    // Add tests for uncovered branches
    if (gap.uncoveredBranches.length > 0) {
      testCode += `  it('should test all branches', () => {\n`;
      testCode += `    // TODO: Add tests for branches: ${gap.uncoveredBranches.join(", ")}\n`;
      testCode += `  });\n\n`;
    }

    testCode += `});\n`;

    return testCode;
  }
}

// CLI interface
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();

  const analyzer = new CoverageAnalyzer(projectPath);

  analyzer
    .analyzeCoverage()
    .then((report) => {
      console.log("\n📊 Coverage Analysis Report");
      console.log("=".repeat(50));

      console.log("\n📈 Total Coverage:");
      console.log(`  Lines:      ${report.totalCoverage.lines.toFixed(2)}%`);
      console.log(`  Functions:  ${report.totalCoverage.functions.toFixed(2)}%`);
      console.log(`  Branches:   ${report.totalCoverage.branches.toFixed(2)}%`);
      console.log(`  Statements: ${report.totalCoverage.statements.toFixed(2)}%`);

      console.log("\n📋 Coverage Gaps:");
      console.log(`  Files with gaps: ${report.gaps.length}`);

      if (report.gaps.length > 0) {
        console.log("\n  Top 5 files needing attention:");
        report.gaps.slice(0, 5).forEach((gap) => {
          console.log(`    - ${gap.file}: ${gap.currentCoverage.lines.toFixed(1)}% coverage`);
        });
      }

      console.log("\n💡 Suggestions:");
      report.suggestions.forEach((suggestion) => {
        console.log(suggestion);
      });
    })
    .catch(console.error);
}
