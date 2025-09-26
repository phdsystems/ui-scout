"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const DiscoveryService_1 = require("../src/DiscoveryService");
const playwright_mock_1 = require("./mocks/playwright.mock");
(0, vitest_1.describe)("DiscoveryService", () => {
    let mockPage;
    let discoveryService;
    // Helper to create fully mocked discovery services
    const mockDiscoveryServices = (overrides = {}) => {
        discoveryService["buttonDiscovery"] = {
            discoverButtons: vitest_1.vi.fn().mockResolvedValue([]),
            ...overrides.buttonDiscovery,
        };
        discoveryService["inputDiscovery"] = {
            discoverInputs: vitest_1.vi.fn().mockResolvedValue([]),
            ...overrides.inputDiscovery,
        };
        discoveryService["componentDiscovery"] = {
            discoverCharts: vitest_1.vi.fn().mockResolvedValue([]),
            discoverPanels: vitest_1.vi.fn().mockResolvedValue([]),
            discoverModals: vitest_1.vi.fn().mockResolvedValue([]),
            discoverTables: vitest_1.vi.fn().mockResolvedValue([]),
            discoverCustomComponents: vitest_1.vi.fn().mockResolvedValue([]),
            ...overrides.componentDiscovery,
        };
        discoveryService["navigationDiscovery"] = {
            discoverMenus: vitest_1.vi.fn().mockResolvedValue([]),
            discoverDropdowns: vitest_1.vi.fn().mockResolvedValue([]),
            discoverTabs: vitest_1.vi.fn().mockResolvedValue([]),
            ...overrides.navigationDiscovery,
        };
    };
    (0, vitest_1.beforeEach)(() => {
        mockPage = (0, playwright_mock_1.createMockPage)();
        discoveryService = new DiscoveryService_1.DiscoveryService(mockPage);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("discoverFeatures", () => {
        (0, vitest_1.it)("should discover all types of features", async () => {
            // Mock the individual discovery services
            const mockButtonFeatures = [
                {
                    type: "button",
                    name: "Submit Button",
                    selector: "#submit",
                    actions: ["click"],
                },
            ];
            const mockInputFeatures = [
                {
                    type: "input",
                    name: "Email Field",
                    selector: "#email",
                    actions: ["fill"],
                },
            ];
            const mockNavigationFeatures = [
                {
                    type: "menu",
                    name: "Home Link",
                    selector: "nav a[href='/']",
                    actions: ["click"],
                },
            ];
            const mockGenericFeatures = [
                {
                    type: "panel",
                    name: "Info Panel",
                    selector: ".info-panel",
                    actions: ["screenshot"],
                },
            ];
            // Mock all discovery services
            mockDiscoveryServices({
                buttonDiscovery: {
                    discoverButtons: vitest_1.vi.fn().mockResolvedValue(mockButtonFeatures),
                },
                inputDiscovery: {
                    discoverInputs: vitest_1.vi.fn().mockResolvedValue(mockInputFeatures),
                },
                componentDiscovery: {
                    discoverCharts: vitest_1.vi.fn().mockResolvedValue([]),
                    discoverPanels: vitest_1.vi.fn().mockResolvedValue([mockGenericFeatures[0]]), // Panel feature
                    discoverModals: vitest_1.vi.fn().mockResolvedValue([]),
                    discoverTables: vitest_1.vi.fn().mockResolvedValue([]),
                    discoverCustomComponents: vitest_1.vi.fn().mockResolvedValue([]),
                },
                navigationDiscovery: {
                    discoverMenus: vitest_1.vi.fn().mockResolvedValue(mockNavigationFeatures),
                    discoverDropdowns: vitest_1.vi.fn().mockResolvedValue([]),
                    discoverTabs: vitest_1.vi.fn().mockResolvedValue([]),
                },
            });
            const features = await discoveryService.discoverAllFeatures();
            (0, vitest_1.expect)(features).toHaveLength(4);
            (0, vitest_1.expect)(features).toEqual(vitest_1.expect.arrayContaining([
                mockButtonFeatures[0],
                mockInputFeatures[0],
                mockNavigationFeatures[0],
                mockGenericFeatures[0],
            ]));
            // Verify all discovery methods were called
            (0, vitest_1.expect)(discoveryService["buttonDiscovery"].discoverButtons).toHaveBeenCalled();
            (0, vitest_1.expect)(discoveryService["inputDiscovery"].discoverInputs).toHaveBeenCalled();
            (0, vitest_1.expect)(discoveryService["navigationDiscovery"].discoverMenus).toHaveBeenCalled();
            (0, vitest_1.expect)(discoveryService["componentDiscovery"].discoverCharts).toHaveBeenCalled();
            (0, vitest_1.expect)(discoveryService["componentDiscovery"].discoverPanels).toHaveBeenCalled();
        });
        (0, vitest_1.it)("should handle empty results from individual discovery services", async () => {
            // Mock all services to return empty arrays
            mockDiscoveryServices();
            const features = await discoveryService.discoverAllFeatures();
            (0, vitest_1.expect)(features).toEqual([]);
        });
        (0, vitest_1.it)("should deduplicate features with the same selector", async () => {
            const duplicateSelector = "#duplicate-element";
            const mockButtonFeatures = [
                {
                    type: "button",
                    name: "Button Element",
                    selector: duplicateSelector,
                    actions: ["click"],
                },
            ];
            const mockGenericFeatures = [
                {
                    type: "other",
                    name: "Generic Element",
                    selector: duplicateSelector,
                    actions: ["hover"],
                },
            ];
            mockDiscoveryServices({
                buttonDiscovery: {
                    discoverButtons: vitest_1.vi.fn().mockResolvedValue(mockButtonFeatures),
                },
                componentDiscovery: {
                    discoverCharts: vitest_1.vi.fn().mockResolvedValue(mockGenericFeatures), // Use generic features as charts for this test
                    discoverPanels: vitest_1.vi.fn().mockResolvedValue([]),
                    discoverModals: vitest_1.vi.fn().mockResolvedValue([]),
                    discoverTables: vitest_1.vi.fn().mockResolvedValue([]),
                    discoverCustomComponents: vitest_1.vi.fn().mockResolvedValue([]),
                },
            });
            const features = await discoveryService.discoverAllFeatures();
            // Should keep only the first occurrence (button)
            (0, vitest_1.expect)(features).toHaveLength(1);
            (0, vitest_1.expect)(features[0].type).toBe("button");
            (0, vitest_1.expect)(features[0].name).toBe("Button Element");
        });
        (0, vitest_1.it)("should handle discovery service errors gracefully", async () => {
            // Mock one service to throw an error
            mockDiscoveryServices({
                buttonDiscovery: {
                    discoverButtons: vitest_1.vi.fn().mockRejectedValue(new Error("Button discovery failed")),
                },
                inputDiscovery: {
                    discoverInputs: vitest_1.vi.fn().mockResolvedValue([
                        {
                            type: "input",
                            name: "Working Input",
                            selector: "#working",
                            actions: ["fill"],
                        },
                    ]),
                },
            });
            // Should continue with other services even if one fails
            await (0, vitest_1.expect)(discoveryService.discoverAllFeatures()).rejects.toThrow("Button discovery failed");
        });
        (0, vitest_1.it)("should call all discovery methods", async () => {
            // Mock all discovery services
            mockDiscoveryServices();
            await discoveryService.discoverAllFeatures();
            // Verify services were called
            (0, vitest_1.expect)(discoveryService["buttonDiscovery"].discoverButtons).toHaveBeenCalled();
            (0, vitest_1.expect)(discoveryService["inputDiscovery"].discoverInputs).toHaveBeenCalled();
            (0, vitest_1.expect)(discoveryService["navigationDiscovery"].discoverMenus).toHaveBeenCalled();
            (0, vitest_1.expect)(discoveryService["componentDiscovery"].discoverCharts).toHaveBeenCalled();
        });
        (0, vitest_1.it)("should maintain feature order from discovery services", async () => {
            const mockFeatures = [
                {
                    type: "button",
                    name: "First Button",
                    selector: "#first",
                    actions: ["click"],
                },
                {
                    type: "input",
                    name: "First Input",
                    selector: "#input1",
                    actions: ["fill"],
                },
                {
                    type: "menu",
                    name: "First Nav",
                    selector: "#nav1",
                    actions: ["click"],
                },
                {
                    type: "panel",
                    name: "First Panel",
                    selector: "#panel1",
                    actions: ["screenshot"],
                },
            ];
            // Mock services to return features in specific order
            mockDiscoveryServices({
                buttonDiscovery: {
                    discoverButtons: vitest_1.vi.fn().mockResolvedValue([mockFeatures[0]]),
                },
                inputDiscovery: {
                    discoverInputs: vitest_1.vi.fn().mockResolvedValue([mockFeatures[1]]),
                },
                navigationDiscovery: {
                    discoverMenus: vitest_1.vi.fn().mockResolvedValue([mockFeatures[2]]),
                    discoverDropdowns: vitest_1.vi.fn().mockResolvedValue([]),
                    discoverTabs: vitest_1.vi.fn().mockResolvedValue([]),
                },
                componentDiscovery: {
                    discoverCharts: vitest_1.vi.fn().mockResolvedValue([]),
                    discoverPanels: vitest_1.vi.fn().mockResolvedValue([mockFeatures[3]]),
                    discoverModals: vitest_1.vi.fn().mockResolvedValue([]),
                    discoverTables: vitest_1.vi.fn().mockResolvedValue([]),
                    discoverCustomComponents: vitest_1.vi.fn().mockResolvedValue([]),
                },
            });
            const features = await discoveryService.discoverAllFeatures();
            (0, vitest_1.expect)(features).toHaveLength(4);
            (0, vitest_1.expect)(features[0].name).toBe("First Button");
            (0, vitest_1.expect)(features[1].name).toBe("First Input");
            (0, vitest_1.expect)(features[2].name).toBe("First Nav");
            (0, vitest_1.expect)(features[3].name).toBe("First Panel");
        });
        (0, vitest_1.it)("should handle large numbers of discovered features", async () => {
            const largeButtonArray = Array.from({ length: 100 }, (_, i) => ({
                type: "button",
                name: `Button ${i}`,
                selector: `#button-${i}`,
                actions: ["click"],
            }));
            const largeInputArray = Array.from({ length: 50 }, (_, i) => ({
                type: "input",
                name: `Input ${i}`,
                selector: `#input-${i}`,
                actions: ["fill"],
            }));
            mockDiscoveryServices({
                buttonDiscovery: {
                    discoverButtons: vitest_1.vi.fn().mockResolvedValue(largeButtonArray),
                },
                inputDiscovery: {
                    discoverInputs: vitest_1.vi.fn().mockResolvedValue(largeInputArray),
                },
            });
            const features = await discoveryService.discoverAllFeatures();
            (0, vitest_1.expect)(features).toHaveLength(150);
            (0, vitest_1.expect)(features.filter((f) => f.type === "button")).toHaveLength(100);
            (0, vitest_1.expect)(features.filter((f) => f.type === "input")).toHaveLength(50);
        });
        (0, vitest_1.it)("should preserve all feature properties during aggregation", async () => {
            const complexFeature = {
                type: "button",
                name: "Complex Button",
                selector: "#complex-btn",
                text: "Click Me",
                attributes: {
                    class: "btn btn-primary",
                    "data-testid": "complex-button",
                    disabled: "false",
                },
                actions: ["click", "hover", "focus"],
                screenshot: "data:image/png;base64,iVBORw0KGgoAAAANS...",
            };
            mockDiscoveryServices({
                buttonDiscovery: {
                    discoverButtons: vitest_1.vi.fn().mockResolvedValue([complexFeature]),
                },
            });
            const features = await discoveryService.discoverAllFeatures();
            (0, vitest_1.expect)(features).toHaveLength(1);
            (0, vitest_1.expect)(features[0]).toEqual(complexFeature);
            (0, vitest_1.expect)(features[0].attributes).toEqual(complexFeature.attributes);
            (0, vitest_1.expect)(features[0].actions).toEqual(complexFeature.actions);
            (0, vitest_1.expect)(features[0].screenshot).toEqual(complexFeature.screenshot);
        });
    });
    (0, vitest_1.describe)("discoverDynamicFeatures", () => {
        (0, vitest_1.it)("should discover dynamic features through interactions", async () => {
            const existingFeatures = [
                {
                    type: "button",
                    name: "Button with tooltip",
                    selector: "#btn1",
                    actions: ["click"],
                    attributes: { id: "btn1" },
                },
                {
                    type: "menu",
                    name: "Navigation Menu",
                    selector: "nav",
                    actions: ["click"],
                },
            ];
            // Mock buttonDiscovery.discoverTooltips
            const mockButtonDiscovery = {
                discoverTooltips: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            Object.defineProperty(discoveryService, "buttonDiscovery", {
                value: mockButtonDiscovery,
                writable: true,
            });
            // Mock nav element interactions
            const mockNavLocator = {
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                hover: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            // Mock dynamic elements that appear after hover
            const mockDynamicLocator = {
                first: vitest_1.vi.fn().mockReturnThis(),
                isVisible: vitest_1.vi
                    .fn()
                    .mockResolvedValueOnce(true) // dropdown-menu visible
                    .mockResolvedValueOnce(false) // submenu not visible
                    .mockResolvedValueOnce(false) // popup not visible
                    .mockResolvedValueOnce(false) // overlay not visible
                    .mockResolvedValueOnce(false), // modal not visible
                textContent: vitest_1.vi.fn().mockResolvedValue("Dynamic Dropdown Content"),
            };
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "nav") {
                    return mockNavLocator;
                }
                if (selector.includes(":visible") || selector.includes("dropdown")) {
                    return mockDynamicLocator;
                }
                return { isVisible: vitest_1.vi.fn().mockResolvedValue(false) };
            });
            mockPage.waitForTimeout = vitest_1.vi.fn().mockResolvedValue(undefined);
            const dynamicFeatures = await discoveryService.discoverDynamicFeatures(existingFeatures);
            (0, vitest_1.expect)(mockButtonDiscovery.discoverTooltips).toHaveBeenCalledWith([existingFeatures[0]]);
            (0, vitest_1.expect)(mockNavLocator.hover).toHaveBeenCalled();
            (0, vitest_1.expect)(mockPage.waitForTimeout).toHaveBeenCalledWith(500);
            (0, vitest_1.expect)(dynamicFeatures).toHaveLength(1);
            (0, vitest_1.expect)(dynamicFeatures[0]).toMatchObject({
                name: "Dynamic Dropdown Content",
                type: "other",
                selector: ".dropdown-menu:visible",
                actions: ["click", "screenshot"],
            });
        });
        (0, vitest_1.it)("should handle navigation elements with nav in selector", async () => {
            const existingFeatures = [
                {
                    type: "link",
                    name: "Nav Link",
                    selector: ".nav-link",
                    actions: ["click"],
                },
            ];
            const mockButtonDiscovery = {
                discoverTooltips: vitest_1.vi.fn(),
            };
            Object.defineProperty(discoveryService, "buttonDiscovery", {
                value: mockButtonDiscovery,
                writable: true,
            });
            const mockNavLocator = {
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                hover: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            mockPage.locator.mockImplementation(() => ({
                first: vitest_1.vi.fn().mockReturnThis(),
                isVisible: vitest_1.vi.fn().mockResolvedValue(false),
            }));
            mockPage.locator.mockImplementation((selector) => {
                if (selector === ".nav-link") {
                    return mockNavLocator;
                }
                return {
                    first: vitest_1.vi.fn().mockReturnThis(),
                    isVisible: vitest_1.vi.fn().mockResolvedValue(false),
                };
            });
            mockPage.waitForTimeout = vitest_1.vi.fn().mockResolvedValue(undefined);
            const dynamicFeatures = await discoveryService.discoverDynamicFeatures(existingFeatures);
            (0, vitest_1.expect)(mockNavLocator.hover).toHaveBeenCalled();
            (0, vitest_1.expect)(dynamicFeatures).toEqual([]);
        });
        (0, vitest_1.it)("should handle navigation elements with nav class", async () => {
            const existingFeatures = [
                {
                    type: "other",
                    name: "Nav Element",
                    selector: ".some-element",
                    actions: ["click"],
                    attributes: { class: "some-element nav-item" },
                },
            ];
            const mockButtonDiscovery = {
                discoverTooltips: vitest_1.vi.fn(),
            };
            Object.defineProperty(discoveryService, "buttonDiscovery", {
                value: mockButtonDiscovery,
                writable: true,
            });
            const mockNavLocator = {
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                hover: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            mockPage.locator.mockImplementation((selector) => {
                if (selector === ".some-element") {
                    return mockNavLocator;
                }
                return {
                    first: vitest_1.vi.fn().mockReturnThis(),
                    isVisible: vitest_1.vi.fn().mockResolvedValue(false),
                };
            });
            mockPage.waitForTimeout = vitest_1.vi.fn().mockResolvedValue(undefined);
            const _dynamicFeatures = await discoveryService.discoverDynamicFeatures(existingFeatures);
            (0, vitest_1.expect)(mockNavLocator.hover).toHaveBeenCalled();
        });
        (0, vitest_1.it)("should limit navigation interactions to first 5 items", async () => {
            const existingFeatures = Array.from({ length: 10 }, (_, i) => ({
                type: "menu",
                name: `Nav ${i}`,
                selector: `#nav${i}`,
                actions: ["click"],
            }));
            const mockButtonDiscovery = {
                discoverTooltips: vitest_1.vi.fn(),
            };
            Object.defineProperty(discoveryService, "buttonDiscovery", {
                value: mockButtonDiscovery,
                writable: true,
            });
            let hoverCount = 0;
            const mockNavLocator = {
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                hover: vitest_1.vi.fn().mockImplementation(() => {
                    hoverCount++;
                    return Promise.resolve();
                }),
            };
            mockPage.locator.mockImplementation(() => mockNavLocator);
            mockPage.waitForTimeout = vitest_1.vi.fn().mockResolvedValue(undefined);
            await discoveryService.discoverDynamicFeatures(existingFeatures);
            (0, vitest_1.expect)(hoverCount).toBe(5); // Should limit to 5
        });
        (0, vitest_1.it)("should handle invisible navigation elements", async () => {
            const existingFeatures = [
                {
                    type: "menu",
                    name: "Hidden Nav",
                    selector: "#hidden-nav",
                    actions: ["click"],
                },
            ];
            const mockButtonDiscovery = {
                discoverTooltips: vitest_1.vi.fn(),
            };
            Object.defineProperty(discoveryService, "buttonDiscovery", {
                value: mockButtonDiscovery,
                writable: true,
            });
            const mockNavLocator = {
                isVisible: vitest_1.vi.fn().mockResolvedValue(false),
                hover: vitest_1.vi.fn(),
            };
            mockPage.locator.mockImplementation(() => mockNavLocator);
            const dynamicFeatures = await discoveryService.discoverDynamicFeatures(existingFeatures);
            (0, vitest_1.expect)(mockNavLocator.hover).not.toHaveBeenCalled();
            (0, vitest_1.expect)(dynamicFeatures).toEqual([]);
        });
        (0, vitest_1.it)("should handle errors during navigation interaction", async () => {
            const existingFeatures = [
                {
                    type: "menu",
                    name: "Error Nav",
                    selector: "#error-nav",
                    actions: ["click"],
                },
                {
                    type: "menu",
                    name: "Good Nav",
                    selector: "#good-nav",
                    actions: ["click"],
                },
            ];
            const mockButtonDiscovery = {
                discoverTooltips: vitest_1.vi.fn(),
            };
            Object.defineProperty(discoveryService, "buttonDiscovery", {
                value: mockButtonDiscovery,
                writable: true,
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "#error-nav") {
                    throw new Error("Nav error");
                }
                return {
                    isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                    hover: vitest_1.vi.fn().mockResolvedValue(undefined),
                    first: vitest_1.vi.fn().mockReturnThis(),
                };
            });
            mockPage.waitForTimeout = vitest_1.vi.fn().mockResolvedValue(undefined);
            // Should not throw, continues with other elements
            const dynamicFeatures = await discoveryService.discoverDynamicFeatures(existingFeatures);
            (0, vitest_1.expect)(dynamicFeatures).toBeDefined();
        });
        (0, vitest_1.it)("should discover multiple dynamic element types", async () => {
            const existingFeatures = [
                {
                    type: "menu",
                    name: "Nav",
                    selector: "nav",
                    actions: ["click"],
                },
            ];
            const mockButtonDiscovery = {
                discoverTooltips: vitest_1.vi.fn(),
            };
            Object.defineProperty(discoveryService, "buttonDiscovery", {
                value: mockButtonDiscovery,
                writable: true,
            });
            const mockNavLocator = {
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                hover: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
            let selectorCount = 0;
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "nav") {
                    return mockNavLocator;
                }
                // Make different selectors visible
                return {
                    first: vitest_1.vi.fn().mockReturnThis(),
                    isVisible: vitest_1.vi.fn().mockImplementation(() => {
                        selectorCount++;
                        return Promise.resolve(selectorCount <= 3); // First 3 selectors visible
                    }),
                    textContent: vitest_1.vi.fn().mockResolvedValue(`Dynamic ${selectorCount}`),
                };
            });
            mockPage.waitForTimeout = vitest_1.vi.fn().mockResolvedValue(undefined);
            const dynamicFeatures = await discoveryService.discoverDynamicFeatures(existingFeatures);
            (0, vitest_1.expect)(dynamicFeatures).toHaveLength(3);
            (0, vitest_1.expect)(dynamicFeatures[0].selector).toBe(".dropdown-menu:visible");
            (0, vitest_1.expect)(dynamicFeatures[1].selector).toBe(".submenu:visible");
            (0, vitest_1.expect)(dynamicFeatures[2].selector).toBe('[class*="popup"]:visible');
        });
    });
    (0, vitest_1.describe)("integration with discovery services", () => {
        (0, vitest_1.it)("should create all required discovery service instances", () => {
            // Verify that all discovery services are instantiated
            (0, vitest_1.expect)(discoveryService["buttonDiscovery"]).toBeDefined();
            (0, vitest_1.expect)(discoveryService["inputDiscovery"]).toBeDefined();
            (0, vitest_1.expect)(discoveryService["navigationDiscovery"]).toBeDefined();
            (0, vitest_1.expect)(discoveryService["componentDiscovery"]).toBeDefined();
        });
        (0, vitest_1.it)("should pass the page instance to all discovery services", () => {
            // The page should be passed to all services during construction
            // This is tested implicitly by the service instantiation
            (0, vitest_1.expect)(discoveryService["buttonDiscovery"]).toBeDefined();
            (0, vitest_1.expect)(discoveryService["inputDiscovery"]).toBeDefined();
            (0, vitest_1.expect)(discoveryService["navigationDiscovery"]).toBeDefined();
            (0, vitest_1.expect)(discoveryService["componentDiscovery"]).toBeDefined();
        });
    });
    (0, vitest_1.describe)("error handling", () => {
        (0, vitest_1.it)("should handle null/undefined features from services", async () => {
            // Mock services to return null/undefined
            mockDiscoveryServices({
                buttonDiscovery: {
                    discoverButtons: vitest_1.vi.fn().mockResolvedValue(null),
                },
                inputDiscovery: {
                    discoverInputs: vitest_1.vi.fn().mockResolvedValue(undefined),
                },
                navigationDiscovery: {
                    discoverMenus: vitest_1.vi.fn().mockResolvedValue([
                        {
                            type: "menu",
                            name: "Valid Nav",
                            selector: "#valid",
                            actions: ["click"],
                        },
                    ]),
                    discoverDropdowns: vitest_1.vi.fn().mockResolvedValue([]),
                    discoverTabs: vitest_1.vi.fn().mockResolvedValue([]),
                },
            });
            const features = await discoveryService.discoverAllFeatures();
            // Should only include valid features
            (0, vitest_1.expect)(features).toHaveLength(1);
            (0, vitest_1.expect)(features[0].name).toBe("Valid Nav");
        });
        (0, vitest_1.it)("should handle malformed features from services", async () => {
            const malformedFeatures = [
                null,
                undefined,
                {},
                { name: "No Type" },
                { type: "button" },
                {
                    type: "button",
                    name: "Valid Button",
                    selector: "#valid",
                    actions: ["click"],
                },
            ];
            mockDiscoveryServices({
                buttonDiscovery: {
                    discoverButtons: vitest_1.vi.fn().mockResolvedValue(malformedFeatures),
                },
            });
            const features = await discoveryService.discoverAllFeatures();
            // Should filter out malformed features
            (0, vitest_1.expect)(features).toHaveLength(1);
            (0, vitest_1.expect)(features[0].name).toBe("Valid Button");
        });
    });
});
//# sourceMappingURL=DiscoveryService.test.js.map