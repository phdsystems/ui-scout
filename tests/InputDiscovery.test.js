"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const InputDiscovery_1 = require("../src/InputDiscovery");
const playwright_mock_1 = require("./mocks/playwright.mock");
(0, vitest_1.describe)("InputDiscovery", () => {
    let mockPage;
    let inputDiscovery;
    (0, vitest_1.beforeEach)(() => {
        mockPage = (0, playwright_mock_1.createMockPage)();
        inputDiscovery = new InputDiscovery_1.InputDiscovery(mockPage);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)("discoverInputs", () => {
        (0, vitest_1.it)("should discover text input fields", async () => {
            const mockInput = (0, playwright_mock_1.createMockLocator)({
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    const attrs = {
                        type: "text",
                        id: "username",
                        name: "username",
                        placeholder: "Enter username",
                        required: "true",
                    };
                    return attrs[attr] || null;
                }),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
                toString: vitest_1.vi.fn().mockReturnValue("input#username"),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === 'input[type="text"]') {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockInput]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            // Mock SelectorUtils
            inputDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("input#username"),
                findLabelForInput: vitest_1.vi.fn().mockResolvedValue(""),
            };
            const result = await inputDiscovery.discoverInputs();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0]).toMatchObject({
                type: "input",
                selector: "input#username",
                name: "Enter username",
                attributes: {
                    type: "text",
                    placeholder: "Enter username",
                    name: "username",
                    id: "username",
                },
                actions: ["fill", "clear", "focus", "blur"],
            });
        });
        (0, vitest_1.it)("should discover different input types", async () => {
            const inputTypes = ["email", "password", "number", "date", "checkbox"];
            const mockInputs = inputTypes.map((type, index) => (0, playwright_mock_1.createMockLocator)({
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "type")
                        return type;
                    if (attr === "id")
                        return `input-${index}`;
                    if (attr === "name")
                        return `field-${type}`;
                    return null;
                }),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
                toString: vitest_1.vi.fn().mockReturnValue(`input[type=${type}]`),
            }));
            mockPage.locator.mockImplementation((selector) => {
                // Handle different input type selectors
                if (selector.includes('input[type="email"]')) {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockInputs[0]]) };
                }
                if (selector.includes('input[type="password"]')) {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockInputs[1]]) };
                }
                if (selector.includes('input[type="number"]')) {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockInputs[2]]) };
                }
                if (selector.includes('input[type="date"]')) {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockInputs[3]]) };
                }
                if (selector.includes('input[type="checkbox"]')) {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockInputs[4]]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            // Mock SelectorUtils for all inputs
            inputDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockImplementation((element) => {
                    const type = element.getAttribute("type");
                    const index = inputTypes.indexOf(type);
                    return `input[type=${type}]#input-${index}`;
                }),
                findLabelForInput: vitest_1.vi.fn().mockResolvedValue(""),
            };
            const result = await inputDiscovery.discoverInputs();
            (0, vitest_1.expect)(result).toHaveLength(5);
            result.forEach((input, index) => {
                (0, vitest_1.expect)(input.type).toBe("input");
                (0, vitest_1.expect)(input.attributes?.type).toBe(inputTypes[index]);
                (0, vitest_1.expect)(input.attributes?.name).toBe(`field-${inputTypes[index]}`);
            });
        });
        (0, vitest_1.it)("should discover textarea elements", async () => {
            const mockTextarea = (0, playwright_mock_1.createMockLocator)({
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    const attrs = {
                        id: "description",
                        name: "description",
                        placeholder: "Enter description",
                        rows: "5",
                        cols: "40",
                    };
                    return attrs[attr] || null;
                }),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
                toString: vitest_1.vi.fn().mockReturnValue("textarea#description"),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "textarea") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockTextarea]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            // Mock SelectorUtils
            inputDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("textarea#description"),
                findLabelForInput: vitest_1.vi.fn().mockResolvedValue(""),
            };
            const result = await inputDiscovery.discoverInputs();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].type).toBe("input");
            (0, vitest_1.expect)(result[0].name).toBe("Enter description");
            (0, vitest_1.expect)(result[0].attributes?.name).toBe("description");
        });
        (0, vitest_1.it)("should discover select dropdowns with options", async () => {
            const mockOption1 = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Option 1"),
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "value")
                        return "opt1";
                    return null;
                }),
            });
            const mockOption2 = (0, playwright_mock_1.createMockLocator)({
                textContent: vitest_1.vi.fn().mockResolvedValue("Option 2"),
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "value")
                        return "opt2";
                    return null;
                }),
            });
            const mockSelect = (0, playwright_mock_1.createMockLocator)({
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    const attrs = {
                        id: "country",
                        name: "country",
                    };
                    return attrs[attr] || null;
                }),
                locator: vitest_1.vi.fn().mockImplementation((selector) => {
                    if (selector === "option") {
                        return { all: vitest_1.vi.fn().mockResolvedValue([mockOption1, mockOption2]) };
                    }
                    return (0, playwright_mock_1.createMockLocator)();
                }),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
                toString: vitest_1.vi.fn().mockReturnValue("select#country"),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "select") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockSelect]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            // Mock SelectorUtils
            inputDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("select#country"),
                findLabelForInput: vitest_1.vi.fn().mockResolvedValue(""),
            };
            const result = await inputDiscovery.discoverInputs();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].type).toBe("input");
            (0, vitest_1.expect)(result[0].name).toBe("country");
            (0, vitest_1.expect)(result[0].attributes?.name).toBe("country");
        });
        (0, vitest_1.it)("should find labels for inputs", async () => {
            const mockInput = (0, playwright_mock_1.createMockLocator)({
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "type")
                        return "email";
                    if (attr === "id")
                        return "email-input";
                    return null;
                }),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
                toString: vitest_1.vi.fn().mockReturnValue("input#email-input"),
            });
            const mockSelectorUtils = {
                findLabelForInput: vitest_1.vi.fn().mockResolvedValue("Email Address"),
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("input#email-input"),
            };
            // Mock the selectorUtils property
            Object.defineProperty(inputDiscovery, "selectorUtils", {
                value: mockSelectorUtils,
                writable: true,
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector.includes('input[type="email"]')) {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockInput]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const result = await inputDiscovery.discoverInputs();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].name).toBe("Email Address");
            (0, vitest_1.expect)(mockSelectorUtils.findLabelForInput).toHaveBeenCalledWith(mockInput);
        });
        (0, vitest_1.it)("should identify validation attributes", async () => {
            const mockInput = (0, playwright_mock_1.createMockLocator)({
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    const attrs = {
                        type: "number",
                        min: "0",
                        max: "100",
                        step: "5",
                        pattern: "[0-9]+",
                        maxlength: "10",
                        minlength: "2",
                        required: "true",
                    };
                    return attrs[attr] || null;
                }),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
                toString: vitest_1.vi.fn().mockReturnValue("input[type=number]"),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector.includes('input[type="number"]')) {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockInput]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            // Mock SelectorUtils
            inputDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("input[type=number]"),
                findLabelForInput: vitest_1.vi.fn().mockResolvedValue(""),
            };
            const result = await inputDiscovery.discoverInputs();
            (0, vitest_1.expect)(result).toHaveLength(1);
            const input = result[0];
            (0, vitest_1.expect)(input.type).toBe("input");
            (0, vitest_1.expect)(input.attributes?.type).toBe("number");
        });
        (0, vitest_1.it)("should skip hidden inputs", async () => {
            const visibleInput = (0, playwright_mock_1.createMockLocator)({
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "type")
                        return "text";
                    return null;
                }),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
                toString: vitest_1.vi.fn().mockReturnValue("input.visible"),
            });
            const _hiddenInput = (0, playwright_mock_1.createMockLocator)({
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    if (attr === "type")
                        return "hidden";
                    return null;
                }),
                isVisible: vitest_1.vi.fn().mockResolvedValue(false),
                toString: vitest_1.vi.fn().mockReturnValue("input.hidden"),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector.includes('input[type="text"]')) {
                    return { all: vitest_1.vi.fn().mockResolvedValue([visibleInput]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            // Mock SelectorUtils
            inputDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("input.visible"),
                findLabelForInput: vitest_1.vi.fn().mockResolvedValue(""),
            };
            const result = await inputDiscovery.discoverInputs();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].attributes?.type).toBe("text");
        });
        (0, vitest_1.it)("should handle file input types", async () => {
            const _mockFileInput = (0, playwright_mock_1.createMockLocator)({
                getAttribute: vitest_1.vi.fn().mockImplementation((attr) => {
                    const attrs = {
                        type: "file",
                        accept: ".jpg,.png,.pdf",
                        multiple: "true",
                    };
                    return attrs[attr] || null;
                }),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
                toString: vitest_1.vi.fn().mockReturnValue("input[type=file]"),
            });
            mockPage.locator.mockImplementation((_selector) => {
                // File inputs are not in the standard selectors, they would not be found
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            const result = await inputDiscovery.discoverInputs();
            // File inputs are not discovered by the current selectors
            (0, vitest_1.expect)(result).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)("getTestValueForInput", () => {
        (0, vitest_1.it)("should generate test data for text input", () => {
            const testData = inputDiscovery.getTestValueForInput("text");
            (0, vitest_1.expect)(testData).toBe("Test Value");
        });
        (0, vitest_1.it)("should generate test data for email input", () => {
            const testData = inputDiscovery.getTestValueForInput("email");
            (0, vitest_1.expect)(testData).toBe("test@example.com");
        });
        (0, vitest_1.it)("should generate test data for password input", () => {
            const testData = inputDiscovery.getTestValueForInput("password");
            (0, vitest_1.expect)(testData).toBe("TestPassword123!");
        });
        (0, vitest_1.it)("should generate test data for number input", () => {
            const testData = inputDiscovery.getTestValueForInput("number");
            (0, vitest_1.expect)(testData).toBe("42");
        });
        (0, vitest_1.it)("should generate test data for date input", () => {
            const testData = inputDiscovery.getTestValueForInput("date");
            (0, vitest_1.expect)(testData).toBe("2024-01-01");
        });
        (0, vitest_1.it)("should generate test data for time input", () => {
            const testData = inputDiscovery.getTestValueForInput("time");
            (0, vitest_1.expect)(testData).toBe("12:00");
        });
        (0, vitest_1.it)("should generate test data for tel input", () => {
            const testData = inputDiscovery.getTestValueForInput("tel");
            (0, vitest_1.expect)(testData).toBe("+1234567890");
        });
        (0, vitest_1.it)("should generate test data for url input", () => {
            const testData = inputDiscovery.getTestValueForInput("url");
            (0, vitest_1.expect)(testData).toBe("https://example.com");
        });
        (0, vitest_1.it)("should generate test data for search input", () => {
            const testData = inputDiscovery.getTestValueForInput("search");
            (0, vitest_1.expect)(testData).toBe("test search query");
        });
        (0, vitest_1.it)("should handle unknown input types", () => {
            const testData = inputDiscovery.getTestValueForInput("unknown");
            (0, vitest_1.expect)(testData).toBe("Test Value");
        });
    });
    (0, vitest_1.describe)("error handling", () => {
        (0, vitest_1.it)("should handle errors gracefully", async () => {
            mockPage.locator.mockImplementation(() => {
                throw new Error("Selector error");
            });
            await (0, vitest_1.expect)(inputDiscovery.discoverInputs()).rejects.toThrow("Selector error");
        });
        (0, vitest_1.it)("should handle malformed select elements", async () => {
            const mockSelect = (0, playwright_mock_1.createMockLocator)({
                getAttribute: vitest_1.vi.fn().mockReturnValue(null),
                locator: vitest_1.vi.fn().mockImplementation(() => {
                    throw new Error("Options not found");
                }),
                isVisible: vitest_1.vi.fn().mockResolvedValue(true),
                isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
                toString: vitest_1.vi.fn().mockReturnValue("select.broken"),
            });
            mockPage.locator.mockImplementation((selector) => {
                if (selector === "select") {
                    return { all: vitest_1.vi.fn().mockResolvedValue([mockSelect]) };
                }
                return { all: vitest_1.vi.fn().mockResolvedValue([]) };
            });
            // Mock SelectorUtils
            inputDiscovery["selectorUtils"] = {
                getUniqueSelector: vitest_1.vi.fn().mockResolvedValue("select.broken"),
                findLabelForInput: vitest_1.vi.fn().mockResolvedValue(""),
            };
            const result = await inputDiscovery.discoverInputs();
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].type).toBe("input");
        });
    });
});
//# sourceMappingURL=InputDiscovery.test.js.map