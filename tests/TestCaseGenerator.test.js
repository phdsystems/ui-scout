"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TestCaseGenerator_1 = require("../src/TestCaseGenerator");
(0, vitest_1.describe)("TestCaseGenerator", () => {
    let testCaseGenerator;
    let mockInputDiscovery;
    (0, vitest_1.beforeEach)(() => {
        mockInputDiscovery = {
            getTestValueForInput: vitest_1.vi.fn().mockImplementation((type) => {
                const testDataMap = {
                    text: "Test Text",
                    email: "test@example.com",
                    password: "Password123!",
                    number: "42",
                    date: "2024-01-01",
                    tel: "555-1234",
                };
                return testDataMap[type] || "test value";
            }),
        };
        testCaseGenerator = new TestCaseGenerator_1.TestCaseGenerator(mockInputDiscovery);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("generateTestCases", () => {
        (0, vitest_1.it)("should generate test cases for button features", async () => {
            const features = [
                {
                    type: "button",
                    name: "Submit",
                    selector: "#submit-btn",
                    attributes: { type: "submit" },
                    actions: ["click"],
                },
            ];
            const testCases = await testCaseGenerator.generateTestCases(features);
            (0, vitest_1.expect)(testCases).toHaveLength(1);
            (0, vitest_1.expect)(testCases[0].feature).toEqual(features[0]);
            (0, vitest_1.expect)(testCases[0].steps).toHaveLength(1);
            (0, vitest_1.expect)(testCases[0].steps[0].action).toBe("click");
            (0, vitest_1.expect)(testCases[0].steps[0].selector).toBe("#submit-btn");
            (0, vitest_1.expect)(testCases[0].assertions).toHaveLength(2);
            (0, vitest_1.expect)(testCases[0].assertions[0].type).toBe("visible");
            (0, vitest_1.expect)(testCases[0].assertions[1].type).toBe("visible");
            (0, vitest_1.expect)(testCases[0].assertions[1].description).toContain("remain visible after click");
        });
        (0, vitest_1.it)("should generate test cases for input features", async () => {
            const features = [
                {
                    type: "input",
                    name: "Email",
                    selector: "#email",
                    attributes: { type: "email", name: "email" },
                    actions: ["fill"],
                },
            ];
            const testCases = await testCaseGenerator.generateTestCases(features);
            (0, vitest_1.expect)(testCases).toHaveLength(1);
            (0, vitest_1.expect)(testCases[0].steps).toHaveLength(1);
            (0, vitest_1.expect)(testCases[0].steps[0].action).toBe("fill");
            (0, vitest_1.expect)(testCases[0].steps[0].value).toBe("test@example.com");
            (0, vitest_1.expect)(mockInputDiscovery.getTestValueForInput).toHaveBeenCalledWith("email");
        });
        (0, vitest_1.it)("should generate test cases for navigation features", async () => {
            const features = [
                {
                    type: "menu",
                    name: "About Us",
                    selector: "nav a[href='/about']",
                    attributes: { href: "/about" },
                    actions: ["click"],
                },
            ];
            const testCases = await testCaseGenerator.generateTestCases(features);
            (0, vitest_1.expect)(testCases).toHaveLength(1);
            (0, vitest_1.expect)(testCases[0].steps[0].action).toBe("click");
            (0, vitest_1.expect)(testCases[0].steps[0].selector).toBe("nav a[href='/about']");
        });
        (0, vitest_1.it)("should generate test cases for multiple actions", async () => {
            const features = [
                {
                    type: "button",
                    name: "Interactive Button",
                    selector: "#interactive-btn",
                    attributes: { type: "button" },
                    actions: ["click", "hover"],
                },
            ];
            const testCases = await testCaseGenerator.generateTestCases(features);
            (0, vitest_1.expect)(testCases).toHaveLength(1);
            (0, vitest_1.expect)(testCases[0].steps).toHaveLength(2);
            (0, vitest_1.expect)(testCases[0].steps[0].action).toBe("click");
            (0, vitest_1.expect)(testCases[0].steps[1].action).toBe("hover");
        });
        (0, vitest_1.it)("should handle features with no actions", async () => {
            const features = [
                {
                    type: "panel",
                    name: "Info Panel",
                    selector: ".info-panel",
                    attributes: {},
                    actions: [],
                },
            ];
            const testCases = await testCaseGenerator.generateTestCases(features);
            // Should not generate test case for features with no actions
            (0, vitest_1.expect)(testCases).toHaveLength(0);
        });
        (0, vitest_1.it)("should generate test cases for dropdown selection", async () => {
            const features = [
                {
                    type: "dropdown",
                    name: "Country Selector",
                    selector: "#country-select",
                    attributes: {},
                    actions: ["select"],
                },
            ];
            const testCases = await testCaseGenerator.generateTestCases(features);
            (0, vitest_1.expect)(testCases).toHaveLength(1);
            (0, vitest_1.expect)(testCases[0].steps[0].action).toBe("select");
        });
        (0, vitest_1.it)("should generate test cases for checkbox actions", async () => {
            const features = [
                {
                    type: "input",
                    name: "Terms Checkbox",
                    selector: "#terms",
                    attributes: { type: "checkbox" },
                    actions: ["check"],
                },
            ];
            const testCases = await testCaseGenerator.generateTestCases(features);
            (0, vitest_1.expect)(testCases).toHaveLength(1);
            (0, vitest_1.expect)(testCases[0].steps[0].action).toBe("check");
        });
        (0, vitest_1.it)("should handle empty features array", async () => {
            const testCases = await testCaseGenerator.generateTestCases([]);
            (0, vitest_1.expect)(testCases).toEqual([]);
        });
        (0, vitest_1.it)("should generate proper assertions for all test cases", async () => {
            const features = [
                {
                    type: "button",
                    name: "Submit",
                    selector: "#submit",
                    attributes: {},
                    actions: ["click"],
                },
            ];
            const testCases = await testCaseGenerator.generateTestCases(features);
            (0, vitest_1.expect)(testCases).toHaveLength(1);
            (0, vitest_1.expect)(testCases[0].assertions).toHaveLength(2);
            (0, vitest_1.expect)(testCases[0].assertions[0]).toMatchObject({
                type: "visible",
                selector: "#submit",
                description: "Submit should be visible",
            });
            (0, vitest_1.expect)(testCases[0].assertions[1]).toMatchObject({
                type: "visible",
                selector: "#submit",
                description: "Submit should remain visible after click",
            });
        });
        (0, vitest_1.it)("should call getDefaultTestValue when InputDiscovery method fails", async () => {
            mockInputDiscovery.getTestValueForInput.mockReturnValue(undefined);
            const features = [
                {
                    type: "input",
                    name: "Custom Input",
                    selector: "#custom",
                    attributes: { type: "custom" },
                    actions: ["fill"],
                },
            ];
            const testCases = await testCaseGenerator.generateTestCases(features);
            (0, vitest_1.expect)(testCases).toHaveLength(1);
            (0, vitest_1.expect)(testCases[0].steps[0].value).toBe("Test Value"); // Default fallback
        });
        (0, vitest_1.it)("should handle features with complex attributes", async () => {
            const features = [
                {
                    type: "input",
                    name: "Password Field",
                    selector: "#password",
                    attributes: {
                        type: "password",
                        required: "true",
                        minlength: "8",
                        maxlength: "50",
                    },
                    actions: ["fill"],
                },
            ];
            const testCases = await testCaseGenerator.generateTestCases(features);
            (0, vitest_1.expect)(testCases).toHaveLength(1);
            (0, vitest_1.expect)(testCases[0].steps[0].value).toBe("Password123!");
            (0, vitest_1.expect)(mockInputDiscovery.getTestValueForInput).toHaveBeenCalledWith("password");
        });
        (0, vitest_1.it)("should generate test cases with screenshot actions", async () => {
            const features = [
                {
                    type: "panel",
                    name: "Dashboard Panel",
                    selector: ".dashboard",
                    actions: ["screenshot"],
                },
                {
                    type: "chart",
                    name: "Analytics Chart",
                    selector: "#chart",
                    actions: ["hover", "screenshot"],
                },
            ];
            const testCases = await testCaseGenerator.generateTestCases(features);
            (0, vitest_1.expect)(testCases).toHaveLength(2);
            // First test case - panel with screenshot
            (0, vitest_1.expect)(testCases[0].steps).toHaveLength(1);
            (0, vitest_1.expect)(testCases[0].steps[0]).toMatchObject({
                action: "screenshot",
                selector: ".dashboard",
                description: "Take screenshot of Dashboard Panel",
            });
            // Second test case - chart with hover and screenshot
            (0, vitest_1.expect)(testCases[1].steps).toHaveLength(2);
            (0, vitest_1.expect)(testCases[1].steps[0]).toMatchObject({
                action: "hover",
                selector: "#chart",
                description: "Hover over Analytics Chart",
            });
            (0, vitest_1.expect)(testCases[1].steps[1]).toMatchObject({
                action: "screenshot",
                selector: "#chart",
                description: "Take screenshot of Analytics Chart",
            });
        });
        (0, vitest_1.it)("should filter out null test cases", async () => {
            // Mock createTestCase to return null for some features
            const originalCreateTestCase = testCaseGenerator["createTestCase"];
            testCaseGenerator["createTestCase"] = vitest_1.vi
                .fn()
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({
                feature: { name: "Valid", type: "button", selector: "#valid" },
                steps: [{ action: "click", selector: "#valid", description: "Click" }],
                assertions: [{ type: "visible", selector: "#valid", description: "Should be visible" }],
            });
            const features = [
                { type: "other", name: "Invalid", selector: "#invalid", actions: [] },
                { type: "button", name: "Valid", selector: "#valid", actions: ["click"] },
            ];
            const testCases = await testCaseGenerator.generateTestCases(features);
            (0, vitest_1.expect)(testCases).toHaveLength(1);
            (0, vitest_1.expect)(testCases[0].feature.name).toBe("Valid");
            // Restore original method
            testCaseGenerator["createTestCase"] = originalCreateTestCase;
        });
    });
});
//# sourceMappingURL=TestCaseGenerator.test.js.map