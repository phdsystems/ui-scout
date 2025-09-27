#!/usr/bin/env bun

import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";
import { glob } from "glob";

export interface TestGeneratorOptions {
  projectPath: string;
  framework?: "jest" | "vitest" | "mocha" | "bun";
  coverage?: boolean;
  targetCoverage?: number;
  outputDir?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface GeneratedTest {
  filepath: string;
  testCode: string;
  testType: "unit" | "component" | "hook" | "utility" | "integration";
  testedFile: string;
}

export class UnitTestGenerator {
  private options: TestGeneratorOptions;
  private program: ts.Program | null = null;

  constructor(options: TestGeneratorOptions) {
    this.options = {
      framework: "vitest",
      targetCoverage: 100,
      outputDir: "tests/generated",
      includePatterns: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
      excludePatterns: ["**/*.test.*", "**/*.spec.*", "**/node_modules/**", "**/dist/**"],
      ...options,
    };
  }

  async generateTests(): Promise<GeneratedTest[]> {
    console.log("🔍 Analyzing project structure...");

    // Find all source files
    const sourceFiles = await this.findSourceFiles();
    console.log(`Found ${sourceFiles.length} source files to analyze`);

    // Create TypeScript program for analysis
    this.createTypeScriptProgram(sourceFiles);

    const generatedTests: GeneratedTest[] = [];

    for (const file of sourceFiles) {
      const tests = await this.generateTestsForFile(file);
      generatedTests.push(...tests);
    }

    // Write tests to disk
    await this.writeTests(generatedTests);

    return generatedTests;
  }

  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];

    for (const pattern of this.options.includePatterns || []) {
      const matches = await glob(pattern, {
        cwd: this.options.projectPath,
        ignore: this.options.excludePatterns,
      });
      files.push(...matches.map((f) => path.join(this.options.projectPath, f)));
    }

