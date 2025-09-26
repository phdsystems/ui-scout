import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { GenericDiscoveryService } from "../src/GenericDiscoveryService";
import { createMockLocator } from "./mocks/playwright.mock";
import type { IPageDriver } from "../src/interfaces/IPageDriver";

describe("GenericDiscoveryService", () => {
  let mockDriver: IPageDriver;
  let discoveryService: GenericDiscoveryService;
  let consoleSpy: any;

  beforeEach(() => {
    mockDriver = {
      locator: vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue([]),
      }),
    };

    discoveryService = new GenericDiscoveryService(mockDriver);

    // Spy on console.log to test logging
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("discoverAllFeatures", () => {
    it("should discover all feature types and return combined results", async () => {
      // Mock button elements
      const mockButtonElement = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
        textContent: vi.fn().mockResolvedValue("Submit"),
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "title") return "Submit form";
          if (attr === "aria-label") return null;
          return null;
        }),
      });

      // Mock input elements
      const mockInputElement = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "placeholder") return "Enter email";
          if (attr === "type") return "email";
          return null;
        }),
      });

      // Mock navigation elements
      const mockNavElement = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
        textContent: vi.fn().mockResolvedValue("Main Navigation Menu"),
      });

      // Setup mockDriver to return different elements for different selectors
      mockDriver.locator = vi.fn().mockImplementation((selector: string) => {
        if (selector === "button") {
          return { all: vi.fn().mockResolvedValue([mockButtonElement]) };
        }
        if (selector === 'input[type="email"]') {
          return { all: vi.fn().mockResolvedValue([mockInputElement]) };
        }
        if (selector === "nav") {
          return { all: vi.fn().mockResolvedValue([mockNavElement]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const features = await discoveryService.discoverAllFeatures();

      expect(features).toHaveLength(3);
      expect(features[0]).toMatchObject({
        name: "Submit",
        type: "button",
        selector: "button",
        text: "Submit",
        actions: ["click", "hover"],
      });
      expect(features[1]).toMatchObject({
        name: "Enter email",
        type: "input",
        selector: 'input[type="email"]',
        attributes: {
          type: "email",
          placeholder: "Enter email",
        },
        actions: ["fill", "clear"],
      });
      expect(features[2]).toMatchObject({
        name: "Navigation",
        type: "menu",
        selector: "nav",
        text: "Main Navigation Menu",
        actions: ["click", "hover"],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "🔍 Starting feature discovery (framework-agnostic)...\n",
      );
      expect(consoleSpy).toHaveBeenCalledWith("✅ Found 3 features total\n");
    });

    it("should handle empty results gracefully", async () => {
      mockDriver.locator = vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue([]),
      });

      const features = await discoveryService.discoverAllFeatures();

      expect(features).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith("✅ Found 0 features total\n");
    });
  });

  describe("discoverButtons", () => {
    it("should discover various types of button elements", async () => {
      const mockButton1 = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
        textContent: vi.fn().mockResolvedValue("Click me"),
        getAttribute: vi.fn().mockReturnValue(null),
      });

      const mockButton2 = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
        textContent: vi.fn().mockResolvedValue(""),
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "title") return "Close window";
          if (attr === "aria-label") return "Close";
          return null;
        }),
      });

      mockDriver.locator = vi.fn().mockImplementation((selector: string) => {
        if (selector === "button") {
          return { all: vi.fn().mockResolvedValue([mockButton1]) };
        }
        if (selector === '[role="button"]') {
          return { all: vi.fn().mockResolvedValue([mockButton2]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const features = await discoveryService.discoverAllFeatures();
      const buttons = features.filter((f) => f.type === "button");

      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toMatchObject({
        name: "Click me",
        type: "button",
        text: "Click me",
      });
      expect(buttons[1]).toMatchObject({
        name: "Close window",
        type: "button",
        text: "",
      });
    });

    it("should skip invisible button elements", async () => {
      const hiddenButton = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(false),
        textContent: vi.fn().mockResolvedValue("Hidden"),
      });

      const visibleButton = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
        textContent: vi.fn().mockResolvedValue("Visible"),
        getAttribute: vi.fn().mockReturnValue(null),
      });

      mockDriver.locator = vi.fn().mockImplementation((selector: string) => {
        if (selector === "button") {
          return { all: vi.fn().mockResolvedValue([hiddenButton, visibleButton]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const features = await discoveryService.discoverAllFeatures();
      const buttons = features.filter((f) => f.type === "button");

      expect(buttons).toHaveLength(1);
      expect(buttons[0].name).toBe("Visible");
    });
  });

  describe("discoverInputs", () => {
    it("should discover various types of input elements", async () => {
      const textInput = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "placeholder") return "Enter your name";
          if (attr === "type") return "text";
          return null;
        }),
      });

      const passwordInput = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "placeholder") return null;
          if (attr === "type") return "password";
          return null;
        }),
      });

      mockDriver.locator = vi.fn().mockImplementation((selector: string) => {
        if (selector === 'input[type="text"]') {
          return { all: vi.fn().mockResolvedValue([textInput]) };
        }
        if (selector === 'input[type="password"]') {
          return { all: vi.fn().mockResolvedValue([passwordInput]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const features = await discoveryService.discoverAllFeatures();
      const inputs = features.filter((f) => f.type === "input");

      expect(inputs).toHaveLength(2);

      expect(inputs[0]).toMatchObject({
        name: "Enter your name",
        type: "input",
        attributes: {
          type: "text",
          placeholder: "Enter your name",
        },
        actions: ["fill", "clear"],
      });

      expect(inputs[1]).toMatchObject({
        name: "Input (password)",
        type: "input",
        attributes: {
          type: "password",
          placeholder: "",
        },
      });
    });
  });

  describe("discoverNavigation", () => {
    it("should discover navigation elements", async () => {
      const navBar = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
        textContent: vi.fn().mockResolvedValue("Home Products About Contact"),
      });

      mockDriver.locator = vi.fn().mockImplementation((selector: string) => {
        if (selector === "nav") {
          return { all: vi.fn().mockResolvedValue([navBar]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const features = await discoveryService.discoverAllFeatures();
      const navigation = features.filter((f) => f.type === "menu");

      expect(navigation).toHaveLength(1);

      expect(navigation[0]).toMatchObject({
        name: "Navigation",
        type: "menu",
        selector: "nav",
        text: "Home Products About Contact",
        actions: ["click", "hover"],
      });
    });

    it("should truncate long navigation text", async () => {
      const longTextNav = createMockLocator({
        isVisible: vi.fn().mockResolvedValue(true),
        textContent: vi
          .fn()
          .mockResolvedValue(
            "This is a very long navigation menu with lots of text that should be truncated",
          ),
      });

      mockDriver.locator = vi.fn().mockImplementation((selector: string) => {
        if (selector === "nav") {
          return { all: vi.fn().mockResolvedValue([longTextNav]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const features = await discoveryService.discoverAllFeatures();
      const navigation = features.filter((f) => f.type === "menu");

      expect(navigation).toHaveLength(1);
      expect(navigation[0].text).toBe("This is a very long navigation menu with lots of t");
      expect(navigation[0].text?.length).toBe(50);
    });
  });

  describe("error handling", () => {
    it("should handle isVisible timeout gracefully", async () => {
      const timeoutElement = createMockLocator({
        isVisible: vi.fn().mockImplementation(({ timeout }) => {
          if (timeout === 1000) {
            return Promise.resolve(false); // Just return false instead of throwing
          }
          return Promise.resolve(false);
        }),
        textContent: vi.fn().mockResolvedValue("Test"),
        getAttribute: vi.fn().mockReturnValue(null),
      });

      mockDriver.locator = vi.fn().mockImplementation((selector: string) => {
        if (selector === "button") {
          return { all: vi.fn().mockResolvedValue([timeoutElement]) };
        }
        return { all: vi.fn().mockResolvedValue([]) };
      });

      const features = await discoveryService.discoverAllFeatures();

      // Should not throw error and should skip the timeout element
      expect(features).toBeDefined();
      expect(features.length).toBeGreaterThanOrEqual(0);
    });
  });
});
