"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)("Types and Interfaces", () => {
    (0, vitest_1.describe)("DiscoveredFeature", () => {
        (0, vitest_1.it)("should have all required properties", () => {
            const feature = {
                name: "Login Button",
                type: "button",
                selector: "#login-btn",
            };
            (0, vitest_1.expect)(feature.name).toBe("Login Button");
            (0, vitest_1.expect)(feature.type).toBe("button");
            (0, vitest_1.expect)(feature.selector).toBe("#login-btn");
        });
        (0, vitest_1.it)("should support all valid types", () => {
            const types = [
                "button",
                "menu",
                "panel",
                "input",
                "chart",
                "table",
                "modal",
                "dropdown",
                "tab",
                "other",
            ];
            types.forEach((type) => {
                const feature = {
                    name: `Test ${type}`,
                    type: type,
                    selector: `.${type}`,
                };
                (0, vitest_1.expect)(feature.type).toBe(type);
            });
        });
        (0, vitest_1.it)("should support optional properties", () => {
            const feature = {
                name: "Complex Feature",
                type: "panel",
                selector: ".panel",
                text: "Panel content text",
                attributes: {
                    id: "main-panel",
                    class: "panel primary",
                    "data-testid": "main-panel",
                },
                children: [
                    {
                        name: "Child Button",
                        type: "button",
                        selector: ".child-btn",
                    },
                ],
                actions: ["click", "hover", "screenshot"],
                screenshot: "base64-screenshot-data",
            };
            (0, vitest_1.expect)(feature.text).toBe("Panel content text");
            (0, vitest_1.expect)(feature.attributes).toEqual({
                id: "main-panel",
                class: "panel primary",
                "data-testid": "main-panel",
            });
            (0, vitest_1.expect)(feature.children).toHaveLength(1);
            (0, vitest_1.expect)(feature.children?.[0]?.name).toBe("Child Button");
            (0, vitest_1.expect)(feature.actions).toEqual(["click", "hover", "screenshot"]);
            (0, vitest_1.expect)(feature.screenshot).toBe("base64-screenshot-data");
        });
        (0, vitest_1.it)("should allow nested children", () => {
            const feature = {
                name: "Parent",
                type: "panel",
                selector: ".parent",
                children: [
                    {
                        name: "Child",
                        type: "menu",
                        selector: ".child",
                        children: [
                            {
                                name: "Grandchild",
                                type: "button",
                                selector: ".grandchild",
                            },
                        ],
                    },
                ],
            };
            (0, vitest_1.expect)(feature.children?.[0]?.children?.[0]?.name).toBe("Grandchild");
        });
    });
    (0, vitest_1.describe)("TestStep", () => {
        (0, vitest_1.it)("should support all action types", () => {
            const actions = [
                "click",
                "fill",
                "hover",
                "focus",
                "select",
                "check",
                "uncheck",
                "press",
                "screenshot",
            ];
            actions.forEach((action) => {
                const step = {
                    action: action,
                    selector: ".test-element",
                    description: `Test ${action} action`,
                };
                (0, vitest_1.expect)(step.action).toBe(action);
            });
        });
        (0, vitest_1.it)("should support optional value property", () => {
            const stepWithValue = {
                action: "fill",
                selector: "#email-input",
                value: "user@example.com",
                description: "Fill email field",
            };
            const stepWithoutValue = {
                action: "click",
                selector: "#submit-btn",
                description: "Click submit button",
            };
            (0, vitest_1.expect)(stepWithValue.value).toBe("user@example.com");
            (0, vitest_1.expect)(stepWithoutValue.value).toBeUndefined();
        });
    });
    (0, vitest_1.describe)("Assertion", () => {
        (0, vitest_1.it)("should support all assertion types", () => {
            const types = [
                "visible",
                "hidden",
                "enabled",
                "disabled",
                "text",
                "count",
                "attribute",
                "class",
            ];
            types.forEach((type) => {
                const assertion = {
                    type: type,
                    selector: ".test-element",
                    description: `Element should be ${type}`,
                };
                (0, vitest_1.expect)(assertion.type).toBe(type);
            });
        });
        (0, vitest_1.it)("should support expected value for complex assertions", () => {
            const textAssertion = {
                type: "text",
                selector: "#message",
                expected: "Success!",
                description: "Message should show success text",
            };
            const countAssertion = {
                type: "count",
                selector: ".list-item",
                expected: 5,
                description: "Should have 5 list items",
            };
            const attributeAssertion = {
                type: "attribute",
                selector: "#input",
                expected: { name: "email", type: "email" },
                description: "Input should have correct attributes",
            };
            (0, vitest_1.expect)(textAssertion.expected).toBe("Success!");
            (0, vitest_1.expect)(countAssertion.expected).toBe(5);
            (0, vitest_1.expect)(attributeAssertion.expected).toEqual({ name: "email", type: "email" });
        });
    });
    (0, vitest_1.describe)("TestCase", () => {
        (0, vitest_1.it)("should combine feature, steps, and assertions", () => {
            const feature = {
                name: "Login Form",
                type: "panel",
                selector: "#login-form",
            };
            const steps = [
                {
                    action: "fill",
                    selector: "#username",
                    value: "testuser",
                    description: "Enter username",
                },
                {
                    action: "fill",
                    selector: "#password",
                    value: "password123",
                    description: "Enter password",
                },
                {
                    action: "click",
                    selector: "#login-btn",
                    description: "Click login button",
                },
            ];
            const assertions = [
                {
                    type: "visible",
                    selector: "#dashboard",
                    description: "Dashboard should be visible after login",
                },
                {
                    type: "text",
                    selector: "#welcome-message",
                    expected: "Welcome, testuser!",
                    description: "Welcome message should show username",
                },
            ];
            const testCase = {
                feature,
                steps,
                assertions,
            };
            (0, vitest_1.expect)(testCase.feature.name).toBe("Login Form");
            (0, vitest_1.expect)(testCase.steps).toHaveLength(3);
            (0, vitest_1.expect)(testCase.assertions).toHaveLength(2);
        });
    });
    (0, vitest_1.describe)("DiscoveryReport", () => {
        (0, vitest_1.it)("should contain all required report data", () => {
            const features = [
                { name: "Button 1", type: "button", selector: "#btn1" },
                { name: "Input 1", type: "input", selector: "#input1" },
                { name: "Panel 1", type: "panel", selector: "#panel1" },
            ];
            const testCases = [
                {
                    feature: features[0],
                    steps: [{ action: "click", selector: "#btn1", description: "Click button" }],
                    assertions: [{ type: "visible", selector: "#result", description: "Result visible" }],
                },
            ];
            const report = {
                timestamp: "2024-01-15T10:30:00Z",
                url: "https://example.com/app",
                featuresDiscovered: 3,
                features,
                testCases,
                statistics: {
                    byType: {
                        button: 1,
                        input: 1,
                        panel: 1,
                    },
                    interactive: 2,
                    withText: 0,
                    withAttributes: 0,
                },
            };
            (0, vitest_1.expect)(report.timestamp).toBe("2024-01-15T10:30:00Z");
            (0, vitest_1.expect)(report.url).toBe("https://example.com/app");
            (0, vitest_1.expect)(report.featuresDiscovered).toBe(3);
            (0, vitest_1.expect)(report.features).toHaveLength(3);
            (0, vitest_1.expect)(report.testCases).toHaveLength(1);
            (0, vitest_1.expect)(report.statistics.byType.button).toBe(1);
            (0, vitest_1.expect)(report.statistics.interactive).toBe(2);
        });
        (0, vitest_1.it)("should validate statistics consistency", () => {
            const features = [
                { name: "Button", type: "button", selector: "#btn", text: "Click me" },
                { name: "Input", type: "input", selector: "#input", attributes: { type: "text" } },
            ];
            const report = {
                timestamp: new Date().toISOString(),
                url: "https://test.com",
                featuresDiscovered: features.length,
                features,
                testCases: [],
                statistics: {
                    byType: { button: 1, input: 1 },
                    interactive: 2,
                    withText: 1,
                    withAttributes: 1,
                },
            };
            // Verify statistics match the features
            const actualByType = features.reduce((acc, f) => {
                acc[f.type] = (acc[f.type] || 0) + 1;
                return acc;
            }, {});
            const actualWithText = features.filter((f) => f.text).length;
            const actualWithAttributes = features.filter((f) => f.attributes).length;
            (0, vitest_1.expect)(report.statistics.byType).toEqual(actualByType);
            (0, vitest_1.expect)(report.statistics.withText).toBe(actualWithText);
            (0, vitest_1.expect)(report.statistics.withAttributes).toBe(actualWithAttributes);
        });
    });
    (0, vitest_1.describe)("DiscoveryOptions", () => {
        (0, vitest_1.it)("should have all optional properties", () => {
            const options = {};
            (0, vitest_1.expect)(options).toBeDefined();
            const fullOptions = {
                maxDepth: 3,
                timeout: 5000,
                includeHidden: true,
                screenshotPath: "/screenshots",
            };
            (0, vitest_1.expect)(fullOptions.maxDepth).toBe(3);
            (0, vitest_1.expect)(fullOptions.timeout).toBe(5000);
            (0, vitest_1.expect)(fullOptions.includeHidden).toBe(true);
            (0, vitest_1.expect)(fullOptions.screenshotPath).toBe("/screenshots");
        });
        (0, vitest_1.it)("should allow partial options", () => {
            const partialOptions = {
                timeout: 3000,
                includeHidden: false,
            };
            (0, vitest_1.expect)(partialOptions.timeout).toBe(3000);
            (0, vitest_1.expect)(partialOptions.includeHidden).toBe(false);
            (0, vitest_1.expect)(partialOptions.maxDepth).toBeUndefined();
            (0, vitest_1.expect)(partialOptions.screenshotPath).toBeUndefined();
        });
    });
    (0, vitest_1.describe)("Type compatibility", () => {
        (0, vitest_1.it)("should allow assignment between compatible types", () => {
            const button = {
                name: "Test Button",
                type: "button",
                selector: "#test-btn",
            };
            const features = [button];
            const step = {
                action: "click",
                selector: button.selector,
                description: "Click the test button",
            };
            (0, vitest_1.expect)(features[0]).toBe(button);
            (0, vitest_1.expect)(step.selector).toBe(button.selector);
        });
        (0, vitest_1.it)("should preserve type information in arrays", () => {
            const mixedFeatures = [
                { name: "Button", type: "button", selector: "#btn" },
                { name: "Input", type: "input", selector: "#input" },
                { name: "Panel", type: "panel", selector: "#panel" },
            ];
            const buttonFeatures = mixedFeatures.filter((f) => f.type === "button");
            const inputFeatures = mixedFeatures.filter((f) => f.type === "input");
            (0, vitest_1.expect)(buttonFeatures).toHaveLength(1);
            (0, vitest_1.expect)(inputFeatures).toHaveLength(1);
            (0, vitest_1.expect)(buttonFeatures[0].type).toBe("button");
            (0, vitest_1.expect)(inputFeatures[0].type).toBe("input");
        });
        (0, vitest_1.it)("should support complex nested structures", () => {
            const complexFeature = {
                name: "Navigation Menu",
                type: "menu",
                selector: "nav",
                children: [
                    {
                        name: "Home Link",
                        type: "button",
                        selector: "nav a[href='/']",
                        actions: ["click", "hover"],
                    },
                    {
                        name: "Products Dropdown",
                        type: "dropdown",
                        selector: "nav .dropdown",
                        children: [
                            {
                                name: "Product 1",
                                type: "button",
                                selector: "nav .dropdown a:nth-child(1)",
                            },
                        ],
                    },
                ],
            };
            (0, vitest_1.expect)(complexFeature.children).toHaveLength(2);
            (0, vitest_1.expect)(complexFeature.children?.[1]?.children).toHaveLength(1);
            (0, vitest_1.expect)(complexFeature.children?.[0]?.actions).toContain("click");
        });
    });
});
//# sourceMappingURL=types.test.js.map