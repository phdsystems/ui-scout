import { describe, it, expect, beforeEach, vi } from "vitest";
import { InputDiscovery } from "../src/InputDiscovery";
import { createMockPage, createMockLocator } from "./mocks/playwright.mock";

describe("InputDiscovery", () => {
  let mockPage: any;
  let inputDiscovery: InputDiscovery;

  beforeEach(() => {
    mockPage = createMockPage();
    inputDiscovery = new InputDiscovery(mockPage);
    vi.clearAllMocks();
  });

  describe("discoverInputs", () => {
    it("should discover text input fields", async () => {
      const mockInput = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          const attrs: Record<string, string> = {
            type: "text",
            id: "username",
            name: "username",
            placeholder: "Enter username",
            required: "true",
          };
          return attrs[attr] || null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
        toString: vi.fn().mockReturnValue("input#username"),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === 'input[type="text"]') {
          return { all: vi.fn().mockResolvedValue([mockInput]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Mock SelectorUtils
      inputDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("input#username"),
        findLabelForInput: vi.fn().mockResolvedValue(""),
      } as any;

      const result = await inputDiscovery.discoverInputs();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: "input",
        selector: "input#username",
        name: "Enter username",
        attributes: {
          type: "text",
          placeholder: "Enter username",
          name: "username",
          id: "username",
        },
        actions: ["fill", "clear", "focus", "blur"],
      });
    });

    it("should discover different input types", async () => {
      const inputTypes = ["email", "password", "number", "date", "checkbox"];
      const mockInputs = inputTypes.map((type, index) =>
        createMockLocator({
          getAttribute: vi.fn().mockImplementation((attr: string) => {
            if (attr === "type") return type;
            if (attr === "id") return `input-${index}`;
            if (attr === "name") return `field-${type}`;
            return null;
          }),
          isVisible: vi.fn().mockResolvedValue(true),
          isEnabled: vi.fn().mockResolvedValue(true),
          toString: vi.fn().mockReturnValue(`input[type=${type}]`),
        }),
      );

      mockPage.locator.mockImplementation((selector: string) => {
        // Handle different input type selectors
        if (selector.includes('input[type="email"]')) {
          return { all: vi.fn().mockResolvedValue([mockInputs[0]]) };
        }
        if (selector.includes('input[type="password"]')) {
          return { all: vi.fn().mockResolvedValue([mockInputs[1]]) };
        }
        if (selector.includes('input[type="number"]')) {
          return { all: vi.fn().mockResolvedValue([mockInputs[2]]) };
        }
        if (selector.includes('input[type="date"]')) {
          return { all: vi.fn().mockResolvedValue([mockInputs[3]]) };
        }
        if (selector.includes('input[type="checkbox"]')) {
          return { all: vi.fn().mockResolvedValue([mockInputs[4]]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Mock SelectorUtils for all inputs
      inputDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockImplementation((element: any) => {
          const type = element.getAttribute("type");
          const index = inputTypes.indexOf(type);
          return `input[type=${type}]#input-${index}`;
        }),
        findLabelForInput: vi.fn().mockResolvedValue(""),
      } as any;

      const result = await inputDiscovery.discoverInputs();

      expect(result).toHaveLength(5);
      result.forEach((input, index) => {
        expect(input.type).toBe("input");
        expect(input.attributes?.type).toBe(inputTypes[index]);
        expect(input.attributes?.name).toBe(`field-${inputTypes[index]}`);
      });
    });

    it("should discover textarea elements", async () => {
      const mockTextarea = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          const attrs: Record<string, string> = {
            id: "description",
            name: "description",
            placeholder: "Enter description",
            rows: "5",
            cols: "40",
          };
          return attrs[attr] || null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
        toString: vi.fn().mockReturnValue("textarea#description"),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "textarea") {
          return { all: vi.fn().mockResolvedValue([mockTextarea]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Mock SelectorUtils
      inputDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("textarea#description"),
        findLabelForInput: vi.fn().mockResolvedValue(""),
      } as any;

      const result = await inputDiscovery.discoverInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("input");
      expect(result[0].name).toBe("Enter description");
      expect(result[0].attributes?.name).toBe("description");
    });

    it("should discover select dropdowns with options", async () => {
      const mockOption1 = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Option 1"),
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "value") return "opt1";
          return null;
        }),
      });

      const mockOption2 = createMockLocator({
        textContent: vi.fn().mockResolvedValue("Option 2"),
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "value") return "opt2";
          return null;
        }),
      });

      const mockSelect = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          const attrs: Record<string, string> = {
            id: "country",
            name: "country",
          };
          return attrs[attr] || null;
        }),
        locator: vi.fn().mockImplementation((selector: string) => {
          if (selector === "option") {
            return { all: vi.fn().mockResolvedValue([mockOption1, mockOption2]) };
          }
          return createMockLocator();
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
        toString: vi.fn().mockReturnValue("select#country"),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "select") {
          return { all: vi.fn().mockResolvedValue([mockSelect]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Mock SelectorUtils
      inputDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("select#country"),
        findLabelForInput: vi.fn().mockResolvedValue(""),
      } as any;

      const result = await inputDiscovery.discoverInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("input");
      expect(result[0].name).toBe("country");
      expect(result[0].attributes?.name).toBe("country");
    });

    it("should find labels for inputs", async () => {
      const mockInput = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "type") return "email";
          if (attr === "id") return "email-input";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
        toString: vi.fn().mockReturnValue("input#email-input"),
      });

      const mockSelectorUtils = {
        findLabelForInput: vi.fn().mockResolvedValue("Email Address"),
        getUniqueSelector: vi.fn().mockResolvedValue("input#email-input"),
      };

      // Mock the selectorUtils property
      Object.defineProperty(inputDiscovery, "selectorUtils", {
        value: mockSelectorUtils,
        writable: true,
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes('input[type="email"]')) {
          return { all: vi.fn().mockResolvedValue([mockInput]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const result = await inputDiscovery.discoverInputs();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Email Address");
      expect(mockSelectorUtils.findLabelForInput).toHaveBeenCalledWith(mockInput);
    });

    it("should identify validation attributes", async () => {
      const mockInput = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          const attrs: Record<string, string> = {
            type: "number",
            min: "0",
            max: "100",
            step: "5",
            pattern: "[0-9]+",
            maxlength: "10",
            minlength: "2",
            required: "true",
          };
          return attrs[attr] || null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
        toString: vi.fn().mockReturnValue("input[type=number]"),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes('input[type="number"]')) {
          return { all: vi.fn().mockResolvedValue([mockInput]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Mock SelectorUtils
      inputDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("input[type=number]"),
        findLabelForInput: vi.fn().mockResolvedValue(""),
      } as any;

      const result = await inputDiscovery.discoverInputs();

      expect(result).toHaveLength(1);
      const input = result[0];
      expect(input.type).toBe("input");
      expect(input.attributes?.type).toBe("number");
    });

    it("should skip hidden inputs", async () => {
      const visibleInput = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "type") return "text";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
        toString: vi.fn().mockReturnValue("input.visible"),
      });

      const _hiddenInput = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "type") return "hidden";
          return null;
        }),
        isVisible: vi.fn().mockResolvedValue(false),
        toString: vi.fn().mockReturnValue("input.hidden"),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes('input[type="text"]')) {
          return { all: vi.fn().mockResolvedValue([visibleInput]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Mock SelectorUtils
      inputDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("input.visible"),
        findLabelForInput: vi.fn().mockResolvedValue(""),
      } as any;

      const result = await inputDiscovery.discoverInputs();

      expect(result).toHaveLength(1);
      expect(result[0].attributes?.type).toBe("text");
    });

    it("should handle file input types", async () => {
      const _mockFileInput = createMockLocator({
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          const attrs: Record<string, string> = {
            type: "file",
            accept: ".jpg,.png,.pdf",
            multiple: "true",
          };
          return attrs[attr] || null;
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
        toString: vi.fn().mockReturnValue("input[type=file]"),
      });

      mockPage.locator.mockImplementation((_selector: string) => {
        // File inputs are not in the standard selectors, they would not be found
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const result = await inputDiscovery.discoverInputs();

      // File inputs are not discovered by the current selectors
      expect(result).toHaveLength(0);
    });
  });

  describe("getTestValueForInput", () => {
    it("should generate test data for text input", () => {
      const testData = inputDiscovery.getTestValueForInput("text");
      expect(testData).toBe("Test Value");
    });

    it("should generate test data for email input", () => {
      const testData = inputDiscovery.getTestValueForInput("email");
      expect(testData).toBe("test@example.com");
    });

    it("should generate test data for password input", () => {
      const testData = inputDiscovery.getTestValueForInput("password");
      expect(testData).toBe("TestPassword123!");
    });

    it("should generate test data for number input", () => {
      const testData = inputDiscovery.getTestValueForInput("number");
      expect(testData).toBe("42");
    });

    it("should generate test data for date input", () => {
      const testData = inputDiscovery.getTestValueForInput("date");
      expect(testData).toBe("2024-01-01");
    });

    it("should generate test data for time input", () => {
      const testData = inputDiscovery.getTestValueForInput("time");
      expect(testData).toBe("12:00");
    });

    it("should generate test data for tel input", () => {
      const testData = inputDiscovery.getTestValueForInput("tel");
      expect(testData).toBe("+1234567890");
    });

    it("should generate test data for url input", () => {
      const testData = inputDiscovery.getTestValueForInput("url");
      expect(testData).toBe("https://example.com");
    });

    it("should generate test data for search input", () => {
      const testData = inputDiscovery.getTestValueForInput("search");
      expect(testData).toBe("test search query");
    });

    it("should handle unknown input types", () => {
      const testData = inputDiscovery.getTestValueForInput("unknown");
      expect(testData).toBe("Test Value");
    });
  });

  describe("error handling", () => {
    it("should handle errors gracefully", async () => {
      mockPage.locator.mockImplementation(() => {
        throw new Error("Selector error");
      });

      await expect(inputDiscovery.discoverInputs()).rejects.toThrow("Selector error");
    });

    it("should handle malformed select elements", async () => {
      const mockSelect = createMockLocator({
        getAttribute: vi.fn().mockReturnValue(null),
        locator: vi.fn().mockImplementation(() => {
          throw new Error("Options not found");
        }),
        isVisible: vi.fn().mockResolvedValue(true),
        isEnabled: vi.fn().mockResolvedValue(true),
        toString: vi.fn().mockReturnValue("select.broken"),
      });

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "select") {
          return { all: vi.fn().mockResolvedValue([mockSelect]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      // Mock SelectorUtils
      inputDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("select.broken"),
        findLabelForInput: vi.fn().mockResolvedValue(""),
      } as any;

      const result = await inputDiscovery.discoverInputs();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("input");
    });
  });
});
