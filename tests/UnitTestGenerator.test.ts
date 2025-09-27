import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { TestGeneratorOptions, GeneratedTest } from "../src/UnitTestGenerator";
import { UnitTestGenerator } from "../src/UnitTestGenerator";
import * as ts from "typescript";
import * as fs from "fs";
import { glob } from "glob";

vi.mock("fs");
vi.mock("glob");
vi.mock("typescript");

describe("UnitTestGenerator", () => {
  let generator: UnitTestGenerator;
  const mockOptions: TestGeneratorOptions = {
    projectPath: "/test/project",
    framework: "vitest",
    coverage: true,
    targetCoverage: 90,
  };

  beforeEach(() => {
    generator = new UnitTestGenerator(mockOptions);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with provided options", () => {
      expect(generator).toBeDefined();
      expect(generator["options"].projectPath).toBe("/test/project");
      expect(generator["options"].framework).toBe("vitest");
      expect(generator["options"].targetCoverage).toBe(90);
    });

    it("should use default options when not provided", () => {
      const minimalGenerator = new UnitTestGenerator({ projectPath: "/test" });

      expect(minimalGenerator["options"].framework).toBe("vitest");
      expect(minimalGenerator["options"].targetCoverage).toBe(100);
      expect(minimalGenerator["options"].outputDir).toBe("tests/generated");
      expect(minimalGenerator["options"].includePatterns).toEqual([
        "**/*.ts",
        "**/*.tsx",
        "**/*.js",
        "**/*.jsx",
      ]);
    });
  });

  describe("generateTests", () => {
    it("should generate tests for source files", async () => {
      const mockSourceFiles = ["/test/project/src/utils.ts", "/test/project/src/calculator.ts"];

      vi.spyOn(generator as any, "findSourceFiles").mockResolvedValue(mockSourceFiles);
      vi.spyOn(generator as any, "createTypeScriptProgram").mockImplementation(() => {});
      vi.spyOn(generator as any, "generateTestsForFile").mockResolvedValue([
        {
          filepath: "/test/project/tests/utils.test.ts",
          testCode: "test code",
          testType: "unit",
          testedFile: "/test/project/src/utils.ts",
        },
      ]);
      vi.spyOn(generator as any, "writeTests").mockResolvedValue(undefined);

      const tests = await generator.generateTests();

      expect(tests).toBeDefined();
      expect(Array.isArray(tests)).toBe(true);
    });

    it("should handle empty source files", async () => {
      vi.spyOn(generator as any, "findSourceFiles").mockResolvedValue([]);

      const tests = await generator.generateTests();

      expect(tests).toHaveLength(0);
    });
  });

  describe("findSourceFiles", () => {
    it("should find source files matching include patterns", async () => {
      const mockFiles = ["src/index.ts", "src/components/Button.tsx", "lib/utils.js"];

      (glob as any).mockResolvedValue(mockFiles);

      const files = await generator["findSourceFiles"]();

      expect(files).toBeDefined();
      expect(Array.isArray(files)).toBe(true);
      expect(glob).toHaveBeenCalled();
    });

    it("should exclude files matching exclude patterns", async () => {
      (glob as any).mockResolvedValue(["/test/project/src/index.ts"]);

      const files = await generator["findSourceFiles"]();

      expect(files).toHaveLength(1);
      expect(files).not.toContain("/test/project/src/index.test.ts");
      expect(files).not.toContain("/test/project/node_modules/lib.ts");
    });
  });

  describe("generateTestsForFile", () => {
    it("should generate unit tests for functions", async () => {
      const mockSourceFile = {
        fileName: "/test/calculator.ts",
        statements: [],
      } as ts.SourceFile;

      const mockProgram = {
        getSourceFile: vi.fn().mockReturnValue(mockSourceFile),
        getTypeChecker: vi.fn().mockReturnValue({}),
      } as any;

      generator["program"] = mockProgram;

      vi.spyOn(fs, "readFileSync").mockReturnValue("export function calculateSum() {}");
      vi.spyOn(generator as any, "detectFileType").mockReturnValue("unit");
      vi.spyOn(generator as any, "generateUnitTest").mockResolvedValue({
        filepath: "/test/calculator.test.ts",
        testCode: 'describe("calculateSum")',
        testType: "unit",
        testedFile: "/test/calculator.ts",
      });

      const tests = await generator["generateTestsForFile"]("/test/calculator.ts");

      expect(tests).toBeDefined();
      expect(Array.isArray(tests)).toBe(true);
    });

    it("should generate tests for components", async () => {
      const mockSourceFile = {
        fileName: "/test/components/Button.tsx",
        statements: [],
      } as ts.SourceFile;

      const mockProgram = {
        getSourceFile: vi.fn().mockReturnValue(mockSourceFile),
        getTypeChecker: vi.fn().mockReturnValue({}),
      } as any;

      generator["program"] = mockProgram;

      vi.spyOn(fs, "readFileSync").mockReturnValue(
        "export function Button() { return <button>Click</button>; }",
      );
      vi.spyOn(generator as any, "detectFileType").mockReturnValue("component");
      vi.spyOn(generator as any, "generateComponentTest").mockResolvedValue({
        filepath: "/test/components/Button.test.tsx",
        testCode: 'describe("Button")',
        testType: "component",
        testedFile: "/test/components/Button.tsx",
      });

      const tests = await generator["generateTestsForFile"]("/test/components/Button.tsx");

      expect(tests).toBeDefined();
      expect(Array.isArray(tests)).toBe(true);
    });

    it("should determine test type based on file path", async () => {
      const mockSourceFile = {
        fileName: "/test/hooks/useCustomHook.ts",
        statements: [],
      } as ts.SourceFile;

      const mockProgram = {
        getSourceFile: vi.fn().mockReturnValue(mockSourceFile),
        getTypeChecker: vi.fn().mockReturnValue({}),
      } as any;

      generator["program"] = mockProgram;

      vi.spyOn(fs, "readFileSync").mockReturnValue("export function useCustomHook() {}");
      vi.spyOn(generator as any, "detectFileType").mockReturnValue("hook");
      vi.spyOn(generator as any, "generateHookTest").mockResolvedValue({
        filepath: "/test/hooks/useCustomHook.test.ts",
        testCode: 'describe("useCustomHook")',
        testType: "hook",
        testedFile: "/test/hooks/useCustomHook.ts",
      });

      const tests = await generator["generateTestsForFile"]("/test/hooks/useCustomHook.ts");

      expect(tests).toBeDefined();
      expect(Array.isArray(tests)).toBe(true);
    });
  });

  describe("writeTests", () => {
    it("should write generated tests to files", async () => {
      const mockTests: GeneratedTest[] = [
        {
          filepath: "/test/project/tests/utils.test.ts",
          testCode: "test content 1",
          testType: "unit",
          testedFile: "/test/project/src/utils.ts",
        },
      ];

      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
      vi.spyOn(fs, "writeFileSync").mockImplementation(() => undefined);

      await generator["writeTests"](mockTests);

      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe("createTypeScriptProgram", () => {
    it("should create TypeScript program with source files", () => {
      const mockFiles = ["/test/file1.ts", "/test/file2.ts"];
      const mockProgram = {} as ts.Program;

      (ts.createProgram as any).mockReturnValue(mockProgram);

      generator["createTypeScriptProgram"](mockFiles);

      expect(ts.createProgram).toHaveBeenCalled();
      expect(generator["program"]).toBe(mockProgram);
    });
  });

  describe("integration test", () => {
    it("should perform complete test generation workflow", async () => {
      const mockSourceFiles = ["/test/project/src/math.ts"];

      vi.spyOn(generator as any, "findSourceFiles").mockResolvedValue(mockSourceFiles);
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
      vi.spyOn(fs, "writeFileSync").mockImplementation(() => undefined);

      const mockProgram = {
        getSourceFile: vi.fn().mockReturnValue({
          fileName: "/test/project/src/math.ts",
          statements: [],
        }),
        getTypeChecker: vi.fn().mockReturnValue({}),
      } as any;

      (ts.createProgram as any).mockReturnValue(mockProgram);

      vi.spyOn(fs, "readFileSync").mockReturnValue(
        "export function multiply(x: number, y: number): number { return x * y; }",
      );
      vi.spyOn(generator as any, "detectFileType").mockReturnValue("unit");
      vi.spyOn(generator as any, "generateUnitTest").mockResolvedValue({
        filepath: "/test/project/tests/math.test.ts",
        testCode: 'describe("multiply")',
        testType: "unit",
        testedFile: "/test/project/src/math.ts",
      });
      vi.spyOn(generator as any, "generateTestsForFile").mockResolvedValue([
        {
          filepath: "/test/project/tests/math.test.ts",
          testCode: 'describe("multiply")',
          testType: "unit",
          testedFile: "/test/project/src/math.ts",
        },
      ]);

      const tests = await generator.generateTests();
      await generator["writeTests"](tests);

      expect(tests).toBeDefined();
      expect(Array.isArray(tests)).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
});
