import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { chromium } from "playwright";

// Mock dependencies
vi.mock("fs");
vi.mock("path");
vi.mock("playwright");
vi.mock("../src/UnitTestGenerator");
vi.mock("../src/CoverageAnalyzer");
vi.mock("../src/FeatureDiscoveryCoordinator");

const mockFs = vi.mocked(fs);
const mockPath = vi.mocked(path);
const mockChromium = vi.mocked(chromium);

// Mock browser and page for E2E testing
const mockPage = {
  goto: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
};

const mockBrowser = {
  newPage: vi.fn().mockResolvedValue(mockPage),
  close: vi.fn().mockResolvedValue(undefined),
};

// Mock CLI program
const mockProgram = {
  name: vi.fn().mockReturnThis(),
  description: vi.fn().mockReturnThis(),
  version: vi.fn().mockReturnThis(),
  command: vi.fn().mockReturnThis(),
  option: vi.fn().mockReturnThis(),
  action: vi.fn().mockReturnThis(),
  parse: vi.fn(),
  outputHelp: vi.fn(),
};

vi.mock("commander", () => ({
  Command: vi.fn(() => mockProgram),
}));

describe("TestGeneratorCLI", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockChromium.launch.mockResolvedValue(mockBrowser as any);
    mockPath.resolve.mockImplementation((p) => `/resolved/${p}`);
    mockPath.join.mockImplementation((...args) => args.join("/"));
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{"dependencies": {}}');
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue(undefined);

    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("CLI Setup", () => {
    it("should configure CLI program with correct metadata", async () => {
      // Import the CLI module to trigger setup
      await import("../src/TestGeneratorCLI");

      expect(mockProgram.name).toHaveBeenCalledWith("ui-scout");
      expect(mockProgram.description).toHaveBeenCalledWith(
        "Comprehensive test generation tool for achieving 100% code coverage",
      );
      expect(mockProgram.version).toHaveBeenCalledWith("2.0.0");
    });

    it("should register all required commands", async () => {
      await import("../src/TestGeneratorCLI");

      expect(mockProgram.command).toHaveBeenCalledWith("generate-all");
      expect(mockProgram.command).toHaveBeenCalledWith("analyze");
      expect(mockProgram.command).toHaveBeenCalledWith("generate-unit");
      expect(mockProgram.command).toHaveBeenCalledWith("generate-e2e");
    });

    it("should show help when no arguments provided", async () => {
      const originalArgv = process.argv;
      process.argv = ["node", "cli.js"];

      await import("../src/TestGeneratorCLI");

      expect(mockProgram.outputHelp).toHaveBeenCalled();

      process.argv = originalArgv;
    });
  });

  describe("generate-all command", () => {
    let actionCallback: vi.SpyInstance;

    beforeEach(async () => {
      await import("../src/TestGeneratorCLI");

      // Get the action callback for generate-all command
      const generateAllCalls = mockProgram.action.mock.calls;
      actionCallback = generateAllCalls[0][0]; // First command's action
    });

    it("should execute complete test generation workflow", async () => {
      const options = {
        project: "/test/project",
        framework: "vitest",
        target: "100",
        output: "tests/generated",
      };

      const mockAnalyzer = {
        analyzeCoverage: vi.fn().mockResolvedValue({
          totalCoverage: { lines: 85.5 },
          gaps: [{ file: "test.ts", lines: [1, 2, 3] }],
        }),
        generateTestsForGaps: vi.fn().mockResolvedValue(["gap test 1", "gap test 2"]),
      };

      const mockUnitGenerator = {
        generateTests: vi.fn().mockResolvedValue(["unit1.test.ts", "unit2.test.ts"]),
      };

      // Mock the imports
      const { CoverageAnalyzer } = await import("../src/CoverageAnalyzer");
      const { UnitTestGenerator } = await import("../src/UnitTestGenerator");

      vi.mocked(CoverageAnalyzer).mockImplementation(() => mockAnalyzer as any);
      vi.mocked(UnitTestGenerator).mockImplementation(() => mockUnitGenerator as any);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await actionCallback(options);

      expect(mockPath.resolve).toHaveBeenCalledWith(options.project);
      expect(mockAnalyzer.analyzeCoverage).toHaveBeenCalled();
      expect(mockUnitGenerator.generateTests).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("🚀 UI Scout - Complete Test Generation"),
      );

      consoleSpy.mockRestore();
    });

    it("should handle missing coverage data gracefully", async () => {
      const options = {
        project: "/test/project",
        framework: "vitest",
        target: "100",
        output: "tests/generated",
      };

      const mockAnalyzer = {
        analyzeCoverage: vi.fn().mockRejectedValue(new Error("No coverage data")),
        generateTestsForGaps: vi.fn(),
      };

      const mockUnitGenerator = {
        generateTests: vi.fn().mockResolvedValue([]),
      };

      const { CoverageAnalyzer } = await import("../src/CoverageAnalyzer");
      const { UnitTestGenerator } = await import("../src/UnitTestGenerator");

      vi.mocked(CoverageAnalyzer).mockImplementation(() => mockAnalyzer as any);
      vi.mocked(UnitTestGenerator).mockImplementation(() => mockUnitGenerator as any);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await actionCallback(options);

      expect(consoleSpy).toHaveBeenCalledWith(
        "No existing coverage data found. Proceeding with full test generation.",
      );

      consoleSpy.mockRestore();
    });

    it("should generate gap tests when coverage gaps exist", async () => {
      const options = {
        project: "/test/project",
        framework: "vitest",
        target: "100",
        output: "tests/generated",
      };

      const mockGaps = [
        { file: "uncovered.ts", lines: [10, 15, 20] },
        { file: "partial.ts", lines: [5, 8] },
      ];

      const mockAnalyzer = {
        analyzeCoverage: vi.fn().mockResolvedValue({
          totalCoverage: { lines: 75.0 },
          gaps: mockGaps,
        }),
        generateTestsForGaps: vi
          .fn()
          .mockResolvedValue(["gap test content 1", "gap test content 2"]),
      };

      const mockUnitGenerator = {
        generateTests: vi.fn().mockResolvedValue([]),
      };

      const { CoverageAnalyzer } = await import("../src/CoverageAnalyzer");
      const { UnitTestGenerator } = await import("../src/UnitTestGenerator");

      vi.mocked(CoverageAnalyzer).mockImplementation(() => mockAnalyzer as any);
      vi.mocked(UnitTestGenerator).mockImplementation(() => mockUnitGenerator as any);

      await actionCallback(options);

      expect(mockAnalyzer.generateTestsForGaps).toHaveBeenCalledWith(mockGaps);
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        "/resolved//test/project/tests/generated/gaps",
        { recursive: true },
      );
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        "/resolved//test/project/tests/generated/gaps/gap-test-1.test.ts",
        "gap test content 1",
      );
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        "/resolved//test/project/tests/generated/gaps/gap-test-2.test.ts",
        "gap test content 2",
      );
    });

    it("should generate E2E tests when web app is detected", async () => {
      const options = {
        project: "/test/project",
        framework: "vitest",
        target: "100",
        output: "tests/generated",
      };

      // Mock web app detection
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ dependencies: { react: "^18.0.0" } }));

      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      const mockCoordinator = {
        discoverFeatures: vi.fn().mockResolvedValue({
          features: [{ name: "button", selector: "button" }],
        }),
        generateTests: vi.fn().mockResolvedValue([
          {
            name: "Click button test",
            steps: [{ action: "click", selector: "button" }],
            assertions: [{ selector: "result", type: "toBeVisible" }],
          },
        ]),
      };

      const { FeatureDiscoveryCoordinator } = await import("../src/FeatureDiscoveryCoordinator");
      vi.mocked(FeatureDiscoveryCoordinator).mockImplementation(() => mockCoordinator as any);

      const mockAnalyzer = {
        analyzeCoverage: vi.fn().mockRejectedValue(new Error("No coverage")),
      };

      const mockUnitGenerator = {
        generateTests: vi.fn().mockResolvedValue([]),
      };

      const { CoverageAnalyzer } = await import("../src/CoverageAnalyzer");
      const { UnitTestGenerator } = await import("../src/UnitTestGenerator");

      vi.mocked(CoverageAnalyzer).mockImplementation(() => mockAnalyzer as any);
      vi.mocked(UnitTestGenerator).mockImplementation(() => mockUnitGenerator as any);

      await actionCallback(options);

      expect(mockChromium.launch).toHaveBeenCalledWith({ headless: true });
      expect(mockPage.goto).toHaveBeenCalledWith("http://localhost:3000", {
        waitUntil: "networkidle",
      });
      expect(mockCoordinator.discoverFeatures).toHaveBeenCalled();
      expect(mockCoordinator.generateTests).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });

  describe("analyze command", () => {
    it("should analyze coverage and output report", async () => {
      await import("../src/TestGeneratorCLI");

      const analyzeCallback = mockProgram.action.mock.calls[1][0]; // Second command's action

      const mockAnalyzer = {
        analyzeCoverage: vi.fn().mockResolvedValue({
          totalCoverage: { lines: 89.5, functions: 92.1, branches: 85.3 },
          gaps: [{ file: "test.ts", lines: [5, 10] }],
        }),
      };

      const { CoverageAnalyzer } = await import("../src/CoverageAnalyzer");
      vi.mocked(CoverageAnalyzer).mockImplementation(() => mockAnalyzer as any);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const options = { project: "/test/project" };
      await analyzeCallback(options);

      expect(mockAnalyzer.analyzeCoverage).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("\n📊 Coverage Analysis Complete");
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("totalCoverage"));

      consoleSpy.mockRestore();
    });
  });

  describe("generate-unit command", () => {
    it("should generate unit tests only", async () => {
      await import("../src/TestGeneratorCLI");

      const unitCallback = mockProgram.action.mock.calls[2][0]; // Third command's action

      const mockUnitGenerator = {
        generateTests: vi
          .fn()
          .mockResolvedValue(["unit1.test.ts", "unit2.test.ts", "unit3.test.ts"]),
      };

      const { UnitTestGenerator } = await import("../src/UnitTestGenerator");
      vi.mocked(UnitTestGenerator).mockImplementation(() => mockUnitGenerator as any);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const options = {
        project: "/test/project",
        framework: "vitest",
        output: "tests/unit",
      };

      await unitCallback(options);

      expect(mockUnitGenerator.generateTests).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("✅ Generated 3 unit test files");

      consoleSpy.mockRestore();
    });
  });

  describe("generate-e2e command", () => {
    it("should generate E2E tests with custom URL", async () => {
      await import("../src/TestGeneratorCLI");

      const e2eCallback = mockProgram.action.mock.calls[3][0]; // Fourth command's action

      const mockCoordinator = {
        discoverFeatures: vi.fn().mockResolvedValue({
          features: [
            { name: "login-form", selector: "form#login" },
            { name: "submit-button", selector: "button[type=submit]" },
          ],
        }),
        generateTests: vi.fn().mockResolvedValue([
          {
            name: "Login flow test",
            steps: [
              { action: "fill", selector: "#username", value: "testuser" },
              { action: "fill", selector: "#password", value: "testpass" },
              { action: "click", selector: "button[type=submit]" },
            ],
            assertions: [{ selector: ".dashboard", type: "toBeVisible" }],
          },
        ]),
      };

      const { FeatureDiscoveryCoordinator } = await import("../src/FeatureDiscoveryCoordinator");
      vi.mocked(FeatureDiscoveryCoordinator).mockImplementation(() => mockCoordinator as any);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const options = {
        project: "/test/project",
        url: "http://localhost:5173",
        output: "tests/e2e",
      };

      await e2eCallback(options);

      expect(mockPage.goto).toHaveBeenCalledWith("http://localhost:5173", {
        waitUntil: "networkidle",
      });
      expect(mockCoordinator.discoverFeatures).toHaveBeenCalled();
      expect(mockCoordinator.generateTests).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("✅ Generated E2E tests with 1 test cases");

      consoleSpy.mockRestore();
    });
  });

  describe("Helper Functions", () => {
    describe("checkForWebApp", () => {
      it("should detect React application", async () => {
        mockFs.readFileSync.mockReturnValue(
          JSON.stringify({
            dependencies: { react: "^18.0.0", "react-dom": "^18.0.0" },
          }),
        );

        global.fetch = vi.fn().mockResolvedValue({ ok: true });

        // Import after setting up mocks
        const _cliModule = await import("../src/TestGeneratorCLI");

        // Access the checkForWebApp function through module evaluation
        // Since it's not exported, we test it indirectly through the generate-all command
        const options = {
          project: "/test/project",
          framework: "vitest",
          target: "100",
          output: "tests/generated",
        };

        const mockAnalyzer = {
          analyzeCoverage: vi.fn().mockRejectedValue(new Error("No coverage")),
        };

        const mockUnitGenerator = {
          generateTests: vi.fn().mockResolvedValue([]),
        };

        const { CoverageAnalyzer } = await import("../src/CoverageAnalyzer");
        const { UnitTestGenerator } = await import("../src/UnitTestGenerator");

        vi.mocked(CoverageAnalyzer).mockImplementation(() => mockAnalyzer as any);
        vi.mocked(UnitTestGenerator).mockImplementation(() => mockUnitGenerator as any);

        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        // Get the generate-all action callback
        const actionCallback = mockProgram.action.mock.calls[0][0];
        await actionCallback(options);

        expect(global.fetch).toHaveBeenCalledWith("http://localhost:3000");
        expect(consoleSpy).toHaveBeenCalledWith(
          "Web application detected. Generating E2E tests...",
        );

        consoleSpy.mockRestore();
      });

      it("should fallback to Vite port when main port fails", async () => {
        mockFs.readFileSync.mockReturnValue(JSON.stringify({ dependencies: { vue: "^3.0.0" } }));

        global.fetch = vi
          .fn()
          .mockRejectedValueOnce(new Error("Connection refused"))
          .mockResolvedValueOnce({ ok: true });

        const options = {
          project: "/test/project",
          framework: "vitest",
          target: "100",
          output: "tests/generated",
        };

        const mockAnalyzer = {
          analyzeCoverage: vi.fn().mockRejectedValue(new Error("No coverage")),
        };

        const mockUnitGenerator = {
          generateTests: vi.fn().mockResolvedValue([]),
        };

        const { CoverageAnalyzer } = await import("../src/CoverageAnalyzer");
        const { UnitTestGenerator } = await import("../src/UnitTestGenerator");

        vi.mocked(CoverageAnalyzer).mockImplementation(() => mockAnalyzer as any);
        vi.mocked(UnitTestGenerator).mockImplementation(() => mockUnitGenerator as any);

        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const actionCallback = mockProgram.action.mock.calls[0][0];
        await actionCallback(options);

        expect(global.fetch).toHaveBeenCalledWith("http://localhost:3000");
        expect(global.fetch).toHaveBeenCalledWith("http://localhost:5173");

        consoleSpy.mockRestore();
      });

      it("should return false when no web framework and no server", async () => {
        mockFs.readFileSync.mockReturnValue(JSON.stringify({ dependencies: { lodash: "^4.0.0" } }));

        global.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

        const options = {
          project: "/test/project",
          framework: "vitest",
          target: "100",
          output: "tests/generated",
        };

        const mockAnalyzer = {
          analyzeCoverage: vi.fn().mockRejectedValue(new Error("No coverage")),
        };

        const mockUnitGenerator = {
          generateTests: vi.fn().mockResolvedValue([]),
        };

        const { CoverageAnalyzer } = await import("../src/CoverageAnalyzer");
        const { UnitTestGenerator } = await import("../src/UnitTestGenerator");

        vi.mocked(CoverageAnalyzer).mockImplementation(() => mockAnalyzer as any);
        vi.mocked(UnitTestGenerator).mockImplementation(() => mockUnitGenerator as any);

        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const actionCallback = mockProgram.action.mock.calls[0][0];
        await actionCallback(options);

        expect(consoleSpy).toHaveBeenCalledWith(
          "No running web application found. Skipping E2E test generation.",
        );

        consoleSpy.mockRestore();
      });
    });

    describe("generateTestConfig", () => {
      it("should generate Vitest configuration", async () => {
        mockFs.existsSync.mockReturnValue(false);

        const options = {
          project: "/test/project",
          framework: "vitest",
          target: "100",
          output: "tests/generated",
        };

        const mockAnalyzer = {
          analyzeCoverage: vi.fn().mockRejectedValue(new Error("No coverage")),
        };

        const mockUnitGenerator = {
          generateTests: vi.fn().mockResolvedValue([]),
        };

        const { CoverageAnalyzer } = await import("../src/CoverageAnalyzer");
        const { UnitTestGenerator } = await import("../src/UnitTestGenerator");

        vi.mocked(CoverageAnalyzer).mockImplementation(() => mockAnalyzer as any);
        vi.mocked(UnitTestGenerator).mockImplementation(() => mockUnitGenerator as any);

        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const actionCallback = mockProgram.action.mock.calls[0][0];
        await actionCallback(options);

        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          "/resolved//test/project/vitest.config.ts",
          expect.stringContaining("defineConfig"),
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          "✅ Generated vitest configuration with 100% coverage target",
        );

        consoleSpy.mockRestore();
      });

      it("should generate Jest configuration", async () => {
        mockFs.existsSync.mockReturnValue(false);

        const options = {
          project: "/test/project",
          framework: "jest",
          target: "100",
          output: "tests/generated",
        };

        const mockAnalyzer = {
          analyzeCoverage: vi.fn().mockRejectedValue(new Error("No coverage")),
        };

        const mockUnitGenerator = {
          generateTests: vi.fn().mockResolvedValue([]),
        };

        const { CoverageAnalyzer } = await import("../src/CoverageAnalyzer");
        const { UnitTestGenerator } = await import("../src/UnitTestGenerator");

        vi.mocked(CoverageAnalyzer).mockImplementation(() => mockAnalyzer as any);
        vi.mocked(UnitTestGenerator).mockImplementation(() => mockUnitGenerator as any);

        const actionCallback = mockProgram.action.mock.calls[0][0];
        await actionCallback(options);

        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          "/resolved//test/project/jest.config.js",
          expect.stringContaining("module.exports"),
        );
      });

      it("should skip config generation if file exists", async () => {
        mockFs.existsSync.mockReturnValue(true);

        const options = {
          project: "/test/project",
          framework: "vitest",
          target: "100",
          output: "tests/generated",
        };

        const mockAnalyzer = {
          analyzeCoverage: vi.fn().mockRejectedValue(new Error("No coverage")),
        };

        const mockUnitGenerator = {
          generateTests: vi.fn().mockResolvedValue([]),
        };

        const { CoverageAnalyzer } = await import("../src/CoverageAnalyzer");
        const { UnitTestGenerator } = await import("../src/UnitTestGenerator");

        vi.mocked(CoverageAnalyzer).mockImplementation(() => mockAnalyzer as any);
        vi.mocked(UnitTestGenerator).mockImplementation(() => mockUnitGenerator as any);

        const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        const actionCallback = mockProgram.action.mock.calls[0][0];
        await actionCallback(options);

        expect(consoleSpy).toHaveBeenCalledWith("Test configuration already exists. Skipping...");

        consoleSpy.mockRestore();
      });
    });

    describe("generateE2ETestCode", () => {
      it("should generate proper E2E test code with multiple test cases", async () => {
        const testCases = [
          {
            name: "Login Test",
            steps: [
              { action: "fill", selector: "#username", value: "admin" },
              { action: "fill", selector: "#password", value: "secret" },
              { action: "click", selector: "button[type=submit]" },
            ],
            assertions: [
              { selector: ".dashboard", type: "toBeVisible" },
              { selector: ".welcome", type: "toContainText", value: "Welcome" },
            ],
          },
          {
            name: "Navigation Test",
            steps: [
              { action: "click", selector: "nav a[href='/settings']" },
              { action: "check", selector: "#notifications" },
              { action: "select", selector: "#theme", value: "dark" },
            ],
            assertions: [{ selector: ".settings-page", type: "toBeVisible" }],
          },
        ];

        const options = {
          project: "/test/project",
          url: "http://localhost:3000",
          output: "tests/e2e",
        };

        const mockCoordinator = {
          discoverFeatures: vi.fn().mockResolvedValue({ features: [] }),
          generateTests: vi.fn().mockResolvedValue(testCases),
        };

        const { FeatureDiscoveryCoordinator } = await import("../src/FeatureDiscoveryCoordinator");
        vi.mocked(FeatureDiscoveryCoordinator).mockImplementation(() => mockCoordinator as any);

        await import("../src/TestGeneratorCLI");
        const e2eCallback = mockProgram.action.mock.calls[3][0];

        await e2eCallback(options);

        const writeCall = mockFs.writeFileSync.mock.calls.find((call) =>
          call[0].includes("app.e2e.test.ts"),
        );

        expect(writeCall).toBeDefined();
        const generatedCode = writeCall[1] as string;

        expect(generatedCode).toContain("test('Login Test'");
        expect(generatedCode).toContain("test('Navigation Test'");
        expect(generatedCode).toContain("await page.fill('#username', 'admin');");
        expect(generatedCode).toContain("await page.click('button[type=submit]');");
        expect(generatedCode).toContain("await page.check('#notifications');");
        expect(generatedCode).toContain("await page.selectOption('#theme', 'dark');");
        expect(generatedCode).toContain("await expect(page.locator('.dashboard')).toBeVisible();");
        expect(generatedCode).toContain(
          "await expect(page.locator('.welcome')).toContainText('Welcome');",
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle browser launch failures", async () => {
      mockChromium.launch.mockRejectedValue(new Error("Browser launch failed"));

      const options = {
        project: "/test/project",
        framework: "vitest",
        target: "100",
        output: "tests/generated",
      };

      // Mock web app detection to trigger E2E generation
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ dependencies: { react: "^18.0.0" } }));
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      const mockAnalyzer = {
        analyzeCoverage: vi.fn().mockRejectedValue(new Error("No coverage")),
      };

      const mockUnitGenerator = {
        generateTests: vi.fn().mockResolvedValue([]),
      };

      const { CoverageAnalyzer } = await import("../src/CoverageAnalyzer");
      const { UnitTestGenerator } = await import("../src/UnitTestGenerator");

      vi.mocked(CoverageAnalyzer).mockImplementation(() => mockAnalyzer as any);
      vi.mocked(UnitTestGenerator).mockImplementation(() => mockUnitGenerator as any);

      await import("../src/TestGeneratorCLI");
      const actionCallback = mockProgram.action.mock.calls[0][0];

      await expect(actionCallback(options)).rejects.toThrow("Browser launch failed");
    });

    it("should handle missing package.json gracefully", async () => {
      mockFs.existsSync.mockReturnValue(false);

      const options = {
        project: "/test/project",
        framework: "vitest",
        target: "100",
        output: "tests/generated",
      };

      const mockAnalyzer = {
        analyzeCoverage: vi.fn().mockRejectedValue(new Error("No coverage")),
      };

      const mockUnitGenerator = {
        generateTests: vi.fn().mockResolvedValue([]),
      };

      const { CoverageAnalyzer } = await import("../src/CoverageAnalyzer");
      const { UnitTestGenerator } = await import("../src/UnitTestGenerator");

      vi.mocked(CoverageAnalyzer).mockImplementation(() => mockAnalyzer as any);
      vi.mocked(UnitTestGenerator).mockImplementation(() => mockUnitGenerator as any);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await import("../src/TestGeneratorCLI");
      const actionCallback = mockProgram.action.mock.calls[0][0];

      await actionCallback(options);

      expect(consoleSpy).toHaveBeenCalledWith(
        "No running web application found. Skipping E2E test generation.",
      );

      consoleSpy.mockRestore();
    });

    it("should handle file system errors during gap test generation", async () => {
      const options = {
        project: "/test/project",
        framework: "vitest",
        target: "100",
        output: "tests/generated",
      };

      const mockAnalyzer = {
        analyzeCoverage: vi.fn().mockResolvedValue({
          totalCoverage: { lines: 75.0 },
          gaps: [{ file: "test.ts", lines: [1, 2, 3] }],
        }),
        generateTestsForGaps: vi.fn().mockResolvedValue(["gap test content"]),
      };

      const mockUnitGenerator = {
        generateTests: vi.fn().mockResolvedValue([]),
      };

      // Mock fs.mkdirSync to throw error
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error("Permission denied");
      });

      const { CoverageAnalyzer } = await import("../src/CoverageAnalyzer");
      const { UnitTestGenerator } = await import("../src/UnitTestGenerator");

      vi.mocked(CoverageAnalyzer).mockImplementation(() => mockAnalyzer as any);
      vi.mocked(UnitTestGenerator).mockImplementation(() => mockUnitGenerator as any);

      await import("../src/TestGeneratorCLI");
      const actionCallback = mockProgram.action.mock.calls[0][0];

      await expect(actionCallback(options)).rejects.toThrow("Permission denied");
    });
  });
});
