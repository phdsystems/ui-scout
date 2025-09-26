"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ComponentDiscovery_1 = require("../src/ComponentDiscovery");
const playwright_mock_1 = require("./mocks/playwright.mock");
(0, vitest_1.describe)("ComponentDiscovery", () => {
    let mockPage;
    let componentDiscovery;
    // Helper to create a mock locator with proper chaining support
    const createMockLocatorWithChaining = (elements = []) => {
        const mockLocatorChain = {
            first: vitest_1.vi.fn().mockReturnThis(),
            textContent: vitest_1.vi.fn().mockResolvedValue(""),
            catch: vitest_1.vi.fn().mockImplementation((_fn) => Promise.resolve("")),
        };
        return {
            all: vitest_1.vi.fn().mockResolvedValue(elements),
            locator: vitest_1.vi.fn().mockReturnValue(mockLocatorChain),
            first: vitest_1.vi.fn().mockReturnThis(),
            textContent: vitest_1.vi.fn().mockResolvedValue(""),
        };
    };
    (0, vitest_1.beforeEach)(() => {
        mockPage = (0, playwright_mock_1.createMockPage)();
        componentDiscovery = new ComponentDiscovery_1.ComponentDiscovery(mockPage);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("discoverModals", () => {
        (0, vitest_1.it)("should discover modal components", async () => {
            const mockModal = {
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "id")
                        return "login-modal";
                    if (attr === "class")
                        return "modal dialog";
                    return null;
                }),
                isVisible: () => Promise.resolve(true),
            };
            mockPage.locator.mockImplementation((selector) => {
                if (selector.includes("modal") || selector.includes("dialog")) {
                    return createMockLocatorWithChaining([mockModal]);
                }
                if (selector === "#login-modal") {
                    return createMockLocatorWithChaining();
                }
                return createMockLocatorWithChaining();
            });
            // Mock SelectorUtils
            componentDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("#login-modal"),
            };
            const result = await componentDiscovery.discoverModals();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0]).toMatchObject({
                name: "login-modal", // Uses ID as name when no text content
                type: "modal",
                attributes: {
                    id: "login-modal",
                    class: "modal dialog",
                },
                actions: ["screenshot", "close"],
            });
        });
        (0, vitest_1.it)("should handle empty modal lists", async () => {
            mockPage.locator.mockImplementation(() => createMockLocatorWithChaining());
            const result = await componentDiscovery.discoverModals();
            (0, vitest_1.expect)(result).toEqual([]);
        });
    });
    (0, vitest_1.describe)("discoverTables", () => {
        (0, vitest_1.it)("should discover table components", async () => {
            const mockTable = {
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "id")
                        return "data-table";
                    if (attr === "class")
                        return "table";
                    return null;
                }),
                isVisible: () => Promise.resolve(true),
            };
            mockPage.locator.mockImplementation((selector) => {
                if (selector.includes("table") || selector === "table") {
                    return createMockLocatorWithChaining([mockTable]);
                }
                return createMockLocatorWithChaining();
            });
            // Mock SelectorUtils
            componentDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("#data-table"),
            };
            const result = await componentDiscovery.discoverTables();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0]).toMatchObject({
                name: "data-table", // Uses ID as name
                type: "table",
                attributes: {
                    id: "data-table",
                    class: "table",
                },
                actions: ["screenshot", "hover"],
            });
        });
        (0, vitest_1.it)("should handle empty table lists", async () => {
            mockPage.locator.mockImplementation(() => createMockLocatorWithChaining());
            const result = await componentDiscovery.discoverTables();
            (0, vitest_1.expect)(result).toEqual([]);
        });
    });
    (0, vitest_1.describe)("discoverCharts", () => {
        (0, vitest_1.it)("should discover chart components", async () => {
            const mockChart = {
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "id")
                        return "price-chart";
                    if (attr === "class")
                        return "chart-container";
                    return null;
                }),
                isVisible: () => Promise.resolve(true),
            };
            mockPage.locator.mockImplementation((selector) => {
                if (selector.includes("chart") || selector === "canvas") {
                    return createMockLocatorWithChaining([mockChart]);
                }
                return createMockLocatorWithChaining();
            });
            // Mock SelectorUtils
            componentDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("#price-chart"),
            };
            const result = await componentDiscovery.discoverCharts();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0]).toMatchObject({
                name: "price-chart",
                type: "chart",
                attributes: {
                    id: "price-chart",
                    class: "chart-container",
                },
            });
        });
        (0, vitest_1.it)("should handle empty chart lists", async () => {
            mockPage.locator.mockImplementation(() => createMockLocatorWithChaining());
            const result = await componentDiscovery.discoverCharts();
            (0, vitest_1.expect)(result).toEqual([]);
        });
    });
    (0, vitest_1.describe)("discoverPanels", () => {
        (0, vitest_1.it)("should discover panel components", async () => {
            const mockPanel = {
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "id")
                        return "sidebar-panel";
                    if (attr === "class")
                        return "panel widget";
                    return null;
                }),
                isVisible: () => Promise.resolve(true),
            };
            mockPage.locator.mockImplementation((selector) => {
                if (selector.includes("panel") || selector.includes("widget") || selector === "aside") {
                    return createMockLocatorWithChaining([mockPanel]);
                }
                return createMockLocatorWithChaining();
            });
            // Mock SelectorUtils
            componentDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("#sidebar-panel"),
            };
            const result = await componentDiscovery.discoverPanels();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0]).toMatchObject({
                name: "sidebar-panel", // Uses ID as name when no heading found
                type: "panel",
                attributes: {
                    id: "sidebar-panel",
                    class: "panel widget",
                },
                actions: ["screenshot", "hover"],
            });
        });
        (0, vitest_1.it)("should handle empty panel lists", async () => {
            mockPage.locator.mockImplementation(() => createMockLocatorWithChaining());
            const result = await componentDiscovery.discoverPanels();
            (0, vitest_1.expect)(result).toEqual([]);
        });
    });
    (0, vitest_1.describe)("discoverCustomComponents", () => {
        (0, vitest_1.it)("should discover custom components", async () => {
            const mockCustom = {
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "data-testid")
                        return "user-profile-widget";
                    if (attr === "id")
                        return "profile-widget";
                    if (attr === "class")
                        return "widget component";
                    return null;
                }),
                isVisible: () => Promise.resolve(true),
            };
            mockPage.locator.mockImplementation((selector) => {
                if (selector.includes("testid") || selector.includes("component")) {
                    return createMockLocatorWithChaining([mockCustom]);
                }
                return createMockLocatorWithChaining();
            });
            // Mock SelectorUtils
            componentDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue('[data-testid="user-profile-widget"]'),
            };
            const result = await componentDiscovery.discoverCustomComponents();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0]).toMatchObject({
                name: "profile-widget", // Uses ID as name since testid not prioritized in enhancement
                type: "other",
                attributes: {
                    id: "profile-widget",
                    class: "widget component",
                },
                actions: ["screenshot", "hover"], // Default actions from analyzeComponent
            });
        });
        (0, vitest_1.it)("should handle empty custom component lists", async () => {
            mockPage.locator.mockImplementation(() => createMockLocatorWithChaining());
            const result = await componentDiscovery.discoverCustomComponents();
            (0, vitest_1.expect)(result).toEqual([]);
        });
    });
    (0, vitest_1.describe)("component filtering", () => {
        (0, vitest_1.it)("should filter out hidden components", async () => {
            const hiddenModal = {
                getAttribute: vitest_1.vi.fn().mockReturnValue("hidden-modal"),
                isVisible: () => Promise.resolve(false),
            };
            const visibleModal = {
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "id")
                        return "visible-modal";
                    if (attr === "class")
                        return "modal dialog";
                    return null;
                }),
                isVisible: () => Promise.resolve(true),
                locator: vitest_1.vi.fn().mockReturnValue({
                    first: vitest_1.vi.fn().mockReturnValue({
                        textContent: vitest_1.vi.fn().mockResolvedValue(""),
                    }),
                }),
            };
            mockPage.locator.mockImplementation(() => createMockLocatorWithChaining([hiddenModal, visibleModal]));
            // Mock SelectorUtils
            componentDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("#visible-modal"),
            };
            const result = await componentDiscovery.discoverModals();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].name).toBe("visible-modal"); // Uses ID as name
        });
        (0, vitest_1.it)("should handle duplicate selectors", async () => {
            const firstComponent = {
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "id")
                        return "duplicate-id";
                    if (attr === "class")
                        return "chart";
                    return null;
                }),
                isVisible: () => Promise.resolve(true),
            };
            const duplicateComponent = {
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "id")
                        return "duplicate-id";
                    if (attr === "class")
                        return "chart";
                    return null;
                }),
                isVisible: () => Promise.resolve(true),
            };
            mockPage.locator.mockImplementation(() => createMockLocatorWithChaining([firstComponent, duplicateComponent]));
            // Mock SelectorUtils to return the same selector for duplicates
            componentDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("#duplicate-id"),
            };
            const result = await componentDiscovery.discoverCharts();
            // Should only include the first component, not the duplicate
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].name).toBe("duplicate-id");
        });
    });
    (0, vitest_1.describe)("error handling", () => {
        (0, vitest_1.it)("should handle component analysis errors gracefully", async () => {
            const errorComponent = {
                getAttribute: vitest_1.vi.fn().mockRejectedValue(new Error("getAttribute failed")),
                isVisible: () => Promise.resolve(true),
            };
            mockPage.locator.mockImplementation(() => createMockLocatorWithChaining([errorComponent]));
            const result = await componentDiscovery.discoverCharts();
            // Should skip components that fail analysis
            (0, vitest_1.expect)(result).toEqual([]);
        });
        (0, vitest_1.it)("should handle selector generation errors", async () => {
            const mockComponent = {
                getAttribute: vitest_1.vi.fn().mockResolvedValue("test-id"),
                isVisible: () => Promise.resolve(true),
            };
            mockPage.locator.mockImplementation(() => createMockLocatorWithChaining([mockComponent]));
            // Mock SelectorUtils to throw error
            componentDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockRejectedValue(new Error("Selector generation failed")),
            };
            const result = await componentDiscovery.discoverPanels();
            // Should skip components where selector generation fails
            (0, vitest_1.expect)(result).toEqual([]);
        });
        (0, vitest_1.it)("should handle locator creation errors", async () => {
            mockPage.locator.mockImplementation(() => {
                throw new Error("Locator creation failed");
            });
            await (0, vitest_1.expect)(componentDiscovery.discoverModals()).rejects.toThrow("Locator creation failed");
        });
    });
    (0, vitest_1.describe)("enhancement features", () => {
        (0, vitest_1.it)("should enhance tables with structure information", async () => {
            const mockTable = {
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "id")
                        return "enhanced-table";
                    if (attr === "class")
                        return "data-table";
                    return null;
                }),
                isVisible: () => Promise.resolve(true),
                locator: vitest_1.vi.fn().mockImplementation((selector) => {
                    if (selector.includes("columnheader") || selector.includes("th")) {
                        return {
                            allTextContents: vitest_1.vi.fn().mockResolvedValue(["ID", "Name", "Email", "Status"]),
                        };
                    }
                    if (selector.includes("row") || selector.includes("tr")) {
                        return {
                            count: vitest_1.vi.fn().mockResolvedValue(10),
                        };
                    }
                    return {
                        allTextContents: vitest_1.vi.fn().mockResolvedValue([]),
                        count: vitest_1.vi.fn().mockResolvedValue(0),
                    };
                }),
            };
            // Mock page locator to return an enhanced locator with table methods
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "#enhanced-table") {
                    // Return a locator that has methods for table enhancement
                    return {
                        locator: vitest_1.vi.fn().mockImplementation((innerSelector) => {
                            if (innerSelector.includes("columnheader") || innerSelector.includes("th")) {
                                return {
                                    allTextContents: vitest_1.vi.fn().mockResolvedValue(["ID", "Name", "Email", "Status"]),
                                };
                            }
                            if (innerSelector.includes("row") || innerSelector.includes("tr")) {
                                return {
                                    count: vitest_1.vi.fn().mockResolvedValue(10),
                                };
                            }
                            return {
                                allTextContents: vitest_1.vi.fn().mockResolvedValue([]),
                                count: vitest_1.vi.fn().mockResolvedValue(0),
                            };
                        }),
                    };
                }
                return createMockLocatorWithChaining([mockTable]);
            });
            componentDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("#enhanced-table"),
            };
            const result = await componentDiscovery.discoverTables();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].name).toBe("ID, Name, Email, Status");
            (0, vitest_1.expect)(result[0].attributes?.headers).toBe("ID, Name, Email, Status");
            (0, vitest_1.expect)(result[0].attributes?.rows).toBe("10");
        });
        (0, vitest_1.it)("should enhance modals with heading information", async () => {
            const mockModal = {
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "id")
                        return "settings-modal";
                    if (attr === "class")
                        return "modal";
                    return null;
                }),
                isVisible: () => Promise.resolve(true),
                locator: vitest_1.vi.fn().mockReturnValue({
                    first: vitest_1.vi.fn().mockReturnValue({
                        textContent: vitest_1.vi.fn().mockResolvedValue("Settings Configuration"),
                    }),
                }),
            };
            // Mock page locator to return enhanced modal with heading
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "#settings-modal") {
                    return {
                        locator: vitest_1.vi.fn().mockReturnValue({
                            first: vitest_1.vi.fn().mockReturnValue({
                                textContent: vitest_1.vi.fn().mockResolvedValue("Settings Configuration"),
                                catch: vitest_1.vi.fn().mockImplementation((_fn) => Promise.resolve("")),
                            }),
                        }),
                    };
                }
                return createMockLocatorWithChaining([mockModal]);
            });
            componentDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("#settings-modal"),
            };
            const result = await componentDiscovery.discoverModals();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].name).toBe("Settings Configuration");
            (0, vitest_1.expect)(result[0].text).toBe("Settings Configuration");
        });
        (0, vitest_1.it)("should enhance panels with heading information", async () => {
            const mockPanel = {
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "id")
                        return "info-panel";
                    if (attr === "class")
                        return "panel";
                    return null;
                }),
                isVisible: () => Promise.resolve(true),
                locator: vitest_1.vi.fn().mockReturnValue({
                    first: vitest_1.vi.fn().mockReturnValue({
                        textContent: vitest_1.vi.fn().mockResolvedValue("User Information"),
                    }),
                }),
            };
            // Mock page locator to return enhanced panel with heading
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "#info-panel") {
                    return {
                        locator: vitest_1.vi.fn().mockReturnValue({
                            first: vitest_1.vi.fn().mockReturnValue({
                                textContent: vitest_1.vi.fn().mockResolvedValue("User Information"),
                                catch: vitest_1.vi.fn().mockImplementation((_fn) => Promise.resolve("")),
                            }),
                        }),
                    };
                }
                return createMockLocatorWithChaining([mockPanel]);
            });
            componentDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("#info-panel"),
            };
            const result = await componentDiscovery.discoverPanels();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].name).toBe("User Information");
            (0, vitest_1.expect)(result[0].text).toBe("User Information");
        });
        (0, vitest_1.it)("should enhance custom components with test attributes", async () => {
            const mockCustom = {
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "data-testid")
                        return "profile-card";
                    if (attr === "id")
                        return "user-profile";
                    if (attr === "class")
                        return "component";
                    return null;
                }),
                isVisible: () => Promise.resolve(true),
            };
            mockPage.locator.mockImplementation(() => ({
                ...createMockLocatorWithChaining([mockCustom]),
            }));
            componentDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue('[data-testid="profile-card"]'),
            };
            const result = await componentDiscovery.discoverCustomComponents();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].name).toBe("user-profile"); // Uses id as name
            (0, vitest_1.expect)(result[0].actions).toEqual(["screenshot", "hover"]);
        });
    });
});
//# sourceMappingURL=ComponentDiscovery.test.js.map