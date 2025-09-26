import { describe, it, expect, beforeEach, vi } from "vitest";
import { SelectorUtils } from "../src/SelectorUtils";
import { createMockPage, createMockLocator } from "./mocks/playwright.mock";

describe("SelectorUtils", () => {
  let mockPage: any;
  let selectorUtils: SelectorUtils;

  beforeEach(() => {
    mockPage = createMockPage();
    selectorUtils = new SelectorUtils(mockPage);
    vi.clearAllMocks();
  });

  describe("getUniqueSelector", () => {
    it("should prioritize data-testid attribute", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "data-testid") return "submit-button";
          if (attr === "id") return "btn-submit";
          if (attr === "class") return "btn primary";
          return null;
        }),
      });

      const selector = await selectorUtils.getUniqueSelector(mockElement);

      expect(selector).toBe('[data-testid="submit-button"]');
      expect(mockElement.getAttribute).toHaveBeenCalledWith("data-testid");
    });

    it("should use id when data-testid is not available", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "data-testid") return null;
          if (attr === "id") return "unique-button";
          return null;
        }),
      });

      const selector = await selectorUtils.getUniqueSelector(mockElement);

      expect(selector).toBe("#unique-button");
    });

    it("should generate unique class selector when possible", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "data-testid") return null;
          if (attr === "id") return null;
          if (attr === "class") return "btn-primary submit-form unique-class";
          return null;
        }),
      });

      // Mock that the class selector is unique
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === ".btn-primary.submit-form.unique-class") {
          return createMockLocator({ count: vi.fn().mockResolvedValue(1) });
        }
        return createMockLocator();
      });

      const selector = await selectorUtils.getUniqueSelector(mockElement);

      expect(selector).toBe(".btn-primary.submit-form.unique-class");
    });

    it("should use role and aria-label combination", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "data-testid") return null;
          if (attr === "id") return null;
          if (attr === "class") return "common-class";
          if (attr === "role") return "button";
          if (attr === "aria-label") return "Close dialog";
          return null;
        }),
      });

      // Mock that class selector is not unique
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.startsWith(".")) {
          return createMockLocator({ count: vi.fn().mockResolvedValue(5) });
        }
        return createMockLocator();
      });

      const selector = await selectorUtils.getUniqueSelector(mockElement);

      expect(selector).toBe('[role="button"][aria-label="Close dialog"]');
    });

    it("should use text content for buttons and links", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "class") return "common-btn";
          return null;
        }),
        evaluate: vi.fn().mockResolvedValue("button"),
        textContent: vi.fn().mockResolvedValue("Click here to submit your form"),
      });

      // Mock that class selector is not unique
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.startsWith(".")) {
          return createMockLocator({ count: vi.fn().mockResolvedValue(3) });
        }
        return createMockLocator();
      });

      const selector = await selectorUtils.getUniqueSelector(mockElement);

      expect(selector).toBe('button:has-text("Click here to submit your form")');
    });

    it("should truncate long text content", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn().mockReturnValue(null),
        evaluate: vi.fn().mockResolvedValue("a"),
        textContent: vi
          .fn()
          .mockResolvedValue(
            "This is a very long link text that should be truncated after thirty characters",
          ),
      });

      mockPage.locator.mockReturnValue(createMockLocator({ count: vi.fn().mockResolvedValue(2) }));

      const selector = await selectorUtils.getUniqueSelector(mockElement);

      expect(selector).toBe('a:has-text("This is a very long link text ")');
    });

    it("should fallback to element.toString() when no unique selector found", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn().mockReturnValue(null),
        evaluate: vi.fn().mockResolvedValue("span"),
        textContent: vi.fn().mockResolvedValue(""),
        toString: vi.fn().mockReturnValue("Locator('span.generic')"),
      });

      const selector = await selectorUtils.getUniqueSelector(mockElement);

      expect(selector).toBe("Locator('span.generic')");
    });

    it("should handle errors gracefully", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn().mockRejectedValue(new Error("Element detached")),
        toString: vi.fn().mockReturnValue("Locator('div')"),
      });

      const selector = await selectorUtils.getUniqueSelector(mockElement);

      expect(selector).toBe("Locator('div')");
    });
  });

  describe("findLabelForInput", () => {
    it("should find label by 'for' attribute", async () => {
      const mockInput = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "id") return "email-field";
          return null;
        }),
        locator: vi.fn().mockReturnValue(createMockLocator()),
      });

      const mockLabel = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Email Address"),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === 'label[for="email-field"]') return mockLabel;
        return createMockLocator();
      });

      const label = await selectorUtils.findLabelForInput(mockInput);

      expect(label).toBe("Email Address");
    });

    it("should find parent label", async () => {
      const mockParentLabel = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Username"),
      });

      const mockInput = createMockLocator({
        getAttribute: vi.fn().mockReturnValue(null),
        locator: vi.fn().mockImplementation((selector: string) => {
          if (selector === "xpath=ancestor::label") {
            return createMockLocator({
              first: vi.fn().mockReturnValue(mockParentLabel),
            });
          }
          return createMockLocator();
        }),
      });

      mockPage.locator.mockReturnValue(createMockLocator());

      const label = await selectorUtils.findLabelForInput(mockInput);

      expect(label).toBe("Username");
    });

    it("should use aria-label attribute", async () => {
      const mockInput = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "aria-label") return "Search query";
          return null;
        }),
        locator: vi.fn().mockReturnValue(
          createMockLocator({
            first: vi.fn().mockReturnValue(createMockLocator()),
          }),
        ),
      });

      mockPage.locator.mockReturnValue(createMockLocator());

      const label = await selectorUtils.findLabelForInput(mockInput);

      expect(label).toBe("Search query");
    });

    it("should find preceding sibling label", async () => {
      const mockPrecedingLabel = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Password"),
      });

      const mockInput = createMockLocator({
        getAttribute: vi.fn().mockReturnValue(null),
        locator: vi.fn().mockImplementation((selector: string) => {
          if (selector === "xpath=preceding-sibling::label") {
            return createMockLocator({
              first: vi.fn().mockReturnValue(mockPrecedingLabel),
            });
          }
          if (selector === "xpath=ancestor::label") {
            return createMockLocator({
              first: vi.fn().mockReturnValue(createMockLocator()),
            });
          }
          return createMockLocator();
        }),
      });

      mockPage.locator.mockReturnValue(createMockLocator());

      const label = await selectorUtils.findLabelForInput(mockInput);

      expect(label).toBe("Password");
    });

    it("should return empty string when no label found", async () => {
      const mockInput = createMockLocator({
        getAttribute: vi.fn().mockReturnValue(null),
        locator: vi.fn().mockReturnValue(
          createMockLocator({
            first: vi.fn().mockReturnValue(
              createMockLocator({
                textContent: vi.fn().mockResolvedValue(null),
              }),
            ),
          }),
        ),
      });

      mockPage.locator.mockReturnValue(
        createMockLocator({
          textContent: vi.fn().mockResolvedValue(null),
        }),
      );

      const label = await selectorUtils.findLabelForInput(mockInput);

      expect(label).toBe("");
    });

    it("should handle errors and return empty string", async () => {
      const mockInput = createMockLocator({
        getAttribute: vi.fn().mockRejectedValue(new Error("Element not found")),
      });

      const label = await selectorUtils.findLabelForInput(mockInput);

      expect(label).toBe("");
    });
  });

  describe("class selector filtering", () => {
    it("should filter out pseudo-classes from class names", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "class") return "btn hover:bg-blue-500 focus:outline-none active";
          return null;
        }),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === ".btn.active") {
          return createMockLocator({ count: vi.fn().mockResolvedValue(1) });
        }
        return createMockLocator();
      });

      const selector = await selectorUtils.getUniqueSelector(mockElement);

      expect(selector).toBe(".btn.active");
    });

    it("should handle empty or null class attribute", async () => {
      const mockElement = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "class") return "";
          if (attr === "id") return "test-id";
          return null;
        }),
      });

      const selector = await selectorUtils.getUniqueSelector(mockElement);

      expect(selector).toBe("#test-id");
    });
  });
});
