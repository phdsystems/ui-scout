"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const NavigationDiscovery_1 = require("../src/NavigationDiscovery");
const playwright_mock_1 = require("./mocks/playwright.mock");
(0, vitest_1.describe)("NavigationDiscovery", () => {
    let mockPage;
    let navigationDiscovery;
    (0, vitest_1.beforeEach)(() => {
        mockPage = (0, playwright_mock_1.createMockPage)();
        navigationDiscovery = new NavigationDiscovery_1.NavigationDiscovery(mockPage);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("discoverMenus", () => {
        (0, vitest_1.it)("should discover navigation menus", async () => {
            const mockMenu = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Main Navigation"),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                locator: vitest_1.vi.fn().mockImplementation((selector) => {
                    if (selector === "li") {
                        const mockItem1 = (0, playwright_mock_1.createMockLocator)({
                            textContent: vitest_1.vi.fn().mockResolvedValue("Home"),
                            getAttribute: vitest_1.vi.fn().mockResolvedValue("/home"),
                        });
                        const mockItem2 = (0, playwright_mock_1.createMockLocator)({
                            textContent: vitest_1.vi.fn().mockResolvedValue("About"),
                            getAttribute: vitest_1.vi.fn().mockResolvedValue("/about"),
                        });
                        return { all: vitest_1.vi.fn().mockResolvedValue([mockItem1, mockItem2]) };
                    }
                    return { all: vitest_1.vi.fn().mockResolvedValue([]) };
                }),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "nav") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockMenu]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            // Mock SelectorUtils
            navigationDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("nav.main"),
            };
            const result = await navigationDiscovery.discoverMenus();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0]).toMatchObject({
                name: "Main Navigation",
                type: "menu",
                selector: "nav.main",
                text: "Main Navigation",
                actions: ["click", "hover"],
            });
            (0, vitest_1.expect)(result[0].children).toHaveLength(2);
        });
        (0, vitest_1.it)("should handle empty menu lists", async () => {
            mockPage.locator.mockImplementation(() => ({
                all: vitest_1.vi.fn().mockResolvedValue([]),
            }));
            const result = await navigationDiscovery.discoverMenus();
            (0, vitest_1.expect)(result).toEqual([]);
        });
        (0, vitest_1.it)("should skip hidden menus", async () => {
            const mockMenu = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Hidden Menu"),
                isVisible: vitest_1.vi.fn().mockResolvedValue(false),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "nav") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockMenu]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const result = await navigationDiscovery.discoverMenus();
            (0, vitest_1.expect)(result).toEqual([]);
        });
        (0, vitest_1.it)("should handle duplicate selectors", async () => {
            const mockMenu1 = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Menu 1"),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                locator: vitest_1.vi.fn().mockReturnValue({ all: vitest_1.vi.fn().mockResolvedValue([]) }),
            });
            const mockMenu2 = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Menu 2"),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                locator: vitest_1.vi.fn().mockReturnValue({ all: vitest_1.vi.fn().mockResolvedValue([]) }),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "nav") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockMenu1, mockMenu2]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            // Mock SelectorUtils to return same selector for duplicates
            navigationDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("nav.duplicate"),
            };
            const result = await navigationDiscovery.discoverMenus();
            // Should only include first menu due to duplicate selector filtering
            (0, vitest_1.expect)(result).toHaveLength(1);
        });
    });
    (0, vitest_1.describe)("discoverDropdowns", () => {
        (0, vitest_1.it)("should discover dropdown menus", async () => {
            const mockDropdown = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                locator: vitest_1.vi.fn().mockImplementation((selector) => {
                    if (selector.includes("option")) {
                        return {
                            allTextContents: vitest_1.vi.fn().mockResolvedValue(["Option 1", "Option 2", "Option 3"]),
                        };
                    }
                    return { allTextContents: vitest_1.vi.fn().mockResolvedValue([]) };
                }),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "select") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockDropdown]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            // Mock SelectorUtils
            navigationDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("select#country"),
                findLabelForInput: vitest_1.vi.fn().mockResolvedValue("Select Country"),
            };
            const result = await navigationDiscovery.discoverDropdowns();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0]).toMatchObject({
                name: "Select Country",
                type: "dropdown",
                selector: "select#country",
                attributes: {
                    options: "Option 1, Option 2, Option 3",
                },
                actions: ["select", "click"],
            });
        });
        (0, vitest_1.it)("should handle dropdowns without labels", async () => {
            const mockDropdown = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                locator: vitest_1.vi.fn().mockReturnValue({ allTextContents: vitest_1.vi.fn().mockResolvedValue([]) }),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "select") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockDropdown]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            // Mock SelectorUtils
            navigationDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("select.unlabeled"),
                findLabelForInput: vitest_1.vi.fn().mockResolvedValue(""),
            };
            const result = await navigationDiscovery.discoverDropdowns();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].name).toBe("Dropdown");
        });
        (0, vitest_1.it)("should handle empty dropdown lists", async () => {
            mockPage.locator.mockImplementation(() => ({
                all: vitest_1.vi.fn().mockResolvedValue([]),
            }));
            const result = await navigationDiscovery.discoverDropdowns();
            (0, vitest_1.expect)(result).toEqual([]);
        });
    });
    (0, vitest_1.describe)("discoverTabs", () => {
        (0, vitest_1.it)("should discover tab navigation", async () => {
            const mockTabs = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                locator: vitest_1.vi.fn().mockImplementation((selector) => {
                    if (selector.includes("tab") || selector.includes("li") || selector.includes("a")) {
                        return { allTextContents: vitest_1.vi.fn().mockResolvedValue(["Tab 1", "Tab 2", "Tab 3"]) };
                    }
                    return { allTextContents: vitest_1.vi.fn().mockResolvedValue([]) };
                }),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === '[role="tablist"]') {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockTabs]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            // Mock SelectorUtils
            navigationDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue('[role="tablist"]'),
            };
            const result = await navigationDiscovery.discoverTabs();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0]).toMatchObject({
                name: "Tab Navigation",
                type: "tab",
                selector: '[role="tablist"]',
                attributes: {
                    tabs: "Tab 1, Tab 2, Tab 3",
                },
                actions: ["click"],
            });
        });
        (0, vitest_1.it)("should handle empty tab lists", async () => {
            mockPage.locator.mockImplementation(() => ({
                all: vitest_1.vi.fn().mockResolvedValue([]),
            }));
            const result = await navigationDiscovery.discoverTabs();
            (0, vitest_1.expect)(result).toEqual([]);
        });
        (0, vitest_1.it)("should skip hidden tabs", async () => {
            const mockTabs = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(false),
                locator: vitest_1.vi.fn().mockReturnValue({ allTextContents: vitest_1.vi.fn().mockResolvedValue([]) }),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === '[role="tablist"]') {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockTabs]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const result = await navigationDiscovery.discoverTabs();
            (0, vitest_1.expect)(result).toEqual([]);
        });
    });
    (0, vitest_1.describe)("error handling", () => {
        (0, vitest_1.it)("should handle menu discovery errors gracefully", async () => {
            mockPage.locator.mockImplementation(() => {
                throw new Error("Menu locator error");
            });
            await (0, vitest_1.expect)(navigationDiscovery.discoverMenus()).rejects.toThrow("Menu locator error");
        });
        (0, vitest_1.it)("should handle dropdown discovery errors gracefully", async () => {
            mockPage.locator.mockImplementation(() => {
                throw new Error("Dropdown locator error");
            });
            await (0, vitest_1.expect)(navigationDiscovery.discoverDropdowns()).rejects.toThrow("Dropdown locator error");
        });
        (0, vitest_1.it)("should handle tab discovery errors gracefully", async () => {
            mockPage.locator.mockImplementation(() => {
                throw new Error("Tab locator error");
            });
            await (0, vitest_1.expect)(navigationDiscovery.discoverTabs()).rejects.toThrow("Tab locator error");
        });
        (0, vitest_1.it)("should handle malformed menu elements", async () => {
            const mockMenu = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockRejectedValue(new Error("Text content error")),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "nav") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockMenu]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const result = await navigationDiscovery.discoverMenus();
            // Should skip elements with errors
            (0, vitest_1.expect)(result).toEqual([]);
        });
        (0, vitest_1.it)("should handle malformed dropdown elements", async () => {
            const mockDropdown = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                locator: vitest_1.vi.fn().mockImplementation(() => {
                    throw new Error("Options error");
                }),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "select") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockDropdown]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const result = await navigationDiscovery.discoverDropdowns();
            // Should skip elements with errors
            (0, vitest_1.expect)(result).toEqual([]);
        });
        (0, vitest_1.it)("should handle malformed tab elements", async () => {
            const mockTabs = (0, playwright_mock_1.createMockLocator)({
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                locator: vitest_1.vi.fn().mockImplementation(() => {
                    throw new Error("Tab content error");
                }),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === '[role="tablist"]') {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockTabs]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const result = await navigationDiscovery.discoverTabs();
            // Should skip elements with errors
            (0, vitest_1.expect)(result).toEqual([]);
        });
    });
    (0, vitest_1.describe)("menu items discovery", () => {
        (0, vitest_1.it)("should discover menu items within menus", async () => {
            const mockMenuItem1 = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Home"),
                getAttribute: vitest_1.vi.fn().mockResolvedValue("/home"),
            });
            const mockMenuItem2 = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("About"),
                getAttribute: vitest_1.vi.fn().mockResolvedValue("/about"),
            });
            const mockMenu = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Navigation Menu"),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                locator: vitest_1.vi.fn().mockImplementation((selector) => {
                    if (selector === "li") {
                        return { all: vitest_1.vi.fn().mockResolvedValue([mockMenuItem1, mockMenuItem2]) };
                    }
                    return { all: vitest_1.vi.fn().mockResolvedValue([]) };
                }),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "nav") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockMenu]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            // Mock SelectorUtils
            navigationDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi
                    .fn()
                    .mockResolvedValueOnce("nav.menu")
                    .mockResolvedValueOnce("nav.menu li:nth-child(1)")
                    .mockResolvedValueOnce("nav.menu li:nth-child(2)"),
            };
            const result = await navigationDiscovery.discoverMenus();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].children).toHaveLength(2);
            (0, vitest_1.expect)(result[0].children?.[0]).toMatchObject({
                name: "Home",
                type: "other",
                text: "Home",
                attributes: { href: "/home" },
                actions: ["click"],
            });
            (0, vitest_1.expect)(result[0].children?.[1]).toMatchObject({
                name: "About",
                type: "other",
                text: "About",
                attributes: { href: "/about" },
                actions: ["click"],
            });
        });
        (0, vitest_1.it)("should handle menu items without text content", async () => {
            const mockMenuItem = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue(""),
                getAttribute: vitest_1.vi.fn().mockResolvedValue("/icon-link"),
            });
            const mockMenu = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Icon Menu"),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                locator: vitest_1.vi.fn().mockImplementation((selector) => {
                    if (selector === "a") {
                        return { all: vitest_1.vi.fn().mockResolvedValue([mockMenuItem]) };
                    }
                    return { all: vitest_1.vi.fn().mockResolvedValue([]) };
                }),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "nav") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockMenu]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            // Mock SelectorUtils
            navigationDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi
                    .fn()
                    .mockResolvedValueOnce("nav.icon-menu")
                    .mockResolvedValueOnce("nav.icon-menu a"),
            };
            const result = await navigationDiscovery.discoverMenus();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].children).toHaveLength(1);
            (0, vitest_1.expect)(result[0].children?.[0]?.name).toBe("Menu Item");
        });
    });
});
//# sourceMappingURL=NavigationDiscovery.test.js.map