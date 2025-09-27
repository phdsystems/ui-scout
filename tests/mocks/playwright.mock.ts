import { vi } from 'vitest';

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
  locator: vi.fn(),
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
  newContext: vi.fn(() => Promise.resolve({
    newPage: vi.fn(() => Promise.resolve(mockPage)),
    close: vi.fn(),
  })),
  close: vi.fn(),
  contexts: vi.fn(() => []),
  isConnected: vi.fn(() => true),
  version: vi.fn(() => 'mock-version'),
};

export const chromium = {
  launch: vi.fn(() => Promise.resolve(mockBrowser)),
  connect: vi.fn(() => Promise.resolve(mockBrowser)),
};

export const firefox = chromium;
export const webkit = chromium;

export const mockPlaywright = {
  chromium,
  firefox,
  webkit,
};

export default mockPlaywright;