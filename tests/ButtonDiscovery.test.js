"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ButtonDiscovery_1 = require("../src/ButtonDiscovery");
const playwright_mock_1 = require("./mocks/playwright.mock");
(0, vitest_1.describe)("ButtonDiscovery", () => {
    let mockPage;
    let buttonDiscovery;
    (0, vitest_1.beforeEach)(() => {
        mockPage = (0, playwright_mock_1.createMockPage)();
        buttonDiscovery = new ButtonDiscovery_1.ButtonDiscovery(mockPage);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("discoverButtons", () => {
        (0, vitest_1.it)("should discover button elements and return DiscoveredFeature array", async () => {
            // Create mock button element
            const mockButton = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Click Me"),
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "type")
                        return "button";
                    if (attr === "id")
                        return "btn-1";
                    if (attr === "class")
                        return "primary-btn";
                    if (attr === "title")
                        return null;
                    if (attr === "aria-label")
                        return null;
                    return null;
                }),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
                toString: vitest_1.vi.fn().mockReturnValue("button#btn-1"),
            });
            // Mock page.locator to return elements for button selector
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "button") {
                    return {
                        all: vitest_1.vi.fn().mockResolvedValue([mockButton]),
                    };
                }
                // Return empty array for all other selectors
                return {
                    all: vitest_1.vi.fn().mockResolvedValue([]),
                };
            });
            const result = await buttonDiscovery.discoverButtons();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0]).toMatchObject({
                name: "Click Me",
                type: "button",
                selector: "#btn-1",
                text: "Click Me",
            });
        });
        (0, vitest_1.it)("should skip invisible buttons", async () => {
            const visibleButton = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Visible"),
                getAttribute: vitest_1.vi.fn().mockReturnValue(null),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
                toString: vitest_1.vi.fn().mockReturnValue("button.visible"),
            });
            const invisibleButton = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Hidden"),
                getAttribute: vitest_1.vi.fn().mockReturnValue(null),
                isVisible: vitest_1.vi.fn().mockResolvedValue(false),
                toString: vitest_1.vi.fn().mockReturnValue("button.hidden"),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "button") {
                    return {
                        all: vitest_1.vi.fn().mockResolvedValue([visibleButton, invisibleButton]),
                    };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const result = await buttonDiscovery.discoverButtons();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].name).toBe("Visible");
        });
        (0, vitest_1.it)("should handle buttons without text using aria-label", async () => {
            const iconButton = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue(""),
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "aria-label")
                        return "Search";
                    if (attr === "title")
                        return "Search for items";
                    return null;
                }),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
                toString: vitest_1.vi.fn().mockReturnValue("button.icon"),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "button") {
                    return {
                        all: vitest_1.vi.fn().mockResolvedValue([iconButton]),
                    };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const result = await buttonDiscovery.discoverButtons();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].name).toBe("Search for items"); // title takes precedence over aria-label in naming
        });
        (0, vitest_1.it)("should discover elements with role=button", async () => {
            const roleButton = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Custom Button"),
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "role")
                        return "button";
                    return null;
                }),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
                evaluate: vitest_1.vi.fn().mockResolvedValue("DIV"),
                toString: vitest_1.vi.fn().mockReturnValue("div[role=button]"),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === '[role="button"]') {
                    return {
                        all: vitest_1.vi.fn().mockResolvedValue([roleButton]),
                    };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const result = await buttonDiscovery.discoverButtons();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].name).toBe("Custom Button");
            (0, vitest_1.expect)(result[0].selector).toBe("div[role=button]");
        });
        (0, vitest_1.it)("should identify disabled buttons", async () => {
            const disabledButton = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Disabled"),
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "disabled")
                        return "true";
                    return null;
                }),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(false),
                toString: vitest_1.vi.fn().mockReturnValue("button:disabled"),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "button") {
                    return {
                        all: vitest_1.vi.fn().mockResolvedValue([disabledButton]),
                    };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const result = await buttonDiscovery.discoverButtons();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].name).toBe("Disabled");
            (0, vitest_1.expect)(result[0].type).toBe("button");
        });
        (0, vitest_1.it)("should avoid duplicate buttons with same selector", async () => {
            const button1 = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Click"),
                getAttribute: vitest_1.vi.fn().mockReturnValue(null),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
                toString: vitest_1.vi.fn().mockReturnValue("button.same"),
            });
            const button2 = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Click Again"),
                getAttribute: vitest_1.vi.fn().mockReturnValue(null),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
                toString: vitest_1.vi.fn().mockReturnValue("button.same"), // Same selector
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "button") {
                    return {
                        all: vitest_1.vi.fn().mockResolvedValue([button1, button2]),
                    };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const result = await buttonDiscovery.discoverButtons();
            // Should only have one button since they have the same selector
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].name).toBe("Click"); // First one wins
        });
        (0, vitest_1.it)("should handle empty page with no buttons", async () => {
            mockPage.locator.mockImplementation(() => ({
                all: vitest_1.vi.fn().mockResolvedValue([]),
            }));
            const result = await buttonDiscovery.discoverButtons();
            (0, vitest_1.expect)(result).toEqual([]);
        });
        (0, vitest_1.it)("should handle errors gracefully", async () => {
            // ButtonDiscovery doesn't have error handling in discoverButtons
            // so errors will propagate. This is testing the actual behavior.
            mockPage.locator.mockImplementation(() => {
                throw new Error("Page error");
            });
            await (0, vitest_1.expect)(buttonDiscovery.discoverButtons()).rejects.toThrow("Page error");
        });
    });
    (0, vitest_1.describe)("discoverTooltips", () => {
        (0, vitest_1.it)("should discover tooltips for visible buttons", async () => {
            const mockButtons = [
                {
                    type: "button",
                    name: "Button 1",
                    selector: "#btn1",
                    actions: ["click"],
                    attributes: { id: "btn1" },
                },
                {
                    type: "button",
                    name: "Button 2",
                    selector: "#btn2",
                    actions: ["click"],
                    attributes: { id: "btn2" },
                },
            ];
            const mockButtonLocator = {
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                hover: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            const mockTooltipLocator = {
                first: vitest_1.vi.fn().mockReturnThis(),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                textContent: vitest_1.vi.fn().mockResolvedValue("This is a tooltip"),
            };
            mockPage.locator.mockImplementation((selector) => {
                if (selector.startsWith("#btn")) {
                    return mockButtonLocator;
                }
                if (selector.includes("tooltip")) {
                    return mockTooltipLocator;
                }
                return { isVisible: vitest_1.vi.fn().mockResolvedValue(false) };
            });
            await buttonDiscovery.discoverTooltips(mockButtons);
            (0, vitest_1.expect)(mockButtonLocator.hover).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(mockButtons[0].attributes?.tooltip).toBe("This is a tooltip");
            (0, vitest_1.expect)(mockButtons[1].attributes?.tooltip).toBe("This is a tooltip");
        });
        (0, vitest_1.it)("should handle invisible buttons", async () => {
            const mockButtons = [
                {
                    type: "button",
                    name: "Hidden Button",
                    selector: "#hidden",
                    actions: ["click"],
                    attributes: {},
                },
            ];
            const mockButtonLocator = {
                isVisible: vitest_1.vi.fn().mockResolvedValue(false),
                hover: vitest_1.vi.fn(),
            };
            mockPage.locator.mockImplementation(() => mockButtonLocator);
            await buttonDiscovery.discoverTooltips(mockButtons);
            (0, vitest_1.expect)(mockButtonLocator.hover).not.toHaveBeenCalled();
            (0, vitest_1.expect)(mockButtons[0].attributes?.tooltip).toBeUndefined();
        });
        (0, vitest_1.it)("should handle no visible tooltips", async () => {
            const mockButtons = [
                {
                    type: "button",
                    name: "Button",
                    selector: "#btn",
                    actions: ["click"],
                    attributes: {},
                },
            ];
            const mockButtonLocator = {
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                hover: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            const mockTooltipLocator = {
                first: vitest_1.vi.fn().mockReturnThis(),
                isVisible: vitest_1.vi.fn().mockResolvedValue(false),
            };
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "#btn") {
                    return mockButtonLocator;
                }
                return mockTooltipLocator;
            });
            await buttonDiscovery.discoverTooltips(mockButtons);
            (0, vitest_1.expect)(mockButtonLocator.hover).toHaveBeenCalled();
            (0, vitest_1.expect)(mockButtons[0].attributes?.tooltip).toBeUndefined();
        });
        (0, vitest_1.it)("should limit processing to first 10 buttons", async () => {
            const mockButtons = Array.from({ length: 15 }, (_, i) => ({
                type: "button",
                name: `Button ${i}`,
                selector: `#btn${i}`,
                actions: ["click"],
                attributes: {},
            }));
            const mockButtonLocator = {
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                hover: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            const _mockTooltipLocator = {
                first: vitest_1.vi.fn().mockReturnThis(),
                isVisible: vitest_1.vi.fn().mockResolvedValue(false),
            };
            mockPage.locator.mockImplementation(() => mockButtonLocator);
            await buttonDiscovery.discoverTooltips(mockButtons);
            // Should only process first 10 buttons
            (0, vitest_1.expect)(mockButtonLocator.hover).toHaveBeenCalledTimes(10);
        });
        (0, vitest_1.it)("should handle errors gracefully", async () => {
            const mockButtons = [
                {
                    type: "button",
                    name: "Error Button",
                    selector: "#error",
                    actions: ["click"],
                    attributes: {},
                },
                {
                    type: "button",
                    name: "Good Button",
                    selector: "#good",
                    actions: ["click"],
                    attributes: {},
                },
            ];
            const _callCount = 0;
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "#error") {
                    throw new Error("Locator error");
                }
                if (selector === "#good") {
                    return {
                        isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                        hover: vitest_1.vi.fn().mockResolvedValue(undefined),
                    };
                }
                return {
                    first: vitest_1.vi.fn().mockReturnThis(),
                    isVisible: vitest_1.vi.fn().mockResolvedValue(false),
                };
            });
            // Should not throw, just continue with other buttons
            await buttonDiscovery.discoverTooltips(mockButtons);
            (0, vitest_1.expect)(mockButtons[0].attributes?.tooltip).toBeUndefined();
        });
    });
});
//# sourceMappingURL=ButtonDiscovery.test.js.map