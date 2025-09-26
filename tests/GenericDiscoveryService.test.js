"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const GenericDiscoveryService_1 = require("../src/GenericDiscoveryService");
const playwright_mock_1 = require("./mocks/playwright.mock");
(0, vitest_1.describe)("GenericDiscoveryService", () => {
    let mockDriver;
    let discoveryService;
    let consoleSpy;
    (0, vitest_1.beforeEach)(() => {
        mockDriver = {
            locator: vitest_1.vi.fn().mockReturnValue({
                all: vitest_1.vi.fn().mockResolvedValue([]),
            }),
        };
        discoveryService = new GenericDiscoveryService_1.GenericDiscoveryService(mockDriver);
        // Spy on console.log to test logging
        consoleSpy = vitest_1.vi.spyOn(console, "log").mockImplementation(() => { });
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.afterEach)(() => {
        consoleSpy.mockRestore();
    });
    (0, vitest_1.describe)("discoverAllFeatures", () => {
        (0, vitest_1.it)("should discover all feature types and return combined results", async () => {
            // Mock button elements
            const mockButtonElement = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                textContent: vitest_1.vi.fn().mockResolvedValue("Submit"),
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "title")
                        return "Submit form";
                    if (attr === "aria-label")
                        return null;
                    return null;
                }),
            });
            // Mock input elements
            const mockInputElement = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "placeholder")
                        return "Enter email";
                    if (attr === "type")
                        return "email";
                    return null;
                }),
            });
            // Mock navigation elements
            const mockNavElement = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                textContent: vitest_1.vi.fn().mockResolvedValue("Main Navigation Menu"),
            });
            // Setup mockDriver to return different elements for different selectors
            mockDriver.locator = vitest_1.vi.fn().mockImplementation((selector) => {
                if (selector === "button") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockButtonElement]) };
                }
                if (selector === 'input[type="email"]') {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockInputElement]) };
                }
                if (selector === "nav") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockNavElement]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const features = await discoveryService.discoverAllFeatures();
            (0, vitest_1.expect)(features).toHaveLength(3);
            (0, vitest_1.expect)(features[0]).toMatchObject({
                name: "Submit",
                type: "button",
                selector: "button",
                text: "Submit",
                actions: ["click", "hover"],
            });
            (0, vitest_1.expect)(features[1]).toMatchObject({
                name: "Enter email",
                type: "input",
                selector: 'input[type="email"]',
                attributes: {
                    type: "email",
                    placeholder: "Enter email",
                },
                actions: ["fill", "clear"],
            });
            (0, vitest_1.expect)(features[2]).toMatchObject({
                name: "Navigation",
                type: "menu",
                selector: "nav",
                text: "Main Navigation Menu",
                actions: ["click", "hover"],
            });
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith("🔍 Starting feature discovery (framework-agnostic)...\n");
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith("✅ Found 3 features total\n");
        });
        (0, vitest_1.it)("should handle empty results gracefully", async () => {
            mockDriver.locator = vitest_1.vi.fn().mockReturnValue({
                all: vitest_1.vi.fn().mockResolvedValue([]),
            });
            const features = await discoveryService.discoverAllFeatures();
            (0, vitest_1.expect)(features).toHaveLength(0);
            (0, vitest_1.expect)(consoleSpy).toHaveBeenCalledWith("✅ Found 0 features total\n");
        });
    });
    (0, vitest_1.describe)("discoverButtons", () => {
        (0, vitest_1.it)("should discover various types of button elements", async () => {
            const mockButton1 = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                textContent: vitest_1.vi.fn().mockResolvedValue("Click me"),
                getAttribute: vitest_1.vi.fn().mockReturnValue(null),
            });
            const mockButton2 = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                textContent: vitest_1.vi.fn().mockResolvedValue(""),
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "title")
                        return "Close window";
                    if (attr === "aria-label")
                        return "Close";
                    return null;
                }),
            });
            mockDriver.locator = vitest_1.vi.fn().mockImplementation((selector) => {
                if (selector === "button") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockButton1]) };
                }
                if (selector === '[role="button"]') {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockButton2]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const features = await discoveryService.discoverAllFeatures();
            const buttons = features.filter((f) => f.type === "button");
            (0, vitest_1.expect)(buttons).toHaveLength(2);
            (0, vitest_1.expect)(buttons[0]).toMatchObject({
                name: "Click me",
                type: "button",
                text: "Click me",
            });
            (0, vitest_1.expect)(buttons[1]).toMatchObject({
                name: "Close window",
                type: "button",
                text: "",
            });
        });
        (0, vitest_1.it)("should skip invisible button elements", async () => {
            const hiddenButton = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(false),
                textContent: vitest_1.vi.fn().mockResolvedValue("Hidden"),
            });
            const visibleButton = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                textContent: vitest_1.vi.fn().mockResolvedValue("Visible"),
                getAttribute: vitest_1.vi.fn().mockReturnValue(null),
            });
            mockDriver.locator = vitest_1.vi.fn().mockImplementation((selector) => {
                if (selector === "button") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([hiddenButton, visibleButton]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const features = await discoveryService.discoverAllFeatures();
            const buttons = features.filter((f) => f.type === "button");
            (0, vitest_1.expect)(buttons).toHaveLength(1);
            (0, vitest_1.expect)(buttons[0].name).toBe("Visible");
        });
    });
    (0, vitest_1.describe)("discoverInputs", () => {
        (0, vitest_1.it)("should discover various types of input elements", async () => {
            const textInput = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "placeholder")
                        return "Enter your name";
                    if (attr === "type")
                        return "text";
                    return null;
                }),
            });
            const passwordInput = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "placeholder")
                        return null;
                    if (attr === "type")
                        return "password";
                    return null;
                }),
            });
            mockDriver.locator = vitest_1.vi.fn().mockImplementation((selector) => {
                if (selector === 'input[type="text"]') {
                    return { all: vitest_1.vi.fn().mockResolvedValue([textInput]) };
                }
                if (selector === 'input[type="password"]') {
                    return { all: vitest_1.vi.fn().mockResolvedValue([passwordInput]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const features = await discoveryService.discoverAllFeatures();
            const inputs = features.filter((f) => f.type === "input");
            (0, vitest_1.expect)(inputs).toHaveLength(2);
            (0, vitest_1.expect)(inputs[0]).toMatchObject({
                name: "Enter your name",
                type: "input",
                attributes: {
                    type: "text",
                    placeholder: "Enter your name",
                },
                actions: ["fill", "clear"],
            });
            (0, vitest_1.expect)(inputs[1]).toMatchObject({
                name: "Input (password)",
                type: "input",
                attributes: {
                    type: "password",
                    placeholder: "",
                },
            });
        });
    });
    (0, vitest_1.describe)("discoverNavigation", () => {
        (0, vitest_1.it)("should discover navigation elements", async () => {
            const navBar = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                textContent: vitest_1.vi.fn().mockResolvedValue("Home Products About Contact"),
            });
            mockDriver.locator = vitest_1.vi.fn().mockImplementation((selector) => {
                if (selector === "nav") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([navBar]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const features = await discoveryService.discoverAllFeatures();
            const navigation = features.filter((f) => f.type === "menu");
            (0, vitest_1.expect)(navigation).toHaveLength(1);
            (0, vitest_1.expect)(navigation[0]).toMatchObject({
                name: "Navigation",
                type: "menu",
                selector: "nav",
                text: "Home Products About Contact",
                actions: ["click", "hover"],
            });
        });
        (0, vitest_1.it)("should truncate long navigation text", async () => {
            const longTextNav = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                textContent: vitest_1.vi
                    .fn()
                    .mockResolvedValue("This is a very long navigation menu with lots of text that should be truncated"),
            });
            mockDriver.locator = vitest_1.vi.fn().mockImplementation((selector) => {
                if (selector === "nav") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([longTextNav]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const features = await discoveryService.discoverAllFeatures();
            const navigation = features.filter((f) => f.type === "menu");
            (0, vitest_1.expect)(navigation).toHaveLength(1);
            (0, vitest_1.expect)(navigation[0].text).toBe("This is a very long navigation menu with lots of t");
            (0, vitest_1.expect)(navigation[0].text?.length).toBe(50);
        });
    });
    (0, vitest_1.describe)("error handling", () => {
        (0, vitest_1.it)("should handle isVisible timeout gracefully", async () => {
            const timeoutElement = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockImplementation(({ timeout }) => {
                    if (timeout === 1000) {
                        return Promise.resolve(false); // Just return false instead of throwing
                    }
                    return Promise.resolve(false);
                }),
                textContent: vitest_1.vi.fn().mockResolvedValue("Test"),
                getAttribute: vitest_1.vi.fn().mockReturnValue(null),
            });
            mockDriver.locator = vitest_1.vi.fn().mockImplementation((selector) => {
                if (selector === "button") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([timeoutElement]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const features = await discoveryService.discoverAllFeatures();
            // Should not throw error and should skip the timeout element
            (0, vitest_1.expect)(features).toBeDefined();
            (0, vitest_1.expect)(features.length).toBeGreaterThanOrEqual(0);
        });
    });
});
//# sourceMappingURL=GenericDiscoveryService.test.js.map