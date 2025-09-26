import type { Page, Locator } from "@playwright/test";
import type { IPageDriver, IElementHandle } from "../interfaces/IPageDriver";

/**
 * Playwright adapter that implements the IPageDriver interface
 * This allows Playwright to work with the generic discovery system
 */
export class PlaywrightPageDriver implements IPageDriver {
  constructor(private page: Page) {}

  async goto(url: string, options?: any): Promise<void> {
    await this.page.goto(url, options);
  }

  async title(): Promise<string> {
    return await this.page.title();
  }

  url(): string {
    return this.page.url();
  }

  locator(selector: string): IElementHandle {
    return new PlaywrightElementHandle(this.page.locator(selector));
  }

  async waitForTimeout(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }
}

class PlaywrightElementHandle implements IElementHandle {
  constructor(private _locator: Locator) {}

  async all(): Promise<IElementHandle[]> {
    const elements = await this._locator.all();
    return elements.map((el) => new PlaywrightElementHandle(el));
  }

  first(): IElementHandle {
    return new PlaywrightElementHandle(this._locator.first());
  }

  async count(): Promise<number> {
    return await this._locator.count();
  }

  async isVisible(options?: { timeout?: number }): Promise<boolean> {
    try {
      return await this._locator.isVisible(options);
    } catch {
      return false;
    }
  }

  async isEnabled(): Promise<boolean> {
    return await this._locator.isEnabled();
  }

  async textContent(): Promise<string | null> {
    return await this._locator.textContent();
  }

  async getAttribute(name: string): Promise<string | null> {
    return await this._locator.getAttribute(name);
  }

  async evaluate<T>(fn: (element: Element) => T): Promise<T> {
    return await this._locator.evaluate(fn);
  }

  async click(): Promise<void> {
    await this._locator.click();
  }

  async hover(): Promise<void> {
    await this._locator.hover();
  }

  async fill(value: string): Promise<void> {
    await this._locator.fill(value);
  }

  async focus(): Promise<void> {
    await this._locator.focus();
  }

  async selectOption(value: string): Promise<void> {
    await this._locator.selectOption(value);
  }

  async check(): Promise<void> {
    await this._locator.check();
  }

  async uncheck(): Promise<void> {
    await this._locator.uncheck();
  }

  async press(key: string): Promise<void> {
    await this._locator.press(key);
  }

  async screenshot(options?: any): Promise<void> {
    await this._locator.screenshot(options);
  }

  locator(selector: string): IElementHandle {
    return new PlaywrightElementHandle(this._locator.locator(selector));
  }

  async allTextContents(): Promise<string[]> {
    return await this._locator.allTextContents();
  }
}
