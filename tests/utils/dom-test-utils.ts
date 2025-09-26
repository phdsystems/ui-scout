import { JSDOM } from "jsdom";
import { vi } from "vitest";

/**
 * Creates a mock Playwright page with real DOM from HTML fixture
 */
export function createMockPageWithDOM(htmlFixture: string) {
  const dom = new JSDOM(htmlFixture, {
    url: "http://localhost:3000",
    pretendToBeVisual: true,
  });

  const document = dom.window.document;

  // Helper to convert NodeList to array with element properties
  const elementsToProps = (elements: NodeListOf<Element>) => {
    return Array.from(elements).map((el) => {
      const htmlEl = el as HTMLElement;
      const inputEl = el as HTMLInputElement;
      const selectEl = el as HTMLSelectElement;
      const buttonEl = el as HTMLButtonElement;

      return {
        tagName: el.tagName,
        id: el.id || undefined,
        className: el.className || undefined,
        textContent: htmlEl.textContent?.trim() || undefined,
        innerText: htmlEl.innerText?.trim() || htmlEl.textContent?.trim() || undefined,
        placeholder: inputEl.placeholder || undefined,
        type: inputEl.type || buttonEl.type || undefined,
        value: inputEl.value || selectEl.value || undefined,
        href: (el as HTMLAnchorElement).href || undefined,
        role: el.getAttribute("role") || undefined,
        title: el.getAttribute("title") || undefined,
        ariaLabel: el.getAttribute("aria-label") || undefined,
        ariaSelected: el.getAttribute("aria-selected") || undefined,
        dataset: (el as HTMLElement).dataset || {},
        getAttribute: (attr: string) => el.getAttribute(attr),
        hasAttribute: (attr: string) => el.hasAttribute(attr),
        children: Array.from(el.children),
      };
    });
  };

  // Create mock page object
  const mockPage = {
    url: vi.fn().mockReturnValue("http://localhost:3000"),

    $: vi.fn().mockImplementation((selector: string) => {
      const element = document.querySelector(selector);
      return Promise.resolve(element ? createMockElement(element) : null);
    }),

    $$: vi.fn().mockImplementation((selector: string) => {
      const elements = document.querySelectorAll(selector);
      return Promise.resolve(Array.from(elements).map(createMockElement));
    }),

    $$eval: vi
      .fn()
      .mockImplementation((selector: string, fn: (...args: any[]) => any, ...args: any[]) => {
        const elements = document.querySelectorAll(selector);
        const elementProps = elementsToProps(elements);
        return Promise.resolve(fn(elementProps, ...args));
      }),

    $eval: vi
      .fn()
      .mockImplementation((selector: string, fn: (...args: any[]) => any, ...args: any[]) => {
        const element = document.querySelector(selector);
        if (!element) return Promise.resolve(null);
        const props = elementsToProps(document.querySelectorAll(selector))[0];
        return Promise.resolve(fn(props, ...args));
      }),

    evaluate: vi.fn().mockImplementation((fn: (...args: any[]) => any, ...args: any[]) => {
      // Simple evaluate for testing
      if (typeof fn === "function") {
        const fnStr = fn.toString();
        if (fnStr.includes("document.querySelectorAll")) {
          // Handle discovery patterns
          return Promise.resolve(fn());
        }
      }
      return Promise.resolve(fn(...args));
    }),

    locator: vi.fn().mockImplementation((selector: string) => {
      const elements = document.querySelectorAll(selector);
      return createMockLocator(elements);
    }),

    waitForLoadState: vi.fn().mockResolvedValue(undefined),
    waitForSelector: vi.fn().mockImplementation((selector: string) => {
      const element = document.querySelector(selector);
      return Promise.resolve(element ? createMockElement(element) : null);
    }),

    goto: vi.fn().mockResolvedValue(undefined),

    // Add DOM access for tests
    _document: document,
    _dom: dom,
  };

  return mockPage;
}

function createMockElement(element: Element) {
  const htmlEl = element as HTMLElement;
  const inputEl = element as HTMLInputElement;

  return {
    textContent: vi.fn().mockResolvedValue(htmlEl.textContent),
    innerText: vi.fn().mockResolvedValue(htmlEl.innerText || htmlEl.textContent),
    getAttribute: vi
      .fn()
      .mockImplementation((attr: string) => Promise.resolve(element.getAttribute(attr))),
    isVisible: vi.fn().mockResolvedValue(true),
    isEnabled: vi.fn().mockResolvedValue(true),
    inputValue: vi.fn().mockResolvedValue(inputEl.value || ""),
    evaluate: vi.fn().mockImplementation((fn: (...args: any[]) => any) => {
      return Promise.resolve(fn(element));
    }),
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(1),
  };
}

function createMockLocator(elements: NodeListOf<Element>) {
  const elementArray = Array.from(elements);

  return {
    count: vi.fn().mockResolvedValue(elementArray.length),
    all: vi.fn().mockResolvedValue(elementArray.map(createMockElement)),
    first: vi.fn().mockReturnValue(createMockElement(elementArray[0])),
    last: vi.fn().mockReturnValue(createMockElement(elementArray[elementArray.length - 1])),
    nth: vi.fn().mockImplementation((index: number) => createMockElement(elementArray[index])),
    evaluate: vi.fn().mockImplementation((fn: (...args: any[]) => any) => {
      return Promise.resolve(elementArray.map((el) => fn(el)));
    }),
    evaluateAll: vi.fn().mockImplementation((fn: (...args: any[]) => any) => {
      return Promise.resolve(elementArray.map((el) => fn(el)));
    }),
  };
}

/**
 * Helper to count elements by type in DOM
 */
export function countElementsByType(mockPage: any, type: string): number {
  const document = mockPage._document;
  let selector = "";

  switch (type) {
    case "button":
      selector =
        'button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"]';
      break;
    case "input":
      selector =
        'input:not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select';
      break;
    case "navigation":
      selector = 'nav, [role="navigation"], [role="menu"], [role="menubar"], [role="tablist"]';
      break;
    default:
      selector = type;
  }

  return document.querySelectorAll(selector).length;
}
