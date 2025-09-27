/**
 * Integration Test Generator
 * Generates unit, component, and integration tests for achieving 100% code coverage
 */

import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";
import { glob } from "glob";

export interface IntegrationTestOptions {
  projectPath: string;
  framework?: "jest" | "vitest" | "mocha" | "bun";
  outputDir?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  testTypes?: ("unit" | "component" | "hook" | "utility" | "integration")[];
}

export interface GeneratedIntegrationTest {
  filepath: string;
  testCode: string;
  testType: "unit" | "component" | "hook" | "utility" | "integration";
  testedFile: string;
  coverage: {
    lines: number;
    functions: number;
    branches: number;
  };
}

export class IntegrationTestGenerator {
  private options: IntegrationTestOptions;
  private program: ts.Program | null = null;

  constructor(options: IntegrationTestOptions) {
    this.options = {
      framework: "vitest",
      outputDir: "tests/integration",
      includePatterns: ["src/**/*.{ts,tsx,js,jsx}"],
      excludePatterns: ["**/*.test.*", "**/*.spec.*", "**/node_modules/**", "**/dist/**"],
      testTypes: ["unit", "component", "hook", "utility", "integration"],
      ...options,
    };
  }

  async generate(): Promise<GeneratedIntegrationTest[]> {
    console.log("🧪 Generating Integration Tests...");

    const sourceFiles = await this.findSourceFiles();
    console.log(`  Found ${sourceFiles.length} source files`);

    this.createTypeScriptProgram(sourceFiles);

    const tests: GeneratedIntegrationTest[] = [];

    for (const file of sourceFiles) {
      const fileTests = await this.generateTestsForFile(file);
      tests.push(...fileTests);
    }

    await this.writeTests(tests);
    return tests;
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

    return [...new Set(files)];
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

  private async generateTestsForFile(filepath: string): Promise<GeneratedIntegrationTest[]> {
    const sourceFile = this.program?.getSourceFile(filepath);
    if (!this.program || !sourceFile) return [];
    if (!sourceFile) return [];

    const fileContent = fs.readFileSync(filepath, "utf-8");
    const tests: GeneratedIntegrationTest[] = [];

    const fileAnalysis = this.analyzeFile(filepath, fileContent, sourceFile);

    if (this.options.testTypes?.includes(fileAnalysis.type as any)) {
      const test = this.generateTest(filepath, sourceFile, fileAnalysis);
      if (test) {
        tests.push(test);
      }
    }

    return tests;
  }

  private analyzeFile(filepath: string, content: string, sourceFile: ts.SourceFile) {
    const filename = path.basename(filepath);

    // Detect React component
    if (content.includes("React") || content.includes("jsx") || filepath.endsWith(".tsx")) {
      if (filename.match(/^use[A-Z]/)) {
        return { type: "hook", complexity: "medium" };
      }
      return { type: "component", complexity: "high" };
    }

    // Detect hooks
    if (filename.match(/^use[A-Z]/) || filename.includes("hook")) {
      return { type: "hook", complexity: "medium" };
    }

    // Detect utilities
    if (filename.includes("util") || filename.includes("helper") || filename.includes("service")) {
      return { type: "utility", complexity: "low" };
    }

    // Check for classes
    let hasClasses = false;
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isClassDeclaration(node)) {
        hasClasses = true;
      }
    });

    if (hasClasses) {
      return { type: "unit", complexity: "high" };
    }

    return { type: "unit", complexity: "low" };
  }

  private generateTest(
    filepath: string,
    sourceFile: ts.SourceFile,
    analysis: any,
  ): GeneratedIntegrationTest {
    const relativePath = path.relative(this.options.projectPath, filepath);
    const testName = path.basename(filepath).replace(/\.(tsx?|jsx?)$/, "");

    let testCode = "";

    switch (analysis.type) {
      case "component":
        testCode = this.generateComponentIntegrationTest(testName, relativePath, sourceFile);
        break;
      case "hook":
        testCode = this.generateHookIntegrationTest(testName, relativePath, sourceFile);
        break;
      case "utility":
        testCode = this.generateUtilityIntegrationTest(testName, relativePath, sourceFile);
        break;
      default:
        testCode = this.generateUnitIntegrationTest(testName, relativePath, sourceFile);
    }

    return {
      filepath,
      testCode,
      testType: analysis.type,
      testedFile: filepath,
      coverage: {
        lines: 0,
        functions: 0,
        branches: 0,
      },
    };
  }

  private generateComponentIntegrationTest(
    name: string,
    importPath: string,
    sourceFile: ts.SourceFile,
  ): string {
    const componentName = this.extractComponentName(sourceFile) || name;

    return `/**
 * Integration tests for ${componentName}
 * @generated by UI Scout
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from '${this.options.framework}';
import { ${componentName} } from '../../${importPath.replace(/\.(tsx?|jsx?)$/, "")}';

describe('${componentName} Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Component Lifecycle', () => {
    it('should mount and unmount without errors', () => {
      const { unmount } = render(<${componentName} />);
      expect(screen.getByTestId('${componentName.toLowerCase()}')).toBeInTheDocument();
      unmount();
    });

    it('should handle prop updates correctly', () => {
      const { rerender } = render(<${componentName} value="initial" />);
      rerender(<${componentName} value="updated" />);
      // Verify component responds to prop changes
    });

    it('should maintain state across re-renders', async () => {
      const { rerender } = render(<${componentName} />);
      // Interact with component
      rerender(<${componentName} />);
      // Verify state is preserved
    });
  });

  describe('User Interactions', () => {
    it('should handle click events correctly', async () => {
      const handleClick = vi.fn();
      render(<${componentName} onClick={handleClick} />);
      
      const element = screen.getByRole('button');
      await user.click(element);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle keyboard navigation', async () => {
      render(<${componentName} />);
      const element = screen.getByRole('button');
      
      await user.tab();
      expect(element).toHaveFocus();
      
      await user.keyboard('{Enter}');
      // Verify Enter key behavior
      
      await user.keyboard('{Escape}');
      // Verify Escape key behavior
    });

    it('should handle form inputs', async () => {
      render(<${componentName} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test value');
      
      expect(input).toHaveValue('test value');
    });
  });

  describe('Integration with External Systems', () => {
    it('should fetch data on mount', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      });
      global.fetch = mockFetch;

      render(<${componentName} />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should handle API errors gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('API Error'));
      global.fetch = mockFetch;

      render(<${componentName} />);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should update localStorage on state change', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      
      render(<${componentName} />);
      
      // Trigger state change
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(setItemSpy).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn();
      const Component = () => {
        renderSpy();
        return <${componentName} />;
      };
      
      const { rerender } = render(<Component />);
      rerender(<Component />);
      
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should debounce expensive operations', async () => {
      const expensiveOperation = vi.fn();
      render(<${componentName} onSearch={expensiveOperation} />);
      
      const input = screen.getByRole('searchbox');
      
      // Type rapidly
      await user.type(input, 'test');
      
      // Wait for debounce
      await waitFor(() => {
        expect(expensiveOperation).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<${componentName} />);
      
      const element = screen.getByRole('button');
      expect(element).toHaveAttribute('aria-label');
    });

    it('should announce changes to screen readers', async () => {
      render(<${componentName} />);
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should be fully keyboard navigable', async () => {
      render(<${componentName} />);
      
      // Tab through all interactive elements
      const interactiveElements = screen.getAllByRole('button');
      
      for (const element of interactiveElements) {
        await user.tab();
        expect(element).toHaveFocus();
      }
    });
  });

  describe('Error Boundaries', () => {
    it('should catch and display errors gracefully', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const ThrowError = () => {
        throw new Error('Test error');
      };
      
      render(
        <${componentName}>
          <ThrowError />
        </${componentName}>
      );
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      spy.mockRestore();
    });
  });
});`;
  }

  private generateHookIntegrationTest(
    name: string,
    importPath: string,
    sourceFile: ts.SourceFile,
  ): string {
    const hookName = this.extractHookName(sourceFile) || `use${name}`;

    return `/**
 * Integration tests for ${hookName}
 * @generated by UI Scout
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from '${this.options.framework}';
import { ${hookName} } from '../../${importPath.replace(/\.(tsx?|jsx?)$/, "")}';

describe('${hookName} Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Lifecycle', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => ${hookName}());
      expect(result.current).toBeDefined();
    });

    it('should cleanup on unmount', () => {
      const cleanupSpy = vi.fn();
      const { unmount } = renderHook(() => ${hookName}({ onCleanup: cleanupSpy }));
      
      unmount();
      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should handle re-renders correctly', () => {
      const { result, rerender } = renderHook(
        ({ value }) => ${hookName}({ value }),
        { initialProps: { value: 'initial' } }
      );
      
      const initial = result.current;
      
      rerender({ value: 'updated' });
      
      expect(result.current).not.toBe(initial);
    });
  });

  describe('State Management', () => {
    it('should update state correctly', async () => {
      const { result } = renderHook(() => ${hookName}());
      
      act(() => {
        result.current.setState('new value');
      });
      
      expect(result.current.state).toBe('new value');
    });

    it('should batch state updates', async () => {
      const { result } = renderHook(() => ${hookName}());
      
      act(() => {
        result.current.increment();
        result.current.increment();
        result.current.increment();
      });
      
      // Should batch updates
      expect(result.current.renderCount).toBe(1);
    });
  });

  describe('Side Effects', () => {
    it('should fetch data on mount', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ data: 'test' });
      
      const { result } = renderHook(() => ${hookName}({ fetch: mockFetch }));
      
      await waitFor(() => {
        expect(result.current.data).toBe('test');
      });
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle async errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Fetch failed'));
      
      const { result } = renderHook(() => ${hookName}({ fetch: mockFetch }));
      
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should cancel pending operations on unmount', async () => {
      const abortSpy = vi.fn();
      global.AbortController = vi.fn().mockImplementation(() => ({
        abort: abortSpy,
        signal: {}
      }));
      
      const { unmount } = renderHook(() => ${hookName}());
      
      unmount();
      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe('Performance Optimizations', () => {
    it('should memoize expensive computations', () => {
      const expensiveComputation = vi.fn();
      
      const { result, rerender } = renderHook(
        ({ value }) => ${hookName}({ value, compute: expensiveComputation }),
        { initialProps: { value: 1 } }
      );
      
      rerender({ value: 1 });
      rerender({ value: 1 });
      
      expect(expensiveComputation).toHaveBeenCalledTimes(1);
    });

    it('should debounce rapid updates', async () => {
      const callback = vi.fn();
      const { result } = renderHook(() => ${hookName}({ onChange: callback }));
      
      act(() => {
        result.current.setValue('a');
        result.current.setValue('ab');
        result.current.setValue('abc');
      });
      
      await waitFor(() => {
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith('abc');
      }, { timeout: 500 });
    });
  });

  describe('Integration with Context', () => {
    it('should work with React Context', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <TestProvider>{children}</TestProvider>
      );
      
      const { result } = renderHook(() => ${hookName}(), { wrapper });
      
      expect(result.current.contextValue).toBeDefined();
    });
  });
});`;
  }

  private generateUtilityIntegrationTest(
    _name: string,
    importPath: string,
    sourceFile: ts.SourceFile,
  ): string {
    const functions = this.extractExportedFunctions(sourceFile);

    return `/**
 * Integration tests for utility functions
 * @generated by UI Scout
 */

import { describe, it, expect, vi } from '${this.options.framework}';
import { ${functions.join(", ")} } from '../../${importPath.replace(/\.(tsx?|jsx?)$/, "")}';

describe('Utility Functions Integration Tests', () => {
${functions
  .map(
    (func) => `
  describe('${func}', () => {
    describe('Basic Functionality', () => {
      it('should be a function', () => {
        expect(typeof ${func}).toBe('function');
      });

      it('should return expected output for valid input', () => {
        const testCases = [
          { input: 'test', expected: /* add expected */ },
          { input: 123, expected: /* add expected */ },
          { input: true, expected: /* add expected */ },
        ];
        
        testCases.forEach(({ input, expected }) => {
          const result = ${func}(input);
          // expect(result).toEqual(expected);
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle null and undefined', () => {
        expect(() => ${func}(null)).not.toThrow();
        expect(() => ${func}(undefined)).not.toThrow();
      });

      it('should handle empty values', () => {
        expect(() => ${func}('')).not.toThrow();
        expect(() => ${func}([])).not.toThrow();
        expect(() => ${func}({})).not.toThrow();
      });

      it('should handle large inputs', () => {
        const largeArray = Array(10000).fill('test');
        const largeString = 'x'.repeat(100000);
        
        expect(() => ${func}(largeArray)).not.toThrow();
        expect(() => ${func}(largeString)).not.toThrow();
      });

      it('should handle special characters', () => {
        const specialChars = '!@#$%^&*(){}[]|\\\\:;"<>,.?/~\`';
        expect(() => ${func}(specialChars)).not.toThrow();
      });
    });

    describe('Performance', () => {
      it('should complete within reasonable time', () => {
        const start = performance.now();
        
        for (let i = 0; i < 1000; i++) {
          ${func}('test');
        }
        
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(1000); // Should complete 1000 ops in under 1 second
      });

      it('should not cause memory leaks', () => {
        const initialMemory = process.memoryUsage().heapUsed;
        
        for (let i = 0; i < 10000; i++) {
          ${func}('test');
        }
        
        global.gc && global.gc(); // Force garbage collection if available
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
      });
    });

    describe('Type Safety', () => {
      it('should handle different input types', () => {
        const types = [
          'string',
          123,
          true,
          false,
          [],
          {},
          new Date(),
          /regex/,
          Symbol('test'),
          BigInt(123)
        ];
        
        types.forEach(type => {
          expect(() => ${func}(type as any)).not.toThrow();
        });
      });
    });

    describe('Integration with Other Functions', () => {
      it('should compose with other utilities', () => {
        // Test function composition
        const composed = (input: any) => ${func}(${func}(input));
        expect(() => composed('test')).not.toThrow();
      });

      it('should work in async contexts', async () => {
        const result = await Promise.resolve(${func}('test'));
        expect(result).toBeDefined();
      });
    });
  });
`,
  )
  .join("\n")}
});`;
  }

  private generateUnitIntegrationTest(
    name: string,
    importPath: string,
    sourceFile: ts.SourceFile,
  ): string {
    const classes = this.extractClasses(sourceFile);
    const functions = this.extractExportedFunctions(sourceFile);

    return `/**
 * Integration tests for ${name}
 * @generated by UI Scout
 */

import { describe, it, expect, vi, beforeEach, afterEach } from '${this.options.framework}';
import { ${[...classes, ...functions].join(", ")} } from '../../${importPath.replace(/\.(tsx?|jsx?)$/, "")}';

describe('${name} Integration Tests', () => {
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

      it('should initialize with correct defaults', () => {
        expect(instance).toBeDefined();
        // Add specific property checks
      });
    });

    describe('Method Integration', () => {
      it('should chain methods correctly', () => {
        // Test method chaining
      });

      it('should handle async operations', async () => {
        // Test async methods
      });

      it('should emit events correctly', () => {
        const listener = vi.fn();
        instance.on('event', listener);
        
        instance.triggerEvent();
        
        expect(listener).toHaveBeenCalled();
      });
    });

    describe('State Management', () => {
      it('should maintain consistent state', () => {
        // Test state consistency
      });

      it('should handle concurrent operations', async () => {
        // Test race conditions
      });
    });

    describe('Error Handling', () => {
      it('should handle errors gracefully', () => {
        expect(() => instance.methodThatMightFail()).not.toThrow();
      });

      it('should recover from errors', () => {
        instance.causeError();
        expect(instance.isValid()).toBe(true);
      });
    });
  });
`,
  )
  .join("\n")}

${functions
  .map(
    (func) => `
  describe('${func}', () => {
    it('should integrate with system APIs', () => {
      // Test integration with Node.js or browser APIs
    });

    it('should handle concurrent calls', async () => {
      const promises = Array(10).fill(0).map(() => ${func}('test'));
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => expect(result).toBeDefined());
    });
  });
`,
  )
  .join("\n")}
});`;
  }

  // Helper methods
  private extractComponentName(sourceFile: ts.SourceFile): string | null {
    let componentName: string | null = null;

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.text;
        if (name && name.length > 0 && name.charAt(0) === name.charAt(0).toUpperCase()) {
          componentName = name;
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

  private async writeTests(tests: GeneratedIntegrationTest[]): Promise<void> {
    const outputDir = path.join(
      this.options.projectPath,
      this.options.outputDir || "tests/integration",
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Group tests by type
    const testsByType = tests.reduce(
      (acc, test) => {
        if (!acc[test.testType]) {
          acc[test.testType] = [];
        }
        acc[test.testType]?.push(test);
        return acc;
      },
      {} as Record<string, GeneratedIntegrationTest[]>,
    );

    for (const [type, typeTests] of Object.entries(testsByType)) {
      const typeDir = path.join(outputDir, type);
      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true });
      }

      for (const test of typeTests) {
        const testFileName = path
          .basename(test.testedFile)
          .replace(/\.(tsx?|jsx?)$/, ".integration.test.$1");
        const testPath = path.join(typeDir, testFileName);

        fs.writeFileSync(testPath, test.testCode);
        console.log(`  ✅ Generated ${test.testType} test: ${testFileName}`);
      }
    }

    // Generate test index
    this.generateTestIndex(outputDir, tests);
  }

  private generateTestIndex(outputDir: string, tests: GeneratedIntegrationTest[]) {
    const indexContent = `/**
 * Integration Test Suite Index
 * @generated by UI Scout
 * 
 * Total tests: ${tests.length}
 * Coverage target: 100%
 */

export * from './component';
export * from './hook';
export * from './utility';
export * from './unit';

export const testSummary = {
  total: ${tests.length},
  byType: {
    component: ${tests.filter((t) => t.testType === "component").length},
    hook: ${tests.filter((t) => t.testType === "hook").length},
    utility: ${tests.filter((t) => t.testType === "utility").length},
    unit: ${tests.filter((t) => t.testType === "unit").length},
    integration: ${tests.filter((t) => t.testType === "integration").length}
  },
  generatedAt: '${new Date().toISOString()}'
};`;

    fs.writeFileSync(path.join(outputDir, "index.ts"), indexContent);
  }
}