    return [...new Set(files)]; // Remove duplicates
  }

  private createTypeScriptProgram(files: string[]) {
    const configPath = ts.findConfigFile(
      this.options.projectPath,
      ts.sys.fileExists,
      "tsconfig.json",
    );

    let compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
      skipLibCheck: true,
      allowJs: true,
    };

    if (configPath) {
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath),
      );
      compilerOptions = parsedConfig.options;
    }

    this.program = ts.createProgram(files, compilerOptions);
  }

  private async generateTestsForFile(filepath: string): Promise<GeneratedTest[]> {
    const sourceFile = this.program?.getSourceFile(filepath);
    if (!this.program || !sourceFile) return [];
    if (!sourceFile) return [];

    const fileContent = fs.readFileSync(filepath, "utf-8");
    const tests: GeneratedTest[] = [];

    // Detect file type
    const testType = this.detectFileType(filepath, fileContent);

    // Generate appropriate tests based on file type
    switch (testType) {
      case "component": {
        const test = await this.generateComponentTest(filepath, sourceFile);
        if (test) tests.push(test);
        break;
      }
      case "hook": {
        const test = await this.generateHookTest(filepath, sourceFile);
        if (test) tests.push(test);
        break;
      }
      case "utility": {
        const test = await this.generateUtilityTest(filepath, sourceFile);
        if (test) tests.push(test);
        break;
      }
      default: {
        const test = await this.generateUnitTest(filepath, sourceFile);
        if (test) tests.push(test);
      }
    }

    return tests.filter((t) => t !== null) as GeneratedTest[];
  }

  private detectFileType(
    filepath: string,
    content: string,
  ): "component" | "hook" | "utility" | "unit" {
    const filename = path.basename(filepath);

    // React component detection
    if (
      filepath.match(/\.(tsx|jsx)$/) ||
      content.includes("import React") ||
      content.includes('from "react"')
    ) {
      if (
        filename.match(/^use[A-Z]/) ||
        content.match(/^export\s+(default\s+)?function\s+use[A-Z]/m)
      ) {
        return "hook";
      }
      return "component";
    }

    // Hook detection
    if (filename.match(/^use[A-Z]/) || filename.includes("hook")) {
      return "hook";
    }

    // Utility detection
    if (filename.includes("util") || filename.includes("helper") || filename.includes("service")) {
      return "utility";
    }

    return "unit";
  }

  private async generateComponentTest(
    filepath: string,
    sourceFile: ts.SourceFile,
  ): Promise<GeneratedTest | null> {
    const componentName = this.extractComponentName(sourceFile);
    if (!componentName) return null;

    const relativePath = path.relative(this.options.projectPath, filepath);
    const importPath = relativePath.replace(/\.(tsx?|jsx?)$/, "");

    const testCode = `import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ${componentName} } from './${importPath}';
import { describe, it, expect, vi, beforeEach, afterEach } from '${this.options.framework}';

describe('${componentName}', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<${componentName} />);
      expect(container).toBeInTheDocument();
    });

    it('should match snapshot', () => {
      const { container } = render(<${componentName} />);
      expect(container).toMatchSnapshot();
    });
${this.generatePropsTests(sourceFile, componentName)}
  });

  describe('User Interactions', () => {
${this.generateInteractionTests(sourceFile, componentName)}
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<${componentName} />);
      // Add specific accessibility checks based on component
    });

    it('should be keyboard navigable', () => {
      render(<${componentName} />);
      // Add keyboard navigation tests
    });
  });

  describe('Error Boundaries', () => {
    it('should handle errors gracefully', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<${componentName} />)).not.toThrow();
      spy.mockRestore();
    });
  });
});`;

    return {
      filepath,
      testCode,
      testType: "component",
      testedFile: filepath,
    };
  }

  private async generateHookTest(
    filepath: string,
    sourceFile: ts.SourceFile,
  ): Promise<GeneratedTest | null> {
    const hookName = this.extractHookName(sourceFile);
    if (!hookName) return null;

    const relativePath = path.relative(this.options.projectPath, filepath);
    const importPath = relativePath.replace(/\.(tsx?|jsx?)$/, "");

    const testCode = `import { renderHook, act, waitFor } from '@testing-library/react';
import { ${hookName} } from './${importPath}';
import { describe, it, expect, vi, beforeEach } from '${this.options.framework}';

describe('${hookName}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => ${hookName}());
    expect(result.current).toBeDefined();
  });

  it('should handle state updates', async () => {
    const { result } = renderHook(() => ${hookName}());
    
    act(() => {
      // Trigger state update
    });
    
    await waitFor(() => {
      // Assert on updated state
    });
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => ${hookName}());
    unmount();
    // Verify cleanup
  });

  it('should handle errors', () => {
    const { result } = renderHook(() => ${hookName}());
    
    expect(() => {
      act(() => {
        // Trigger error condition
      });
    }).not.toThrow();
  });

  it('should memoize expensive computations', () => {
    const { result, rerender } = renderHook(() => ${hookName}());
    const initial = result.current;
    
    rerender();
    expect(result.current).toBe(initial); // Should be same reference
  });
});`;

    return {
      filepath,
      testCode,
      testType: "hook",
      testedFile: filepath,
    };
  }

  private async generateUtilityTest(
    filepath: string,
    sourceFile: ts.SourceFile,
  ): Promise<GeneratedTest | null> {
    const functions = this.extractExportedFunctions(sourceFile);
    if (functions.length === 0) return null;

    const relativePath = path.relative(this.options.projectPath, filepath);
    const importPath = relativePath.replace(/\.(tsx?|jsx?)$/, "");

    const testCode = `import { ${functions.join(", ")} } from './${importPath}';
import { describe, it, expect, vi } from '${this.options.framework}';

${functions
  .map(
    (func) => `
describe('${func}', () => {
  describe('Basic functionality', () => {
    it('should be defined', () => {
      expect(${func}).toBeDefined();
      expect(typeof ${func}).toBe('function');
    });

    it('should handle valid inputs', () => {
      // Test with valid inputs
      ${this.generateFunctionTestCases(func)}
    });

    it('should handle invalid inputs', () => {
      expect(() => ${func}(null)).not.toThrow();
      expect(() => ${func}(undefined)).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty inputs', () => {
      const result = ${func}('');
      expect(result).toBeDefined();
    });

    it('should handle large inputs', () => {
      const largeInput = 'x'.repeat(10000);
      expect(() => ${func}(largeInput)).not.toThrow();
    });

    it('should handle special characters', () => {
      const special = '!@#$%^&*(){}[]|\\:;"<>,.?/~\`';
      expect(() => ${func}(special)).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete within reasonable time', () => {
      const start = performance.now();
      ${func}('test');
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // 100ms threshold
    });
  });
});`,
  )
  .join("\n")}`;

    return {
      filepath,
      testCode,
      testType: "utility",
      testedFile: filepath,
    };
  }

  private async generateUnitTest(
    filepath: string,
    sourceFile: ts.SourceFile,
  ): Promise<GeneratedTest | null> {
    const classes = this.extractClasses(sourceFile);
    const functions = this.extractExportedFunctions(sourceFile);

    if (classes.length === 0 && functions.length === 0) return null;

    const relativePath = path.relative(this.options.projectPath, filepath);
    const importPath = relativePath.replace(/\.(tsx?|jsx?)$/, "");

    let imports = "";
    if (classes.length > 0) imports += classes.join(", ");
    if (functions.length > 0) {
      if (imports) imports += ", ";
      imports += functions.join(", ");
    }

    const testCode = `import { ${imports} } from './${importPath}';
import { describe, it, expect, vi, beforeEach, afterEach } from '${this.options.framework}';

${classes
  .map(
    (className) => `
describe('${className}', () => {
  let instance: ${className};

  beforeEach(() => {
    instance = new ${className}();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create an instance', () => {
      expect(instance).toBeInstanceOf(${className});
    });

    it('should initialize with default values', () => {
      expect(instance).toBeDefined();
    });
  });

  ${this.generateMethodTests(sourceFile, className)}
});`,
  )
  .join("\n")}

${functions
  .map(
    (func) => `
