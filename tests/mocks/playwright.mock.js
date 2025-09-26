"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockElement = exports.createMockPage = exports.createMockLocator = void 0;
const vitest_1 = require("vitest");
const createMockLocator = (overrides) => {
    return {
        count: vitest_1.vi.fn().mockResolvedValue(0),
        all: vitest_1.vi.fn().mockResolvedValue([]),
        first: vitest_1.vi.fn().mockReturnThis(),
        last: vitest_1.vi.fn().mockReturnThis(),
        nth: vitest_1.vi.fn().mockReturnThis(),
        filter: vitest_1.vi.fn().mockReturnThis(),
        locator: vitest_1.vi.fn().mockReturnThis(),
        isVisible: vitest_1.vi.fn().mockResolvedValue(true),
        isEnabled: vitest_1.vi.fn().mockResolvedValue(true),
        isDisabled: vitest_1.vi.fn().mockResolvedValue(false),
        isChecked: vitest_1.vi.fn().mockResolvedValue(false),
        getAttribute: vitest_1.vi.fn().mockResolvedValue(null),
        textContent: vitest_1.vi.fn().mockResolvedValue(""),
        innerText: vitest_1.vi.fn().mockResolvedValue(""),
        innerHTML: vitest_1.vi.fn().mockResolvedValue(""),
        evaluate: vitest_1.vi.fn().mockResolvedValue(undefined),
        evaluateAll: vitest_1.vi.fn().mockResolvedValue([]),
        click: vitest_1.vi.fn().mockResolvedValue(undefined),
        fill: vitest_1.vi.fn().mockResolvedValue(undefined),
        check: vitest_1.vi.fn().mockResolvedValue(undefined),
        uncheck: vitest_1.vi.fn().mockResolvedValue(undefined),
        selectOption: vitest_1.vi.fn().mockResolvedValue(undefined),
        hover: vitest_1.vi.fn().mockResolvedValue(undefined),
        focus: vitest_1.vi.fn().mockResolvedValue(undefined),
        press: vitest_1.vi.fn().mockResolvedValue(undefined),
        type: vitest_1.vi.fn().mockResolvedValue(undefined),
        screenshot: vitest_1.vi.fn().mockResolvedValue(Buffer.from("")),
        scrollIntoViewIfNeeded: vitest_1.vi.fn().mockResolvedValue(undefined),
        waitFor: vitest_1.vi.fn().mockResolvedValue(undefined),
        boundingBox: vitest_1.vi.fn().mockResolvedValue(null),
        toString: vitest_1.vi.fn().mockReturnValue("Locator"),
        ...overrides,
    };
};
exports.createMockLocator = createMockLocator;
const createMockPage = (overrides) => {
    const mockLocator = (0, exports.createMockLocator)();
    return {
        goto: vitest_1.vi.fn().mockResolvedValue(undefined),
        url: vitest_1.vi.fn().mockReturnValue("https://example.com"),
        title: vitest_1.vi.fn().mockResolvedValue("Test Page"),
        locator: vitest_1.vi.fn().mockReturnValue(mockLocator),
        $: vitest_1.vi.fn().mockResolvedValue(null),
        $$: vitest_1.vi.fn().mockResolvedValue([]),
        evaluate: vitest_1.vi.fn().mockResolvedValue(undefined),
        evaluateHandle: vitest_1.vi.fn().mockResolvedValue(undefined),
        waitForSelector: vitest_1.vi.fn().mockResolvedValue(null),
        waitForTimeout: vitest_1.vi.fn().mockResolvedValue(undefined),
        waitForLoadState: vitest_1.vi.fn().mockResolvedValue(undefined),
        screenshot: vitest_1.vi.fn().mockResolvedValue(Buffer.from("")),
        close: vitest_1.vi.fn().mockResolvedValue(undefined),
        reload: vitest_1.vi.fn().mockResolvedValue(undefined),
        goBack: vitest_1.vi.fn().mockResolvedValue(undefined),
        goForward: vitest_1.vi.fn().mockResolvedValue(undefined),
        setViewportSize: vitest_1.vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
};
exports.createMockPage = createMockPage;
const createMockElement = (tag, attributes = {}) => {
    const element = {
        tagName: tag.toUpperCase(),
        getAttribute: (name) => attributes[name] || null,
        textContent: attributes.textContent || "",
        innerText: attributes.innerText || attributes.textContent || "",
        innerHTML: attributes.innerHTML || "",
        classList: {
            contains: (className) => (attributes.class || "").includes(className),
        },
        style: attributes.style || {},
        disabled: attributes.disabled || false,
        checked: attributes.checked || false,
        value: attributes.value || "",
        href: attributes.href || "",
        ...attributes,
    };
    return element;
};
exports.createMockElement = createMockElement;
//# sourceMappingURL=playwright.mock.js.map