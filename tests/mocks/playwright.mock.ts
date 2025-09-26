import { vi } from "vitest";

export const createMockLocator = (overrides?: Partial<any>) => {
  return {
    count: vi.fn().mockResolvedValue(0),
    all: vi.fn().mockResolvedValue([]),
    first: vi.fn().mockReturnThis(),
    last: vi.fn().mockReturnThis(),
    nth: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    locator: vi.fn().mockReturnThis(),
    isVisible: vi.fn().mockResolvedValue(true),
    isEnabled: vi.fn().mockResolvedValue(true),
    isDisabled: vi.fn().mockResolvedValue(false),
    isChecked: vi.fn().mockResolvedValue(false),
    getAttribute: vi.fn().mockResolvedValue(null),
    textContent: vi.fn().mockResolvedValue(""),
    innerText: vi.fn().mockResolvedValue(""),
    innerHTML: vi.fn().mockResolvedValue(""),
    evaluate: vi.fn().mockResolvedValue(undefined),
    evaluateAll: vi.fn().mockResolvedValue([]),
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    check: vi.fn().mockResolvedValue(undefined),
    uncheck: vi.fn().mockResolvedValue(undefined),
    selectOption: vi.fn().mockResolvedValue(undefined),
    hover: vi.fn().mockResolvedValue(undefined),
    focus: vi.fn().mockResolvedValue(undefined),
    press: vi.fn().mockResolvedValue(undefined),
    type: vi.fn().mockResolvedValue(undefined),
    screenshot: vi.fn().mockResolvedValue(Buffer.from("")),
    scrollIntoViewIfNeeded: vi.fn().mockResolvedValue(undefined),
    waitFor: vi.fn().mockResolvedValue(undefined),
    boundingBox: vi.fn().mockResolvedValue(null),
    toString: vi.fn().mockReturnValue("Locator"),
    ...overrides,
  };
};

export const createMockPage = (overrides?: Partial<any>) => {
  const mockLocator = createMockLocator();

  return {
    goto: vi.fn().mockResolvedValue(undefined),
    url: vi.fn().mockReturnValue("https://example.com"),
    title: vi.fn().mockResolvedValue("Test Page"),
    locator: vi.fn().mockReturnValue(mockLocator),
    $: vi.fn().mockResolvedValue(null),
    $$: vi.fn().mockResolvedValue([]),
    $$eval: vi.fn().mockResolvedValue([]),
    $eval: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(undefined),
    evaluateHandle: vi.fn().mockResolvedValue(undefined),
    waitForSelector: vi.fn().mockResolvedValue(null),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    waitForLoadState: vi.fn().mockResolvedValue(undefined),
    screenshot: vi.fn().mockResolvedValue(Buffer.from("")),
    close: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    goBack: vi.fn().mockResolvedValue(undefined),
    goForward: vi.fn().mockResolvedValue(undefined),
    setViewportSize: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
};

export const createMockElement = (tag: string, attributes: Record<string, any> = {}) => {
  const element = {
    tagName: tag.toUpperCase(),
    getAttribute: (name: string) => attributes[name] || null,
    textContent: attributes.textContent || "",
    innerText: attributes.innerText || attributes.textContent || "",
    innerHTML: attributes.innerHTML || "",
    classList: {
      contains: (className: string) => (attributes.class || "").includes(className),
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
