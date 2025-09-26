/**
 * Example Puppeteer adapter showing how the system can work with Puppeteer
 * This demonstrates the system's framework independence
 */
import type { IPageDriver, IElementHandle } from "../interfaces/IPageDriver";

// Types would come from: import { Page, ElementHandle } from 'puppeteer';
type PuppeteerPage = any; // Replace with actual Puppeteer Page type

export class PuppeteerPageDriver implements IPageDriver {
  constructor(private page: PuppeteerPage) {}

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
    return new PuppeteerElementAdapter(this.page, selector);
  }

  async waitForTimeout(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }
}

class PuppeteerElementAdapter implements IElementHandle {
  constructor(
    private page: PuppeteerPage,
    private selector: string,
  ) {}

  async all(): Promise<IElementHandle[]> {
    const elements = await this.page.$$(this.selector);
    return elements.map(
      (_: any, index: number) =>
        new PuppeteerElementAdapter(this.page, `${this.selector}:nth-of-type(${index + 1})`),
    );
  }

  first(): IElementHandle {
    return new PuppeteerElementAdapter(this.page, `${this.selector}:first-of-type`);
  }

  async count(): Promise<number> {
    const elements = await this.page.$$(this.selector);
    return elements.length;
  }

  async isVisible(options?: { timeout?: number }): Promise<boolean> {
    try {
      await this.page.waitForSelector(this.selector, {
        visible: true,
        timeout: options?.timeout || 1000,
      });
      return true;
    } catch {
      return false;
    }
  }

  async isEnabled(): Promise<boolean> {
    return await this.page.$eval(this.selector, (el: any) => !el.disabled);
  }

  async textContent(): Promise<string | null> {
    return await this.page.$eval(this.selector, (el: any) => el.textContent);
  }

  async getAttribute(name: string): Promise<string | null> {
    return await this.page.$eval(
      this.selector,
      (el: any, attr: string) => el.getAttribute(attr),
      name,
    );
  }

  async evaluate<T>(fn: (element: Element) => T): Promise<T> {
    return await this.page.$eval(this.selector, fn);
  }

  async click(): Promise<void> {
    await this.page.click(this.selector);
  }

  async hover(): Promise<void> {
    await this.page.hover(this.selector);
  }

  async fill(value: string): Promise<void> {
    await this.page.type(this.selector, value);
  }

  async focus(): Promise<void> {
    await this.page.focus(this.selector);
  }

  async selectOption(value: string): Promise<void> {
    await this.page.select(this.selector, value);
  }

  async check(): Promise<void> {
    const element = await this.page.$(this.selector);
    const isChecked = await element?.getProperty("checked");
    if (!isChecked) {
      await this.click();
    }
  }

  async uncheck(): Promise<void> {
    const element = await this.page.$(this.selector);
    const isChecked = await element?.getProperty("checked");
    if (isChecked) {
      await this.click();
    }
  }

  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async screenshot(options?: any): Promise<void> {
    const element = await this.page.$(this.selector);
    await element?.screenshot(options);
  }

  locator(selector: string): IElementHandle {
    return new PuppeteerElementAdapter(this.page, `${this.selector} ${selector}`);
  }

  async allTextContents(): Promise<string[]> {
    return await this.page.$$eval(this.selector, (elements: any[]) =>
      elements.map((el) => el.textContent || ""),
    );
  }
}
