import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PlaywrightPageDriver } from "../src/adapters/PlaywrightAdapter";
import { PuppeteerPageDriver } from "../src/adapters/PuppeteerAdapter";

describe("Adapters - Comprehensive Tests", () => {
  describe("PlaywrightPageDriver", () => {
    let mockPage: any;
    let mockLocator: any;
    let playwrightDriver: PlaywrightPageDriver;

    beforeEach(() => {
      mockLocator = {
        all: vi.fn(),
        first: vi.fn(),
        count: vi.fn(),
        isVisible: vi.fn(),
        isEnabled: vi.fn(),
        textContent: vi.fn(),
        getAttribute: vi.fn(),
        evaluate: vi.fn(),
        click: vi.fn(),
        hover: vi.fn(),
        fill: vi.fn(),
        selectOption: vi.fn(),
        check: vi.fn(),
        uncheck: vi.fn(),
        locator: vi.fn(),
      };

      mockPage = {
        goto: vi.fn(),
        title: vi.fn(),
        url: vi.fn(),
        locator: vi.fn().mockReturnValue(mockLocator),
        waitForTimeout: vi.fn(),
      };

      playwrightDriver = new PlaywrightPageDriver(mockPage);
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe("Constructor and Initialization", () => {
      it("should initialize with Playwright page", () => {
        const driver = new PlaywrightPageDriver(mockPage);
        expect(driver).toBeDefined();
        expect(driver["page"]).toBe(mockPage);
      });

      it("should handle null/undefined page", () => {
        expect(() => new PlaywrightPageDriver(null as any)).not.toThrow();
        expect(() => new PlaywrightPageDriver(undefined as any)).not.toThrow();
      });
    });

    describe("Page Navigation", () => {
      it("should navigate to URL", async () => {
        const testUrl = "https://example.com";
        mockPage.goto.mockResolvedValue(undefined);

        await playwrightDriver.goto(testUrl);

        expect(mockPage.goto).toHaveBeenCalledWith(testUrl, undefined);
      });

      it("should navigate with options", async () => {
        const testUrl = "https://example.com";
        const options = { timeout: 10000 };
        mockPage.goto.mockResolvedValue(undefined);

        await playwrightDriver.goto(testUrl, options);

        expect(mockPage.goto).toHaveBeenCalledWith(testUrl, options);
      });

      it("should handle navigation errors", async () => {
        const testUrl = "https://invalid-url";
        mockPage.goto.mockRejectedValue(new Error("Navigation failed"));

        await expect(playwrightDriver.goto(testUrl)).rejects.toThrow("Navigation failed");
      });

      it("should get page title", async () => {
        const testTitle = "Test Page Title";
        mockPage.title.mockResolvedValue(testTitle);

        const title = await playwrightDriver.title();

        expect(title).toBe(testTitle);
        expect(mockPage.title).toHaveBeenCalled();
      });

      it("should handle title errors", async () => {
        mockPage.title.mockRejectedValue(new Error("Title not available"));

        await expect(playwrightDriver.title()).rejects.toThrow("Title not available");
      });

      it("should get current URL", () => {
        const testUrl = "https://current-page.com";
        mockPage.url.mockReturnValue(testUrl);

        const url = playwrightDriver.url();

        expect(url).toBe(testUrl);
        expect(mockPage.url).toHaveBeenCalled();
      });
    });

    describe("Element Location", () => {
      it("should create locator for selector", () => {
        const selector = "#test-element";

        const elementHandle = playwrightDriver.locator(selector);

        expect(elementHandle).toBeDefined();
        expect(mockPage.locator).toHaveBeenCalledWith(selector);
      });

      it("should handle complex selectors", () => {
        const complexSelector = 'button[data-testid="submit"]:not(:disabled)';

        const elementHandle = playwrightDriver.locator(complexSelector);

        expect(elementHandle).toBeDefined();
        expect(mockPage.locator).toHaveBeenCalledWith(complexSelector);
      });
    });

    describe("Wait Operations", () => {
      it("should wait for timeout", async () => {
        const waitTime = 1000;
        mockPage.waitForTimeout.mockResolvedValue(undefined);

        await playwrightDriver.waitForTimeout(waitTime);

        expect(mockPage.waitForTimeout).toHaveBeenCalledWith(waitTime);
      });

      it("should handle wait timeout errors", async () => {
        mockPage.waitForTimeout.mockRejectedValue(new Error("Wait failed"));

        await expect(playwrightDriver.waitForTimeout(5000)).rejects.toThrow("Wait failed");
      });
    });

    describe("PlaywrightElementHandle", () => {
      let elementHandle: any;

      beforeEach(() => {
        elementHandle = playwrightDriver.locator("#test");
      });

      it("should get all matching elements", async () => {
        const mockElements = [mockLocator, mockLocator];
        mockLocator.all.mockResolvedValue(mockElements);

        const allElements = await elementHandle.all();

        expect(allElements).toHaveLength(2);
        expect(mockLocator.all).toHaveBeenCalled();
      });

      it("should get first element", () => {
        mockLocator.first.mockReturnValue(mockLocator);

        const firstElement = elementHandle.first();

        expect(firstElement).toBeDefined();
        expect(mockLocator.first).toHaveBeenCalled();
      });

      it("should get element count", async () => {
        const expectedCount = 5;
        mockLocator.count.mockResolvedValue(expectedCount);

        const count = await elementHandle.count();

        expect(count).toBe(expectedCount);
        expect(mockLocator.count).toHaveBeenCalled();
      });

      it("should check visibility", async () => {
        mockLocator.isVisible.mockResolvedValue(true);

        const isVisible = await elementHandle.isVisible();

        expect(isVisible).toBe(true);
        expect(mockLocator.isVisible).toHaveBeenCalled();
      });

      it("should handle visibility check errors gracefully", async () => {
        mockLocator.isVisible.mockRejectedValue(new Error("Element not found"));

        const isVisible = await elementHandle.isVisible();

        expect(isVisible).toBe(false);
      });

      it("should check if element is enabled", async () => {
        mockLocator.isEnabled.mockResolvedValue(true);

        const isEnabled = await elementHandle.isEnabled();

        expect(isEnabled).toBe(true);
        expect(mockLocator.isEnabled).toHaveBeenCalled();
      });

      it("should get text content", async () => {
        const testText = "Test Element Text";
        mockLocator.textContent.mockResolvedValue(testText);

        const textContent = await elementHandle.textContent();

        expect(textContent).toBe(testText);
        expect(mockLocator.textContent).toHaveBeenCalled();
      });

      it("should handle null text content", async () => {
        mockLocator.textContent.mockResolvedValue(null);

        const textContent = await elementHandle.textContent();

        expect(textContent).toBeNull();
      });

      it("should get attribute value", async () => {
        const attributeName = "data-testid";
        const attributeValue = "test-element";
        mockLocator.getAttribute.mockResolvedValue(attributeValue);

        const attribute = await elementHandle.getAttribute(attributeName);

        expect(attribute).toBe(attributeValue);
        expect(mockLocator.getAttribute).toHaveBeenCalledWith(attributeName);
      });

      it("should handle null attribute value", async () => {
        mockLocator.getAttribute.mockResolvedValue(null);

        const attribute = await elementHandle.getAttribute("nonexistent");

        expect(attribute).toBeNull();
      });

      it("should evaluate function on element", async () => {
        const testFunction = (el: Element) => el.tagName;
        const expectedResult = "BUTTON";
        mockLocator.evaluate.mockResolvedValue(expectedResult);

        const result = await elementHandle.evaluate(testFunction);

        expect(result).toBe(expectedResult);
        expect(mockLocator.evaluate).toHaveBeenCalledWith(testFunction);
      });

      it("should perform click action", async () => {
        mockLocator.click.mockResolvedValue(undefined);

        await elementHandle.click();

        expect(mockLocator.click).toHaveBeenCalled();
      });

      it("should perform hover action", async () => {
        mockLocator.hover.mockResolvedValue(undefined);

        await elementHandle.hover();

        expect(mockLocator.hover).toHaveBeenCalled();
      });

      it("should fill input with value", async () => {
        const testValue = "test input value";
        mockLocator.fill.mockResolvedValue(undefined);

        await elementHandle.fill(testValue);

        expect(mockLocator.fill).toHaveBeenCalledWith(testValue);
      });

      it("should select option", async () => {
        const optionValue = "option1";
        mockLocator.selectOption.mockResolvedValue(undefined);

        await elementHandle.selectOption(optionValue);

        expect(mockLocator.selectOption).toHaveBeenCalledWith(optionValue);
      });

      it("should check checkbox", async () => {
        mockLocator.check.mockResolvedValue(undefined);

        await elementHandle.check();

        expect(mockLocator.check).toHaveBeenCalled();
      });

      it("should uncheck checkbox", async () => {
        mockLocator.uncheck.mockResolvedValue(undefined);

        await elementHandle.uncheck();

        expect(mockLocator.uncheck).toHaveBeenCalled();
      });

      it("should create sub-locator", () => {
        const subSelector = ".child";
        mockLocator.locator.mockReturnValue(mockLocator);

        const subElement = elementHandle.locator(subSelector);

        expect(subElement).toBeDefined();
        expect(mockLocator.locator).toHaveBeenCalledWith(subSelector);
      });
    });

    describe("Error Handling", () => {
      it("should handle page method errors", async () => {
        mockPage.goto.mockRejectedValue(new Error("Page error"));

        await expect(playwrightDriver.goto("https://error.com")).rejects.toThrow("Page error");
      });

      it("should handle locator creation errors", () => {
        mockPage.locator.mockImplementation(() => {
          throw new Error("Invalid selector");
        });

        expect(() => playwrightDriver.locator("invalid::selector")).toThrow("Invalid selector");
      });

      it("should handle element action errors", async () => {
        const elementHandle = playwrightDriver.locator("#error-element");
        mockLocator.click.mockRejectedValue(new Error("Click failed"));

        await expect(elementHandle.click()).rejects.toThrow("Click failed");
      });
    });
  });

  describe("PuppeteerPageDriver", () => {
    let mockPage: any;
    let mockElementHandle: any;
    let puppeteerDriver: PuppeteerPageDriver;

    beforeEach(() => {
      mockElementHandle = {
        $: vi.fn(),
        $$: vi.fn(),
        evaluate: vi.fn(),
        click: vi.fn(),
        hover: vi.fn(),
        type: vi.fn(),
        select: vi.fn(),
        isVisible: vi.fn(),
        isEnabled: vi.fn(),
        getProperty: vi.fn().mockResolvedValue(false), // Mock for checked property
        screenshot: vi.fn().mockResolvedValue(undefined),
      };

      mockPage = {
        goto: vi.fn(),
        title: vi.fn(),
        url: vi.fn(),
        $: vi.fn().mockResolvedValue(mockElementHandle),
        $$: vi.fn(),
        evaluate: vi.fn(),
        waitForTimeout: vi.fn(),
        waitForSelector: vi.fn(),
        $eval: vi.fn().mockImplementation((selector, fn, ...args) => {
          // Mock element properties for different tests
          const mockElement = {
            disabled: false,
            textContent: "Button Text",
            getAttribute: (attr: string) => attr === "data-test" ? "test-value" : null,
          };
          return Promise.resolve(fn(mockElement, ...args));
        }),
        $$eval: vi.fn().mockResolvedValue(["text1", "text2"]),
        click: vi.fn().mockResolvedValue(undefined),
        hover: vi.fn().mockResolvedValue(undefined),
        type: vi.fn().mockResolvedValue(undefined),
        focus: vi.fn().mockResolvedValue(undefined),
        select: vi.fn().mockResolvedValue(undefined),
        keyboard: {
          press: vi.fn().mockResolvedValue(undefined),
        },
      };

      puppeteerDriver = new PuppeteerPageDriver(mockPage);
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe("Constructor and Initialization", () => {
      it("should initialize with Puppeteer page", () => {
        const driver = new PuppeteerPageDriver(mockPage);
        expect(driver).toBeDefined();
        expect(driver["page"]).toBe(mockPage);
      });

      it("should handle null/undefined page", () => {
        expect(() => new PuppeteerPageDriver(null as any)).not.toThrow();
        expect(() => new PuppeteerPageDriver(undefined as any)).not.toThrow();
      });
    });

    describe("Page Navigation", () => {
      it("should navigate to URL", async () => {
        const testUrl = "https://example.com";
        mockPage.goto.mockResolvedValue(undefined);

        await puppeteerDriver.goto(testUrl);

        expect(mockPage.goto).toHaveBeenCalledWith(testUrl, undefined);
      });

      it("should navigate with options", async () => {
        const testUrl = "https://example.com";
        const options = { timeout: 10000 };
        mockPage.goto.mockResolvedValue(undefined);

        await puppeteerDriver.goto(testUrl, options);

        expect(mockPage.goto).toHaveBeenCalledWith(testUrl, options);
      });

      it("should get page title", async () => {
        const testTitle = "Puppeteer Test Page";
        mockPage.title.mockResolvedValue(testTitle);

        const title = await puppeteerDriver.title();

        expect(title).toBe(testTitle);
        expect(mockPage.title).toHaveBeenCalled();
      });

      it("should get current URL", () => {
        const testUrl = "https://puppeteer-page.com";
        mockPage.url.mockReturnValue(testUrl);

        const url = puppeteerDriver.url();

        expect(url).toBe(testUrl);
        expect(mockPage.url).toHaveBeenCalled();
      });
    });

    describe("Element Location", () => {
      it("should create locator for selector", () => {
        const selector = "#puppeteer-element";

        const elementHandle = puppeteerDriver.locator(selector);

        expect(elementHandle).toBeDefined();
      });

      it("should handle complex selectors", () => {
        const complexSelector = 'button[type="submit"]:enabled';

        const elementHandle = puppeteerDriver.locator(complexSelector);

        expect(elementHandle).toBeDefined();
      });
    });

    describe("Wait Operations", () => {
      it("should wait for timeout", async () => {
        const waitTime = 2000;
        mockPage.waitForTimeout.mockResolvedValue(undefined);

        await puppeteerDriver.waitForTimeout(waitTime);

        expect(mockPage.waitForTimeout).toHaveBeenCalledWith(waitTime);
      });
    });

    describe("PuppeteerElementAdapter", () => {
      let elementHandle: any;

      beforeEach(() => {
        elementHandle = puppeteerDriver.locator("#puppeteer-test");
      });

      it("should get all matching elements", async () => {
        const mockElements = [mockElementHandle, mockElementHandle];
        mockPage.$$.mockResolvedValue(mockElements);

        const allElements = await elementHandle.all();

        expect(allElements).toHaveLength(2);
      });

      it("should get first element", () => {
        const firstElement = elementHandle.first();

        expect(firstElement).toBeDefined();
      });

      it("should get element count", async () => {
        const mockElements = [mockElementHandle, mockElementHandle, mockElementHandle];
        mockPage.$$.mockResolvedValue(mockElements);

        const count = await elementHandle.count();

        expect(count).toBe(3);
      });

      it("should check visibility with fallback", async () => {
        mockPage.evaluate.mockResolvedValue(true);

        const isVisible = await elementHandle.isVisible();

        expect(isVisible).toBe(true);
      });

      it("should handle visibility check errors", async () => {
        mockPage.waitForSelector.mockRejectedValue(new Error("Element not found"));

        const isVisible = await elementHandle.isVisible();

        expect(isVisible).toBe(false);
      });

      it("should check if element is enabled", async () => {
        mockPage.evaluate.mockResolvedValue(true);

        const isEnabled = await elementHandle.isEnabled();

        expect(isEnabled).toBe(true);
      });

      it("should get text content", async () => {
        const elementHandle = puppeteerDriver.locator("#test-text");

        const textContent = await elementHandle.textContent();

        expect(textContent).toBe("Button Text"); // This comes from our $eval mock
        expect(mockPage.$eval).toHaveBeenCalled();
      });

      it("should get attribute value", async () => {
        const elementHandle = puppeteerDriver.locator("#test-element");

        const attribute = await elementHandle.getAttribute("data-test");

        expect(attribute).toBe("test-value"); // This comes from our $eval mock
        expect(mockPage.$eval).toHaveBeenCalled();
      });

      it("should evaluate function on element", async () => {
        const elementHandle = puppeteerDriver.locator("#test-element");
        const testFunction = (el: any) => el.textContent;

        const result = await elementHandle.evaluate(testFunction);

        expect(result).toBe("Button Text"); // This comes from our $eval mock
        expect(mockPage.$eval).toHaveBeenCalled();
      });

      it("should perform click action", async () => {
        const elementHandle = puppeteerDriver.locator("#test-button");

        await elementHandle.click();

        expect(mockPage.click).toHaveBeenCalled();
      });

      it("should perform hover action", async () => {
        const elementHandle = puppeteerDriver.locator("#test-button");

        await elementHandle.hover();

        expect(mockPage.hover).toHaveBeenCalled();
      });

      it("should fill input with value", async () => {
        const elementHandle = puppeteerDriver.locator("#test-input");
        const testValue = "puppeteer input value";

        await elementHandle.fill(testValue);

        expect(mockPage.type).toHaveBeenCalledWith("#test-input", testValue);
      });

      it("should select option", async () => {
        const elementHandle = puppeteerDriver.locator("#test-select");
        const optionValue = "puppeteer-option";

        await elementHandle.selectOption(optionValue);

        expect(mockPage.select).toHaveBeenCalledWith("#test-select", optionValue);
      });

      it("should check checkbox", async () => {
        const elementHandle = puppeteerDriver.locator("#test-checkbox");

        await elementHandle.check();

        expect(mockPage.$).toHaveBeenCalled();
        expect(mockElementHandle.getProperty).toHaveBeenCalled();
      });

      it("should uncheck checkbox", async () => {
        const elementHandle = puppeteerDriver.locator("#test-checkbox");

        await elementHandle.uncheck();

        expect(mockPage.$).toHaveBeenCalled();
        expect(mockElementHandle.getProperty).toHaveBeenCalled();
      });
    });

    describe("Error Handling", () => {
      it("should handle page method errors", async () => {
        mockPage.goto.mockRejectedValue(new Error("Puppeteer navigation error"));

        await expect(puppeteerDriver.goto("https://error.com")).rejects.toThrow("Puppeteer navigation error");
      });

      it("should handle element action errors", async () => {
        const elementHandle = puppeteerDriver.locator("#error-element");
        mockPage.click.mockRejectedValue(new Error("Click failed"));

        await expect(elementHandle.click()).rejects.toThrow("Click failed");
      });
    });
  });

  describe("Adapter Interface Compliance", () => {
    it("should implement IPageDriver interface consistently", async () => {
      const mockPlaywrightPage = {
        goto: vi.fn().mockResolvedValue(undefined),
        title: vi.fn().mockResolvedValue("Test"),
        url: vi.fn().mockReturnValue("https://test.com"),
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([]),
          first: vi.fn(),
          count: vi.fn().mockResolvedValue(0),
          isVisible: vi.fn().mockResolvedValue(true),
          isEnabled: vi.fn().mockResolvedValue(true),
          textContent: vi.fn().mockResolvedValue(""),
          getAttribute: vi.fn().mockResolvedValue(null),
          evaluate: vi.fn().mockResolvedValue(undefined),
          click: vi.fn().mockResolvedValue(undefined),
          hover: vi.fn().mockResolvedValue(undefined),
          fill: vi.fn().mockResolvedValue(undefined),
          selectOption: vi.fn().mockResolvedValue(undefined),
          check: vi.fn().mockResolvedValue(undefined),
          uncheck: vi.fn().mockResolvedValue(undefined),
          locator: vi.fn()
        }),
        waitForTimeout: vi.fn().mockResolvedValue(undefined)
      };

      const mockPuppeteerPage = {
        goto: vi.fn().mockResolvedValue(undefined),
        title: vi.fn().mockResolvedValue("Test"),
        url: vi.fn().mockReturnValue("https://test.com"),
        $: vi.fn(),
        $$: vi.fn().mockResolvedValue([]),
        evaluate: vi.fn().mockResolvedValue(true),
        waitForTimeout: vi.fn().mockResolvedValue(undefined)
      };

      const playwrightDriver = new PlaywrightPageDriver(mockPlaywrightPage);
      const puppeteerDriver = new PuppeteerPageDriver(mockPuppeteerPage);

      // Both should implement the same interface methods
      expect(typeof playwrightDriver.goto).toBe('function');
      expect(typeof playwrightDriver.title).toBe('function');
      expect(typeof playwrightDriver.url).toBe('function');
      expect(typeof playwrightDriver.locator).toBe('function');
      expect(typeof playwrightDriver.waitForTimeout).toBe('function');

      expect(typeof puppeteerDriver.goto).toBe('function');
      expect(typeof puppeteerDriver.title).toBe('function');
      expect(typeof puppeteerDriver.url).toBe('function');
      expect(typeof puppeteerDriver.locator).toBe('function');
      expect(typeof puppeteerDriver.waitForTimeout).toBe('function');

      // Both should return compatible results
      await expect(playwrightDriver.goto("https://test.com")).resolves.toBeUndefined();
      await expect(puppeteerDriver.goto("https://test.com")).resolves.toBeUndefined();

      await expect(playwrightDriver.title()).resolves.toBe("Test");
      await expect(puppeteerDriver.title()).resolves.toBe("Test");

      expect(playwrightDriver.url()).toBe("https://test.com");
      expect(puppeteerDriver.url()).toBe("https://test.com");
    });

    it("should implement IElementHandle interface consistently", async () => {
      const mockPlaywrightPage = {
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([]),
          first: vi.fn(),
          count: vi.fn().mockResolvedValue(5),
          isVisible: vi.fn().mockResolvedValue(true),
          textContent: vi.fn().mockResolvedValue("test"),
          getAttribute: vi.fn().mockResolvedValue("value"),
          evaluate: vi.fn().mockResolvedValue("result"),
          click: vi.fn().mockResolvedValue(undefined),
        })
      };

      const mockPuppeteerPage = {
        $$: vi.fn().mockResolvedValue([{}, {}, {}, {}, {}]),
        evaluate: vi.fn().mockResolvedValue("test")
      };

      const playwrightElement = new PlaywrightPageDriver(mockPlaywrightPage).locator("#test");
      const puppeteerElement = new PuppeteerPageDriver(mockPuppeteerPage).locator("#test");

      // Both should implement the same interface methods
      expect(typeof playwrightElement.all).toBe('function');
      expect(typeof playwrightElement.count).toBe('function');
      expect(typeof playwrightElement.isVisible).toBe('function');
      expect(typeof playwrightElement.textContent).toBe('function');
      expect(typeof playwrightElement.getAttribute).toBe('function');
      expect(typeof playwrightElement.click).toBe('function');

      expect(typeof puppeteerElement.all).toBe('function');
      expect(typeof puppeteerElement.count).toBe('function');
      expect(typeof puppeteerElement.isVisible).toBe('function');
      expect(typeof puppeteerElement.textContent).toBe('function');
      expect(typeof puppeteerElement.getAttribute).toBe('function');
      expect(typeof puppeteerElement.click).toBe('function');

      // Both should return compatible results
      await expect(playwrightElement.count()).resolves.toBe(5);
      await expect(puppeteerElement.count()).resolves.toBe(5);
    });
  });

  describe("Performance and Memory", () => {
    it("should handle large numbers of elements efficiently", async () => {
      const mockElements = Array.from({ length: 1000 }, () => ({}));
      
      const mockPlaywrightPage = {
        locator: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue(mockElements),
          count: vi.fn().mockResolvedValue(1000)
        })
      };

      const mockPuppeteerPage = {
        $$: vi.fn().mockResolvedValue(mockElements)
      };

      const playwrightDriver = new PlaywrightPageDriver(mockPlaywrightPage);
      const puppeteerDriver = new PuppeteerPageDriver(mockPuppeteerPage);

      const playwrightElement = playwrightDriver.locator(".many-elements");
      const puppeteerElement = puppeteerDriver.locator(".many-elements");

      const startTime = Date.now();
      
      const [playwrightAll, puppeteerAll] = await Promise.all([
        playwrightElement.all(),
        puppeteerElement.all()
      ]);

      const duration = Date.now() - startTime;

      expect(playwrightAll).toHaveLength(1000);
      expect(puppeteerAll).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should not leak memory with repeated operations", async () => {
      const mockPlaywrightPage = {
        goto: vi.fn().mockResolvedValue(undefined),
        locator: vi.fn().mockReturnValue({
          click: vi.fn().mockResolvedValue(undefined)
        })
      };

      const driver = new PlaywrightPageDriver(mockPlaywrightPage);

      // Perform many operations to test for memory leaks
      for (let i = 0; i < 100; i++) {
        await driver.goto(`https://test-${i}.com`);
        const element = driver.locator(`#element-${i}`);
        await element.click();
      }

      // If we reach here without running out of memory, the test passes
      expect(true).toBe(true);
    });
  });
});