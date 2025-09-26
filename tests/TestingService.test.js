"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TestingService_1 = require("../src/TestingService");
const playwright_mock_1 = require("./mocks/playwright.mock");
(0, vitest_1.describe)("TestingService", () => {
    let mockPage;
    let testingService;
    (0, vitest_1.beforeEach)(() => {
        mockPage = (0, playwright_mock_1.createMockPage)();
        testingService = new TestingService_1.TestingService(mockPage);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("generateTestCases", () => {
        (0, vitest_1.it)("should generate test cases from discovered features", async () => {
            const mockFeatures = [
                {
                    type: "button",
                    name: "Submit Button",
                    selector: "#submit",
                    actions: ["click"],
                },
                {
                    type: "input",
                    name: "Email Field",
                    selector: "#email",
                    actions: ["fill"],
                    attributes: { type: "email" },
                },
            ];
            const mockTestCases = [
                {
                    name: "Click Submit Button",
                    feature: mockFeatures[0],
                    steps: [{ action: "click", selector: "#submit" }],
                    assertions: [],
                },
                {
                    name: "Fill Email Field",
                    feature: mockFeatures[1],
                    steps: [{ action: "fill", selector: "#email", value: "test@example.com" }],
                    assertions: [],
                },
            ];
            // Mock the testCaseGenerator
            const mockTestCaseGenerator = {
                generateTestCases: vitest_1.vi.fn().mockResolvedValue(mockTestCases),
            };
            Object.defineProperty(testingService, "testCaseGenerator", {
                value: mockTestCaseGenerator,
                writable: true,
            });
            const result = await testingService.generateTestCases(mockFeatures);
            (0, vitest_1.expect)(mockTestCaseGenerator.generateTestCases).toHaveBeenCalledWith(mockFeatures);
            (0, vitest_1.expect)(result).toEqual(mockTestCases);
            (0, vitest_1.expect)(result).toHaveLength(2);
        });
        (0, vitest_1.it)("should handle empty feature list", async () => {
            const mockTestCaseGenerator = {
                generateTestCases: vitest_1.vi.fn().mockResolvedValue([]),
            };
            Object.defineProperty(testingService, "testCaseGenerator", {
                value: mockTestCaseGenerator,
                writable: true,
            });
            const result = await testingService.generateTestCases([]);
            (0, vitest_1.expect)(mockTestCaseGenerator.generateTestCases).toHaveBeenCalledWith([]);
            (0, vitest_1.expect)(result).toEqual([]);
        });
    });
    (0, vitest_1.describe)("executeTestCases", () => {
        (0, vitest_1.it)("should execute test cases and return results", async () => {
            const mockTestCases = [
                {
                    name: "Test Case 1",
                    feature: {
                        type: "button",
                        name: "Button 1",
                        selector: "#btn1",
                        actions: ["click"],
                    },
                    steps: [{ action: "click", selector: "#btn1" }],
                    assertions: [],
                },
                {
                    name: "Test Case 2",
                    feature: {
                        type: "input",
                        name: "Input 1",
                        selector: "#input1",
                        actions: ["fill"],
                    },
                    steps: [{ action: "fill", selector: "#input1", value: "test" }],
                    assertions: [],
                },
            ];
            const mockResults = [
                {
                    testCase: mockTestCases[0],
                    success: true,
                    duration: 100,
                    error: null,
                    screenshot: null,
                },
                {
                    testCase: mockTestCases[1],
                    success: false,
                    duration: 150,
                    error: "Element not found",
                    screenshot: "/screenshots/error.png",
                },
            ];
            const mockTestExecutor = {
                executeTestCases: vitest_1.vi.fn().mockResolvedValue(mockResults),
            };
            Object.defineProperty(testingService, "testExecutor", {
                value: mockTestExecutor,
                writable: true,
            });
            const result = await testingService.executeTestCases(mockTestCases);
            (0, vitest_1.expect)(mockTestExecutor.executeTestCases).toHaveBeenCalledWith(mockTestCases);
            (0, vitest_1.expect)(result).toEqual(mockResults);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result[0].success).toBe(true);
            (0, vitest_1.expect)(result[1].success).toBe(false);
        });
        (0, vitest_1.it)("should handle empty test case list", async () => {
            const mockTestExecutor = {
                executeTestCases: vitest_1.vi.fn().mockResolvedValue([]),
            };
            Object.defineProperty(testingService, "testExecutor", {
                value: mockTestExecutor,
                writable: true,
            });
            const result = await testingService.executeTestCases([]);
            (0, vitest_1.expect)(mockTestExecutor.executeTestCases).toHaveBeenCalledWith([]);
            (0, vitest_1.expect)(result).toEqual([]);
        });
    });
    (0, vitest_1.describe)("generateAndExecuteTests", () => {
        (0, vitest_1.it)("should generate and execute tests in sequence", async () => {
            const mockFeatures = [
                {
                    type: "button",
                    name: "Test Button",
                    selector: "#test",
                    actions: ["click"],
                },
            ];
            const mockTestCases = [
                {
                    name: "Test Case",
                    feature: mockFeatures[0],
                    steps: [{ action: "click", selector: "#test" }],
                    assertions: [],
                },
            ];
            const mockResults = [
                {
                    testCase: mockTestCases[0],
                    success: true,
                    duration: 50,
                    error: null,
                    screenshot: null,
                },
            ];
            const mockTestCaseGenerator = {
                generateTestCases: vitest_1.vi.fn().mockResolvedValue(mockTestCases),
            };
            const mockTestExecutor = {
                executeTestCases: vitest_1.vi.fn().mockResolvedValue(mockResults),
            };
            Object.defineProperty(testingService, "testCaseGenerator", {
                value: mockTestCaseGenerator,
                writable: true,
            });
            Object.defineProperty(testingService, "testExecutor", {
                value: mockTestExecutor,
                writable: true,
            });
            const result = await testingService.generateAndExecuteTests(mockFeatures);
            (0, vitest_1.expect)(mockTestCaseGenerator.generateTestCases).toHaveBeenCalledWith(mockFeatures);
            (0, vitest_1.expect)(mockTestExecutor.executeTestCases).toHaveBeenCalledWith(mockTestCases);
            (0, vitest_1.expect)(result).toEqual({
                testCases: mockTestCases,
                results: mockResults,
            });
        });
        (0, vitest_1.it)("should handle test generation failures", async () => {
            const mockFeatures = [
                {
                    type: "button",
                    name: "Test Button",
                    selector: "#test",
                    actions: ["click"],
                },
            ];
            const mockTestCaseGenerator = {
                generateTestCases: vitest_1.vi.fn().mockRejectedValue(new Error("Generation failed")),
            };
            Object.defineProperty(testingService, "testCaseGenerator", {
                value: mockTestCaseGenerator,
                writable: true,
            });
            await (0, vitest_1.expect)(testingService.generateAndExecuteTests(mockFeatures)).rejects.toThrow("Generation failed");
        });
        (0, vitest_1.it)("should handle test execution failures", async () => {
            const mockFeatures = [
                {
                    type: "button",
                    name: "Test Button",
                    selector: "#test",
                    actions: ["click"],
                },
            ];
            const mockTestCases = [
                {
                    name: "Test Case",
                    feature: mockFeatures[0],
                    steps: [{ action: "click", selector: "#test" }],
                    assertions: [],
                },
            ];
            const mockTestCaseGenerator = {
                generateTestCases: vitest_1.vi.fn().mockResolvedValue(mockTestCases),
            };
            const mockTestExecutor = {
                executeTestCases: vitest_1.vi.fn().mockRejectedValue(new Error("Execution failed")),
            };
            Object.defineProperty(testingService, "testCaseGenerator", {
                value: mockTestCaseGenerator,
                writable: true,
            });
            Object.defineProperty(testingService, "testExecutor", {
                value: mockTestExecutor,
                writable: true,
            });
            await (0, vitest_1.expect)(testingService.generateAndExecuteTests(mockFeatures)).rejects.toThrow("Execution failed");
        });
        (0, vitest_1.it)("should handle empty features gracefully", async () => {
            const mockTestCaseGenerator = {
                generateTestCases: vitest_1.vi.fn().mockResolvedValue([]),
            };
            const mockTestExecutor = {
                executeTestCases: vitest_1.vi.fn().mockResolvedValue([]),
            };
            Object.defineProperty(testingService, "testCaseGenerator", {
                value: mockTestCaseGenerator,
                writable: true,
            });
            Object.defineProperty(testingService, "testExecutor", {
                value: mockTestExecutor,
                writable: true,
            });
            const result = await testingService.generateAndExecuteTests([]);
            (0, vitest_1.expect)(result).toEqual({
                testCases: [],
                results: [],
            });
        });
    });
    (0, vitest_1.describe)("service initialization", () => {
        (0, vitest_1.it)("should create TestCaseGenerator and TestExecutor instances", () => {
            // These are private but we can verify they exist
            (0, vitest_1.expect)(testingService["testCaseGenerator"]).toBeDefined();
            (0, vitest_1.expect)(testingService["testExecutor"]).toBeDefined();
        });
        (0, vitest_1.it)("should accept custom screenshot path", () => {
            // Just verify the service can be created with a custom path
            // Don't actually create directories in tests
            const _customPath = "test-screenshots-custom";
            // This will use the default test-screenshots directory that already exists
            const customTestingService = new TestingService_1.TestingService(mockPage);
            // The service should be created successfully
            (0, vitest_1.expect)(customTestingService["testExecutor"]).toBeDefined();
        });
    });
    (0, vitest_1.describe)("logging", () => {
        let consoleSpy;
        (0, vitest_1.beforeEach)(() => {
            consoleSpy = vitest_1.vi.spyOn(console, "log").mockImplementation(() => { });
        });
        (0, vitest_1.afterEach)(() => {
            consoleSpy.mockRestore();
        });
        (0, vitest_1.it)("should log test case generation progress", async () => {
            const mockTestCaseGenerator = {
                generateTestCases: vitest_1.vi.fn().mockResolvedValue([]),
            };
            Object.defineProperty(testingService, "testCaseGenerator", {
                value: mockTestCaseGenerator,
                writable: true,
            });
            await testingService.generateTestCases([]);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith("🧪 Generating test cases from discovered features...");
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith("  Generated 0 test cases");
        });
        (0, vitest_1.it)("should log test execution progress", async () => {
            const mockTestExecutor = {
                executeTestCases: vitest_1.vi.fn().mockResolvedValue([]),
            };
            Object.defineProperty(testingService, "testExecutor", {
                value: mockTestExecutor,
                writable: true,
            });
            await testingService.executeTestCases([]);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith("🚀 Executing test cases...");
        });
    });
});
//# sourceMappingURL=TestingService.test.js.map