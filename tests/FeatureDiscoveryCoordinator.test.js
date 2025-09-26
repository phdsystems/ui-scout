"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const FeatureDiscoveryCoordinator_1 = require("../src/FeatureDiscoveryCoordinator");
const playwright_mock_1 = require("./mocks/playwright.mock");
(0, vitest_1.describe)("FeatureDiscoveryCoordinator", () => {
    let mockPage;
    let coordinator;
    (0, vitest_1.beforeEach)(() => {
        mockPage = (0, playwright_mock_1.createMockPage)();
        coordinator = new FeatureDiscoveryCoordinator_1.FeatureDiscoveryCoordinator(mockPage);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("runComplete", () => {
        (0, vitest_1.it)("should coordinate complete discovery and testing process", async () => {
            // Mock all the services
            const mockDiscoveredFeatures = [
                {
                    type: "button",
                    name: "Submit",
                    selector: "#submit-btn",
                    attributes: { type: "submit" },
                    actions: ["click"],
                    enabled: true,
                },
                {
                    type: "input",
                    name: "Email",
                    selector: "#email",
                    inputType: "email",
                    attributes: { type: "email", name: "email" },
                    actions: ["fill"],
                    required: true,
                },
            ];
            const mockTestCases = [
                {
                    name: "Click Submit button",
                    steps: [{ action: "click", selector: "#submit-btn" }],
                    feature: mockDiscoveredFeatures[0],
                    assertions: [],
                },
                {
                    name: "Fill Email input",
                    steps: [{ action: "fill", selector: "#email", value: "test@example.com" }],
                    feature: mockDiscoveredFeatures[1],
                    assertions: [],
                },
            ];
            const mockTestResults = [
                {
                    testCase: mockTestCases[0],
                    success: true,
                    duration: 150,
                    error: null,
                    screenshot: null,
                },
                {
                    testCase: mockTestCases[1],
                    success: true,
                    duration: 200,
                    error: null,
                    screenshot: null,
                },
            ];
            const mockStructure = {
                totalElements: 2,
                interactiveElements: 2,
                forms: 1,
                navigationItems: 0,
                complexity: "medium",
            };
            const mockAccessibility = {
                missingLabels: 0,
                missingAltText: 0,
                keyboardNavigable: true,
            };
            // Mock the services
            const mockDiscoveryService = {
                discoverAllFeatures: vitest_1.vi.fn().mockResolvedValue(mockDiscoveredFeatures),
                discoverDynamicFeatures: vitest_1.vi.fn().mockResolvedValue([]),
            };
            const mockTestingService = {
                generateTestCases: vitest_1.vi.fn().mockResolvedValue(mockTestCases),
                executeTestCases: vitest_1.vi.fn().mockResolvedValue(mockTestResults),
            };
            const mockAnalysisService = {
                analyzePageStructure: vitest_1.vi.fn().mockResolvedValue(mockStructure),
                analyzeAccessibility: vitest_1.vi.fn().mockResolvedValue(mockAccessibility),
            };
            const mockReportGenerator = {
                generateDiscoveryReport: vitest_1.vi.fn().mockResolvedValue(undefined),
                generateHtmlReport: vitest_1.vi.fn().mockResolvedValue(undefined),
                generateMarkdownSummary: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            // Replace the coordinator's services with mocks
            Object.defineProperty(coordinator, "discoveryService", {
                value: mockDiscoveryService,
                writable: true,
            });
            Object.defineProperty(coordinator, "testingService", {
                value: mockTestingService,
                writable: true,
            });
            Object.defineProperty(coordinator, "analysisService", {
                value: mockAnalysisService,
                writable: true,
            });
            Object.defineProperty(coordinator, "reportGenerator", {
                value: mockReportGenerator,
                writable: true,
            });
            const result = await coordinator.runComplete();
            // Verify all services were called
            (0, vitest_1.expect)(mockDiscoveryService.discoverAllFeatures).toHaveBeenCalled();
            (0, vitest_1.expect)(mockDiscoveryService.discoverDynamicFeatures).toHaveBeenCalledWith(mockDiscoveredFeatures);
            (0, vitest_1.expect)(mockTestingService.generateTestCases).toHaveBeenCalledWith(mockDiscoveredFeatures);
            (0, vitest_1.expect)(mockTestingService.executeTestCases).toHaveBeenCalledWith(mockTestCases);
            (0, vitest_1.expect)(mockAnalysisService.analyzePageStructure).toHaveBeenCalled();
            (0, vitest_1.expect)(mockAnalysisService.analyzeAccessibility).toHaveBeenCalled();
            (0, vitest_1.expect)(mockReportGenerator.generateDiscoveryReport).toHaveBeenCalled();
            (0, vitest_1.expect)(mockReportGenerator.generateHtmlReport).toHaveBeenCalled();
            (0, vitest_1.expect)(mockReportGenerator.generateMarkdownSummary).toHaveBeenCalled();
            // Verify the result structure
            (0, vitest_1.expect)(result).toHaveProperty("discovery");
            (0, vitest_1.expect)(result).toHaveProperty("analysis");
            (0, vitest_1.expect)(result).toHaveProperty("testing");
            (0, vitest_1.expect)(result.discovery.features).toEqual(mockDiscoveredFeatures);
            (0, vitest_1.expect)(result.discovery.count).toBe(2);
            (0, vitest_1.expect)(result.discovery.byType).toEqual({ button: 1, input: 1 });
            (0, vitest_1.expect)(result.testing.testCases).toEqual(mockTestCases);
            (0, vitest_1.expect)(result.testing.testResults).toEqual(mockTestResults);
            (0, vitest_1.expect)(result.testing.executed).toBe(true);
        });
        (0, vitest_1.it)("should handle discovery errors gracefully", async () => {
            const mockDiscoveryService = {
                discoverAllFeatures: vitest_1.vi.fn().mockRejectedValue(new Error("Discovery failed")),
                discoverDynamicFeatures: vitest_1.vi.fn().mockResolvedValue([]),
            };
            Object.defineProperty(coordinator, "discoveryService", {
                value: mockDiscoveryService,
                writable: true,
            });
            await (0, vitest_1.expect)(coordinator.runComplete()).rejects.toThrow("Discovery failed");
        });
        (0, vitest_1.it)("should handle testing errors and continue with analysis", async () => {
            const mockDiscoveredFeatures = [
                {
                    type: "button",
                    name: "Test Button",
                    selector: "#test",
                    actions: ["click"],
                },
            ];
            const mockDiscoveryService = {
                discoverAllFeatures: vitest_1.vi.fn().mockResolvedValue(mockDiscoveredFeatures),
                discoverDynamicFeatures: vitest_1.vi.fn().mockResolvedValue([]),
            };
            const mockTestingService = {
                generateTestCases: vitest_1.vi.fn().mockRejectedValue(new Error("Testing failed")),
                executeTestCases: vitest_1.vi.fn().mockResolvedValue([]),
            };
            const mockAnalysisService = {
                analyzePageStructure: vitest_1.vi.fn().mockResolvedValue({}),
                analyzeAccessibility: vitest_1.vi.fn().mockResolvedValue({}),
            };
            Object.defineProperty(coordinator, "discoveryService", {
                value: mockDiscoveryService,
                writable: true,
            });
            Object.defineProperty(coordinator, "testingService", {
                value: mockTestingService,
                writable: true,
            });
            Object.defineProperty(coordinator, "analysisService", {
                value: mockAnalysisService,
                writable: true,
            });
            // Should throw the testing error
            await (0, vitest_1.expect)(coordinator.runComplete()).rejects.toThrow("Testing failed");
        });
        (0, vitest_1.it)("should handle empty discovery results", async () => {
            const mockDiscoveryService = {
                discoverAllFeatures: vitest_1.vi.fn().mockResolvedValue([]),
                discoverDynamicFeatures: vitest_1.vi.fn().mockResolvedValue([]),
            };
            const mockTestingService = {
                generateTestCases: vitest_1.vi.fn().mockResolvedValue([]),
                executeTestCases: vitest_1.vi.fn().mockResolvedValue([]),
            };
            const mockAnalysisService = {
                analyzePageStructure: vitest_1.vi.fn().mockResolvedValue({}),
                analyzeAccessibility: vitest_1.vi.fn().mockResolvedValue({}),
            };
            const mockReportGenerator = {
                generateDiscoveryReport: vitest_1.vi.fn().mockResolvedValue(undefined),
                generateHtmlReport: vitest_1.vi.fn().mockResolvedValue(undefined),
                generateMarkdownSummary: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            Object.defineProperty(coordinator, "discoveryService", {
                value: mockDiscoveryService,
                writable: true,
            });
            Object.defineProperty(coordinator, "testingService", {
                value: mockTestingService,
                writable: true,
            });
            Object.defineProperty(coordinator, "analysisService", {
                value: mockAnalysisService,
                writable: true,
            });
            Object.defineProperty(coordinator, "reportGenerator", {
                value: mockReportGenerator,
                writable: true,
            });
            const result = await coordinator.runComplete();
            (0, vitest_1.expect)(result.discovery.features).toEqual([]);
            (0, vitest_1.expect)(result.discovery.count).toBe(0);
            (0, vitest_1.expect)(result.testing.testCases).toEqual([]);
            (0, vitest_1.expect)(result.testing.testResults).toEqual([]);
        });
        (0, vitest_1.it)("should skip test execution when includeTestExecution is false", async () => {
            coordinator = new FeatureDiscoveryCoordinator_1.FeatureDiscoveryCoordinator(mockPage, {
                includeTestExecution: false,
            });
            const mockDiscoveredFeatures = [
                {
                    type: "button",
                    name: "Test Button",
                    selector: "#test",
                    actions: ["click"],
                },
            ];
            const mockTestCases = [
                {
                    name: "Test case",
                    steps: [],
                    feature: mockDiscoveredFeatures[0],
                    assertions: [],
                },
            ];
            const mockDiscoveryService = {
                discoverAllFeatures: vitest_1.vi.fn().mockResolvedValue(mockDiscoveredFeatures),
                discoverDynamicFeatures: vitest_1.vi.fn().mockResolvedValue([]),
            };
            const mockTestingService = {
                generateTestCases: vitest_1.vi.fn().mockResolvedValue(mockTestCases),
                executeTestCases: vitest_1.vi.fn(),
            };
            const mockAnalysisService = {
                analyzePageStructure: vitest_1.vi.fn().mockResolvedValue({}),
                analyzeAccessibility: vitest_1.vi.fn().mockResolvedValue({}),
            };
            const mockReportGenerator = {
                generateDiscoveryReport: vitest_1.vi.fn().mockResolvedValue(undefined),
                generateHtmlReport: vitest_1.vi.fn().mockResolvedValue(undefined),
                generateMarkdownSummary: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            Object.defineProperty(coordinator, "discoveryService", {
                value: mockDiscoveryService,
                writable: true,
            });
            Object.defineProperty(coordinator, "testingService", {
                value: mockTestingService,
                writable: true,
            });
            Object.defineProperty(coordinator, "analysisService", {
                value: mockAnalysisService,
                writable: true,
            });
            Object.defineProperty(coordinator, "reportGenerator", {
                value: mockReportGenerator,
                writable: true,
            });
            const result = await coordinator.runComplete();
            (0, vitest_1.expect)(mockTestingService.executeTestCases).not.toHaveBeenCalled();
            (0, vitest_1.expect)(result.testing.executed).toBe(false);
            (0, vitest_1.expect)(result.testing.testResults).toEqual([]);
        });
    });
    (0, vitest_1.describe)("discoverFeatures", () => {
        (0, vitest_1.it)("should discover and aggregate features", async () => {
            const mockStaticFeatures = [
                {
                    type: "button",
                    name: "Button 1",
                    selector: "#btn1",
                    actions: ["click"],
                },
            ];
            const mockDynamicFeatures = [
                {
                    type: "menu",
                    name: "Dynamic Menu",
                    selector: ".menu",
                    actions: ["click"],
                },
            ];
            const mockDiscoveryService = {
                discoverAllFeatures: vitest_1.vi.fn().mockResolvedValue(mockStaticFeatures),
                discoverDynamicFeatures: vitest_1.vi.fn().mockResolvedValue(mockDynamicFeatures),
            };
            Object.defineProperty(coordinator, "discoveryService", {
                value: mockDiscoveryService,
                writable: true,
            });
            const result = await coordinator.discoverFeatures();
            (0, vitest_1.expect)(result.features).toHaveLength(2);
            (0, vitest_1.expect)(result.features).toEqual([...mockStaticFeatures, ...mockDynamicFeatures]);
            (0, vitest_1.expect)(result.count).toBe(2);
            (0, vitest_1.expect)(result.byType).toEqual({ button: 1, menu: 1 });
        });
    });
    (0, vitest_1.describe)("generateTests", () => {
        (0, vitest_1.it)("should generate test cases for features", async () => {
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
                    name: "Test case",
                    steps: [],
                    feature: mockFeatures[0],
                    assertions: [],
                },
            ];
            const mockTestingService = {
                generateTestCases: vitest_1.vi.fn().mockResolvedValue(mockTestCases),
            };
            Object.defineProperty(coordinator, "testingService", {
                value: mockTestingService,
                writable: true,
            });
            const result = await coordinator.generateTests(mockFeatures);
            (0, vitest_1.expect)(mockTestingService.generateTestCases).toHaveBeenCalledWith(mockFeatures);
            (0, vitest_1.expect)(result).toEqual(mockTestCases);
        });
    });
    (0, vitest_1.describe)("executeTests", () => {
        (0, vitest_1.it)("should execute test cases", async () => {
            const mockTestCases = [
                {
                    name: "Test case",
                    steps: [],
                    feature: null,
                    assertions: [],
                },
            ];
            const mockTestResults = [
                {
                    testCase: mockTestCases[0],
                    success: true,
                    duration: 100,
                    error: null,
                    screenshot: null,
                },
            ];
            const mockTestingService = {
                executeTestCases: vitest_1.vi.fn().mockResolvedValue(mockTestResults),
            };
            Object.defineProperty(coordinator, "testingService", {
                value: mockTestingService,
                writable: true,
            });
            const result = await coordinator.executeTests(mockTestCases);
            (0, vitest_1.expect)(mockTestingService.executeTestCases).toHaveBeenCalledWith(mockTestCases);
            (0, vitest_1.expect)(result).toEqual(mockTestResults);
        });
    });
    (0, vitest_1.describe)("analyzePage", () => {
        (0, vitest_1.it)("should analyze page structure and accessibility", async () => {
            const mockStructure = { elements: 10 };
            const mockAccessibility = { issues: 0 };
            const mockAnalysisService = {
                analyzePageStructure: vitest_1.vi.fn().mockResolvedValue(mockStructure),
                analyzeAccessibility: vitest_1.vi.fn().mockResolvedValue(mockAccessibility),
            };
            Object.defineProperty(coordinator, "analysisService", {
                value: mockAnalysisService,
                writable: true,
            });
            const result = await coordinator.analyzePage();
            (0, vitest_1.expect)(mockAnalysisService.analyzePageStructure).toHaveBeenCalled();
            (0, vitest_1.expect)(mockAnalysisService.analyzeAccessibility).toHaveBeenCalled();
            (0, vitest_1.expect)(result).toEqual({
                structure: mockStructure,
                accessibility: mockAccessibility,
                url: mockPage.url(),
            });
        });
    });
    (0, vitest_1.describe)("generateReports", () => {
        (0, vitest_1.it)("should generate all report types", async () => {
            const mockFeatures = [
                {
                    type: "button",
                    name: "Test",
                    selector: "#test",
                    actions: ["click"],
                },
            ];
            const mockTestCases = [
                {
                    name: "Test case",
                    steps: [],
                    feature: mockFeatures[0],
                    assertions: [],
                },
            ];
            const mockTestResults = [
                {
                    testCase: mockTestCases[0],
                    success: true,
                    duration: 100,
                    error: null,
                    screenshot: null,
                },
            ];
            const mockReportGenerator = {
                generateDiscoveryReport: vitest_1.vi.fn().mockResolvedValue(undefined),
                generateHtmlReport: vitest_1.vi.fn().mockResolvedValue(undefined),
                generateMarkdownSummary: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            Object.defineProperty(coordinator, "reportGenerator", {
                value: mockReportGenerator,
                writable: true,
            });
            await coordinator.generateReports(mockFeatures, mockTestCases, mockTestResults);
            (0, vitest_1.expect)(mockReportGenerator.generateDiscoveryReport).toHaveBeenCalledWith(mockPage.url(), mockFeatures, mockTestCases, "feature-discovery-report.json");
            (0, vitest_1.expect)(mockReportGenerator.generateHtmlReport).toHaveBeenCalledWith(mockFeatures, mockTestCases, mockTestResults, "intelligent-test-report.html");
            (0, vitest_1.expect)(mockReportGenerator.generateMarkdownSummary).toHaveBeenCalledWith(mockFeatures, mockTestCases, mockTestResults, "combined-test-report.md");
        });
    });
});
//# sourceMappingURL=FeatureDiscoveryCoordinator.test.js.map