describe('${func}', () => {
  it('should be defined', () => {
    expect(${func}).toBeDefined();
  });

  ${this.generateFunctionTests(func)}
});`,
  )
  .join("\n")}`;

    return {
      filepath,
      testCode,
      testType: "unit",
      testedFile: filepath,
    };
  }

  private extractComponentName(sourceFile: ts.SourceFile): string | null {
    let componentName: string | null = null;

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.text;
        if (name && name.length > 0 && name.charAt(0) === name.charAt(0).toUpperCase()) {
          componentName = name;
        }
      } else if (ts.isVariableStatement(node)) {
        const declaration = node.declarationList.declarations[0];
        if (declaration && ts.isIdentifier(declaration.name)) {
          const name = declaration.name.text;
          if (name && name.length > 0 && name.charAt(0) === name.charAt(0).toUpperCase()) {
            componentName = name;
          }
        }
      }
    });

    return componentName;
  }

  private extractHookName(sourceFile: ts.SourceFile): string | null {
    let hookName: string | null = null;

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.text;
        if (name.startsWith("use")) {
          hookName = name;
        }
      }
    });

    return hookName;
  }

  private extractExportedFunctions(sourceFile: ts.SourceFile): string[] {
    const functions: string[] = [];

    ts.forEachChild(sourceFile, (node) => {
      if (
        ts.isFunctionDeclaration(node) &&
        node.name &&
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        functions.push(node.name.text);
      }
    });

    return functions;
  }

  private extractClasses(sourceFile: ts.SourceFile): string[] {
    const classes: string[] = [];

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        classes.push(node.name.text);
      }
    });

    return classes;
  }

  private generatePropsTests(_sourceFile: ts.SourceFile, componentName: string): string {
    // Extract props interface if available
    return `
    it('should accept and render with props', () => {
      const props = {
        // Add expected props
      };
      render(<${componentName} {...props} />);
      // Add assertions
    });

    it('should handle optional props', () => {
      render(<${componentName} />);
      // Component should render without optional props
    });`;
  }

  private generateInteractionTests(_sourceFile: ts.SourceFile, componentName: string): string {
    return `
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      render(<${componentName} onClick={handleClick} />);
      
      const element = screen.getByRole('button');
      fireEvent.click(element);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle form submissions', async () => {
      const handleSubmit = vi.fn();
      render(<${componentName} onSubmit={handleSubmit} />);
      
      // Add form interaction tests
    });

    it('should handle input changes', async () => {
      render(<${componentName} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      
      await waitFor(() => {
        expect(input).toHaveValue('test');
      });
    });`;
  }

  private generateMethodTests(_sourceFile: ts.SourceFile, _className: string): string {
    return `
  describe('Methods', () => {
    it('should execute methods without errors', () => {
      // Test each method
    });

    it('should handle method parameters', () => {
      // Test with various parameters
    });

    it('should return expected values', () => {
      // Test return values
    });
  })`;
  }

  private generateFunctionTests(funcName: string): string {
    return `
  it('should handle different input types', () => {
    expect(() => ${funcName}('string')).not.toThrow();
    expect(() => ${funcName}(123)).not.toThrow();
    expect(() => ${funcName}(true)).not.toThrow();
    expect(() => ${funcName}([])).not.toThrow();
    expect(() => ${funcName}({})).not.toThrow();
  });

  it('should be pure function', () => {
    const input = 'test';
    const result1 = ${funcName}(input);
    const result2 = ${funcName}(input);
    expect(result1).toEqual(result2);
  });`;
  }

  private generateFunctionTestCases(funcName: string): string {
    return `
      const testCases = [
        { input: 'test', expected: /* add expected */ },
        { input: 123, expected: /* add expected */ },
        { input: [], expected: /* add expected */ },
      ];
      
      testCases.forEach(({ input, expected }) => {
        const result = ${funcName}(input);
        // expect(result).toEqual(expected);
      });`;
  }

  private async writeTests(tests: GeneratedTest[]): Promise<void> {
    const outputDir = path.join(this.options.projectPath, this.options.outputDir || "tests");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const test of tests) {
      const testFileName = path.basename(test.testedFile).replace(/\.(tsx?|jsx?)$/, ".test.$1");
      const testPath = path.join(outputDir, testFileName);

      fs.writeFileSync(testPath, test.testCode);
      console.log(`✅ Generated ${test.testType} test: ${testFileName}`);
    }
  }
}

// CLI interface
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const framework = (process.argv[3] || "vitest") as any;

  const generator = new UnitTestGenerator({
    projectPath,
    framework,
    targetCoverage: 100,
  });

  generator
    .generateTests()
    .then((tests) => {
      console.log(`\n✨ Generated ${tests.length} test files!`);
      console.log("\n📊 Test distribution:");
      const distribution = tests.reduce(
        (acc, t) => {
          acc[t.testType] = (acc[t.testType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      Object.entries(distribution).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    })
    .catch(console.error);
}
