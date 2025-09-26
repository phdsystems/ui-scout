/**
 * Abstract interface for page interaction
 * This allows the discovery system to work with ANY testing framework
 * (Playwright, Puppeteer, Selenium, Cypress, etc.)
 */
export interface IPageDriver {
  // Navigation
  goto(url: string, options?: any): Promise<void>;
  title(): Promise<string>;
  url(): string;

  // Element selection
  locator(selector: string): IElementHandle;

  // Waiting
  waitForTimeout(ms: number): Promise<void>;
}

export interface IElementHandle {
  // Element queries
  all(): Promise<IElementHandle[]>;
  first(): IElementHandle;
  count(): Promise<number>;

  // Element state
  isVisible(options?: { timeout?: number }): Promise<boolean>;
  isEnabled(): Promise<boolean>;

  // Element properties
  textContent(): Promise<string | null>;
  getAttribute(name: string): Promise<string | null>;
  evaluate<T>(fn: (element: Element) => T): Promise<T>;

  // Element actions
  click(): Promise<void>;
  hover(): Promise<void>;
  fill(value: string): Promise<void>;
  focus(): Promise<void>;
  selectOption(value: string): Promise<void>;
  check(): Promise<void>;
  uncheck(): Promise<void>;
  press(key: string): Promise<void>;
  screenshot(options?: any): Promise<void>;

  // Element traversal
  locator(selector: string): IElementHandle;
  allTextContents(): Promise<string[]>;
}

/**
 * Factory interface for creating page drivers
 */
export interface IPageDriverFactory {
  createDriver(page: any): IPageDriver;
}
