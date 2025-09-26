"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const AnalysisService_1 = require("../src/AnalysisService");
const playwright_mock_1 = require("./mocks/playwright.mock");
(0, vitest_1.describe)("AnalysisService", () => {
    let mockPage;
    let analysisService;
    (0, vitest_1.beforeEach)(() => {
        mockPage = (0, playwright_mock_1.createMockPage)();
        analysisService = new AnalysisService_1.AnalysisService(mockPage);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("analyzePageStructure", () => {
        (0, vitest_1.it)("should analyze basic page structure", async () => {
            // Mock page elements
            mockPage.locator.mockImplementation((selector) => {
                const counts = {
                    'main, [role="main"], #main, .main': 1,
                    'header, [role="banner"], .header': 1,
                    'footer, [role="contentinfo"], .footer': 1,
                    'nav, [role="navigation"], .nav': 1,
                    'aside, [role="complementary"], .sidebar': 1,
                    form: 2,
                    'button, [role="button"], input[type="button"]': 5,
                    "a[href]": 3,
                    "input, textarea, select": 4,
                };
                return {
                    count: vitest_1.vi.fn().mockResolvedValue(counts[selector] || 0),
                };
            });
            mockPage.title.mockResolvedValue("Test Page");
            const result = await analysisService.analyzePageStructure();
            (0, vitest_1.expect)(result).toMatchObject({
                title: "Test Page",
                layout: {
                    headers: 1,
                    navs: 1,
                    mainContent: 1,
                    asides: 1,
                    footers: 1,
                },
                interactive: {
                    buttons: 5,
                    links: 3,
                    inputs: 4,
                    forms: 2,
                },
            });
        });
        (0, vitest_1.it)("should analyze page layout structure", async () => {
            mockPage.locator.mockImplementation((selector) => {
                const counts = {
                    'main, [role="main"], #main, .main': 0,
                    'header, [role="banner"], .header': 0,
                    'footer, [role="contentinfo"], .footer': 0,
                    'nav, [role="navigation"], .nav': 2,
                    'aside, [role="complementary"], .sidebar': 0,
                    form: 0,
                    'button, [role="button"], input[type="button"]': 1,
                    "a[href]": 2,
                    "input, textarea, select": 0,
                };
                return {
                    count: vitest_1.vi.fn().mockResolvedValue(counts[selector] || 0),
                };
            });
            mockPage.title.mockResolvedValue("Simple Page");
            const result = await analysisService.analyzePageStructure();
            (0, vitest_1.expect)(result.title).toBe("Simple Page");
            (0, vitest_1.expect)(result.layout.navs).toBe(2);
            (0, vitest_1.expect)(result.interactive.buttons).toBe(1);
            (0, vitest_1.expect)(result.interactive.links).toBe(2);
        });
        (0, vitest_1.it)("should analyze interactive elements", async () => {
            mockPage.locator.mockImplementation((selector) => {
                const counts = {
                    'main, [role="main"], #main, .main': 1,
                    'header, [role="banner"], .header': 1,
                    'footer, [role="contentinfo"], .footer': 1,
                    'nav, [role="navigation"], .nav': 1,
                    'aside, [role="complementary"], .sidebar': 0,
                    form: 3,
                    'button, [role="button"], input[type="button"]': 10,
                    "a[href]": 15,
                    "input, textarea, select": 8,
                };
                return {
                    count: vitest_1.vi.fn().mockResolvedValue(counts[selector] || 0),
                };
            });
            mockPage.title.mockResolvedValue("Interactive Page");
            const result = await analysisService.analyzePageStructure();
            (0, vitest_1.expect)(result.title).toBe("Interactive Page");
            (0, vitest_1.expect)(result.interactive.buttons).toBe(10);
            (0, vitest_1.expect)(result.interactive.links).toBe(15);
            (0, vitest_1.expect)(result.interactive.inputs).toBe(8);
            (0, vitest_1.expect)(result.interactive.forms).toBe(3);
        });
        (0, vitest_1.it)("should handle pages with all layout sections", async () => {
            mockPage.locator.mockImplementation((selector) => {
                const counts = {
                    'main, [role="main"], #main, .main': 1,
                    'header, [role="banner"], .header': 2,
                    'footer, [role="contentinfo"], .footer': 1,
                    'nav, [role="navigation"], .nav': 3,
                    'aside, [role="complementary"], .sidebar': 2,
                    form: 5,
                    'button, [role="button"], input[type="button"]': 20,
                    "a[href]": 30,
                    "input, textarea, select": 15,
                };
                return {
                    count: vitest_1.vi.fn().mockResolvedValue(counts[selector] || 0),
                };
            });
            mockPage.title.mockResolvedValue("Complex Page");
            const result = await analysisService.analyzePageStructure();
            (0, vitest_1.expect)(result.title).toBe("Complex Page");
            (0, vitest_1.expect)(result.layout.headers).toBe(2);
            (0, vitest_1.expect)(result.layout.navs).toBe(3);
            (0, vitest_1.expect)(result.layout.mainContent).toBe(1);
            (0, vitest_1.expect)(result.layout.asides).toBe(2);
            (0, vitest_1.expect)(result.layout.footers).toBe(1);
            (0, vitest_1.expect)(result.interactive.buttons).toBe(20);
            (0, vitest_1.expect)(result.interactive.links).toBe(30);
        });
        (0, vitest_1.it)("should handle empty pages", async () => {
            mockPage.locator.mockImplementation(() => ({
                count: vitest_1.vi.fn().mockResolvedValue(0),
            }));
            mockPage.title.mockResolvedValue("Empty Page");
            const result = await analysisService.analyzePageStructure();
            (0, vitest_1.expect)(result.title).toBe("Empty Page");
            (0, vitest_1.expect)(result.layout.headers).toBe(0);
            (0, vitest_1.expect)(result.layout.navs).toBe(0);
            (0, vitest_1.expect)(result.interactive.buttons).toBe(0);
            (0, vitest_1.expect)(result.interactive.links).toBe(0);
            (0, vitest_1.expect)(result.interactive.inputs).toBe(0);
            (0, vitest_1.expect)(result.interactive.forms).toBe(0);
        });
        (0, vitest_1.it)("should handle pages with mixed layout sections", async () => {
            mockPage.locator.mockImplementation((selector) => {
                const counts = {
                    'main, [role="main"], #main, .main': 2,
                    'header, [role="banner"], .header': 1,
                    'footer, [role="contentinfo"], .footer': 0,
                    'nav, [role="navigation"], .nav': 0,
                    'aside, [role="complementary"], .sidebar': 0,
                    form: 1,
                    'button, [role="button"], input[type="button"]': 5,
                    "a[href]": 0,
                    "input, textarea, select": 3,
                };
                return {
                    count: vitest_1.vi.fn().mockResolvedValue(counts[selector] || 0),
                };
            });
            mockPage.title.mockResolvedValue("Mixed Layout Page");
            const result = await analysisService.analyzePageStructure();
            (0, vitest_1.expect)(result.title).toBe("Mixed Layout Page");
            (0, vitest_1.expect)(result.layout.headers).toBe(1);
            (0, vitest_1.expect)(result.layout.navs).toBe(0);
            (0, vitest_1.expect)(result.layout.mainContent).toBe(2);
            (0, vitest_1.expect)(result.interactive.buttons).toBe(5);
            (0, vitest_1.expect)(result.interactive.links).toBe(0);
            (0, vitest_1.expect)(result.interactive.inputs).toBe(3);
        });
        (0, vitest_1.it)("should provide consistent structure for all analysis results", async () => {
            mockPage.locator.mockImplementation(() => ({
                count: vitest_1.vi.fn().mockResolvedValue(0),
            }));
            mockPage.title.mockResolvedValue("Consistent Page");
            const result = await analysisService.analyzePageStructure();
            (0, vitest_1.expect)(result).toHaveProperty("title");
            (0, vitest_1.expect)(result).toHaveProperty("layout");
            (0, vitest_1.expect)(result).toHaveProperty("interactive");
            (0, vitest_1.expect)(result.layout).toHaveProperty("headers");
            (0, vitest_1.expect)(result.layout).toHaveProperty("navs");
            (0, vitest_1.expect)(result.layout).toHaveProperty("mainContent");
            (0, vitest_1.expect)(result.layout).toHaveProperty("asides");
            (0, vitest_1.expect)(result.layout).toHaveProperty("footers");
            (0, vitest_1.expect)(result.interactive).toHaveProperty("buttons");
            (0, vitest_1.expect)(result.interactive).toHaveProperty("links");
            (0, vitest_1.expect)(result.interactive).toHaveProperty("inputs");
            (0, vitest_1.expect)(result.interactive).toHaveProperty("forms");
        });
        (0, vitest_1.it)("should handle title retrieval errors", async () => {
            mockPage.locator.mockImplementation(() => ({
                count: vitest_1.vi.fn().mockResolvedValue(5),
            }));
            mockPage.title.mockRejectedValue(new Error("Title retrieval failed"));
            const result = await analysisService.analyzePageStructure();
            (0, vitest_1.expect)(result.title).toBe("Unknown");
            (0, vitest_1.expect)(result.layout.headers).toBe(5);
            (0, vitest_1.expect)(result.interactive.buttons).toBe(5);
        });
    });
    (0, vitest_1.describe)("analyzeAccessibility", () => {
        (0, vitest_1.it)("should analyze accessibility with high scores", async () => {
            mockPage.locator.mockImplementation((selector) => {
                const counts = {
                    "[aria-label]": 15,
                    "[role]": 15,
                    "img[alt]": 10,
                    "[tabindex]": 5,
                };
                return {
                    count: vitest_1.vi.fn().mockResolvedValue(counts[selector] || 0),
                };
            });
            const result = await analysisService.analyzeAccessibility();
            (0, vitest_1.expect)(result).toMatchObject({
                ariaLabels: 15,
                ariaRoles: 15,
                altTexts: 10,
                tabindexElements: 5,
                score: 100, // Max score with these values
            });
        });
        (0, vitest_1.it)("should analyze accessibility with medium scores", async () => {
            mockPage.locator.mockImplementation((selector) => {
                const counts = {
                    "[aria-label]": 7,
                    "[role]": 7,
                    "img[alt]": 3,
                    "[tabindex]": 2,
                };
                return {
                    count: vitest_1.vi.fn().mockResolvedValue(counts[selector] || 0),
                };
            });
            const result = await analysisService.analyzeAccessibility();
            (0, vitest_1.expect)(result).toMatchObject({
                ariaLabels: 7,
                ariaRoles: 7,
                altTexts: 3,
                tabindexElements: 2,
                score: 80, // Base 50 + 10 + 10 + 10
            });
        });
        (0, vitest_1.it)("should analyze accessibility with low scores", async () => {
            mockPage.locator.mockImplementation((selector) => {
                const counts = {
                    "[aria-label]": 2,
                    "[role]": 2,
                    "img[alt]": 0,
                    "[tabindex]": 0,
                };
                return {
                    count: vitest_1.vi.fn().mockResolvedValue(counts[selector] || 0),
                };
            });
            const result = await analysisService.analyzeAccessibility();
            (0, vitest_1.expect)(result).toMatchObject({
                ariaLabels: 2,
                ariaRoles: 2,
                altTexts: 0,
                tabindexElements: 0,
                score: 60, // Base 50 + 5 + 5 + 0
            });
        });
        (0, vitest_1.it)("should analyze accessibility with zero elements", async () => {
            mockPage.locator.mockImplementation(() => ({
                count: vitest_1.vi.fn().mockResolvedValue(0),
            }));
            const result = await analysisService.analyzeAccessibility();
            (0, vitest_1.expect)(result).toMatchObject({
                ariaLabels: 0,
                ariaRoles: 0,
                altTexts: 0,
                tabindexElements: 0,
                score: 50, // Base score only
            });
        });
    });
    (0, vitest_1.describe)("error handling", () => {
        (0, vitest_1.it)("should handle locator errors gracefully", async () => {
            mockPage.locator.mockImplementation(() => {
                throw new Error("Locator failed");
            });
            await (0, vitest_1.expect)(analysisService.analyzePageStructure()).rejects.toThrow("Locator failed");
        });
        (0, vitest_1.it)("should handle count method failures", async () => {
            mockPage.locator.mockImplementation(() => ({
                count: vitest_1.vi.fn().mockRejectedValue(new Error("Count failed")),
            }));
            await (0, vitest_1.expect)(analysisService.analyzePageStructure()).rejects.toThrow("Count failed");
        });
    });
});
//# sourceMappingURL=AnalysisService.test.js.map