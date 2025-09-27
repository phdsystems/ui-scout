import { vi } from "vitest";

const createBaseMockLocator = () => ({
  getAttribute: vi.fn(() => Promise.resolve(null)),
  textContent: vi.fn(() => Promise.resolve("")),
  evaluate: vi.fn(),
  evaluateAll: vi.fn(() => Promise.resolve([])),
  locator: vi.fn((_selector: string) => createBaseMockLocator()),
  first: vi.fn(() => createBaseMockLocator()),
  last: vi.fn(() => createBaseMockLocator()),
  nth: vi.fn(() => createBaseMockLocator()),
  count: vi.fn(() => Promise.resolve(0)),
  all: vi.fn(() => Promise.resolve([])),
  isVisible: vi.fn(() => Promise.resolve(true)),
  isEnabled: vi.fn(() => Promise.resolve(true)),
  click: vi.fn(),
  fill: vi.fn(),
  toString: vi.fn(() => "MockLocator"),
});

export const mockPage = {
  goto: vi.fn(),
  waitForSelector: vi.fn(),
  click: vi.fn(),
  fill: vi.fn(),
  evaluate: vi.fn(),
  screenshot: vi.fn(),
  close: vi.fn(),
  $: vi.fn(),
  $$: vi.fn(),
  $eval: vi.fn(),
  $$eval: vi.fn(),
  content: vi.fn(),
  title: vi.fn(),
  url: vi.fn(),
  waitForTimeout: vi.fn(),
  waitForLoadState: vi.fn(),
  locator: vi.fn((_selector: string) => createBaseMockLocator()),
  getByRole: vi.fn(),
  getByText: vi.fn(),
  getByLabel: vi.fn(),
  getByPlaceholder: vi.fn(),
  getByAltText: vi.fn(),
  getByTitle: vi.fn(),
  getByTestId: vi.fn(),
};

export const mockBrowser = {
  newPage: vi.fn(() => Promise.resolve(mockPage)),
  newContext: vi.fn(() =>
    Promise.resolve({
      newPage: vi.fn(() => Promise.resolve(mockPage)),
      close: vi.fn(),
    }),
  ),
  close: vi.fn(),
  contexts: vi.fn(() => []),
  isConnected: vi.fn(() => true),
  version: vi.fn(() => "mock-version"),
};

export const chromium = {
  launch: vi.fn(() => Promise.resolve(mockBrowser)),
  connect: vi.fn(() => Promise.resolve(mockBrowser)),
};

export const firefox = chromium;
export const webkit = chromium;

export const createMockPage = () => ({
  ...mockPage,
  locator: vi.fn((_selector: string) => createBaseMockLocator()),
  $: vi.fn(),
  $$: vi.fn(() => Promise.resolve([])),
  evaluate: vi.fn((fn: any) => {
    if (typeof fn === "function") {
      return Promise.resolve(fn());
    }
    return Promise.resolve(undefined);
  }),
  evaluateHandle: vi.fn(),
  waitForSelector: vi.fn(),
  goto: vi.fn(),
  url: vi.fn(() => "http://localhost"),
  content: vi.fn(() => Promise.resolve("<html></html>")),
  title: vi.fn(() => Promise.resolve("Test Page")),
});

export const createMockElement = (overrides = {}) => ({
  textContent: vi.fn(() => Promise.resolve("Test")),
  getAttribute: vi.fn(() => Promise.resolve(null)),
  getProperty: vi.fn(() => Promise.resolve(null)),
  evaluate: vi.fn(),
  click: vi.fn(),
  fill: vi.fn(),
  isVisible: vi.fn(() => Promise.resolve(true)),
  isEnabled: vi.fn(() => Promise.resolve(true)),
  ...overrides,
});

export const createMockLocator = (overrides = {}) => ({
  getAttribute: vi.fn(() => Promise.resolve(null)),
  textContent: vi.fn(() => Promise.resolve("")),
  evaluate: vi.fn(),
  evaluateAll: vi.fn(() => Promise.resolve([])),
  locator: vi.fn((_selector: string) => createMockLocator()),
  first: vi.fn(() => createMockLocator()),
  last: vi.fn(() => createMockLocator()),
  nth: vi.fn(() => createMockLocator()),
  count: vi.fn(() => Promise.resolve(0)),
  all: vi.fn(() => Promise.resolve([])),
  isVisible: vi.fn(() => Promise.resolve(true)),
  isEnabled: vi.fn(() => Promise.resolve(true)),
  click: vi.fn(),
  fill: vi.fn(),
  toString: vi.fn(() => "MockLocator"),
  ...overrides,
});

export const mockPlaywright = {
  chromium,
  firefox,
  webkit,
};

export default mockPlaywright;
