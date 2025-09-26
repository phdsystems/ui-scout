import { describe, it, expect, beforeEach, vi } from "vitest";
import { DiscoveryService } from "../src/DiscoveryService";

/**
 * DiscoveryService Unit Tests
 * Tests for optimized discovery methods with comprehensive mocking
 */
describe("DiscoveryService", () => {
  let mockPage: any;
  let discoveryService: DiscoveryService;

  // Mock data for different element types
  const mockButtons = [
    {
      tagName: "BUTTON",
      textContent: "New Order",
      id: "new-order",
      title: "F9",
      dataset: { testid: "new-order" },
    },
    { tagName: "BUTTON", textContent: "Buy", id: "buy-btn", className: "buy-btn" },
    { tagName: "BUTTON", textContent: "Sell", id: "sell-btn", className: "sell-btn" },
    { tagName: "BUTTON", textContent: "M1", className: "tf-btn" },
    { tagName: "BUTTON", textContent: "M5", className: "tf-btn" },
    { tagName: "BUTTON", textContent: "H1", className: "tf-btn" },
  ];

  const mockInputs = [
    { tagName: "INPUT", type: "number", placeholder: "Volume", id: "volume-input" },
    { tagName: "INPUT", type: "number", placeholder: "Price", id: "price-input" },
    { tagName: "INPUT", type: "text", placeholder: "Symbol", id: "symbol-input" },
  ];

  const mockTextareas = [{ tagName: "TEXTAREA", placeholder: "Comments", id: "comments" }];

  const mockSelects = [{ tagName: "SELECT", id: "order-type", name: "orderType" }];

  const mockLinks = [
    { tagName: "A", href: "/home", textContent: "Home" },
    { tagName: "A", href: "/about", textContent: "About" },
  ];

  const mockTestIds = [
    { tagName: "BUTTON", textContent: "Submit", dataset: { testid: "submit-btn" } },
    {
      tagName: "INPUT",
      type: "text",
      placeholder: "Username",
      dataset: { testid: "username-input" },
    },
  ];

  // Helper to create mock elements
  function createMockElement(data: any) {
    return {
      evaluate: vi.fn().mockImplementation((fn: (...args: any[]) => any) => {
        const el = {
          tagName: data.tagName?.toLowerCase() || "div",
          textContent: data.textContent || "",
          ...data,
        };
        return Promise.resolve(fn(el));
      }),
      textContent: vi.fn().mockResolvedValue(data.textContent || ""),
      isVisible: vi.fn().mockResolvedValue(true),
      isEnabled: vi.fn().mockResolvedValue(true),
      getAttribute: vi.fn().mockImplementation((attr: string) => {
        switch (attr) {
          case "data-testid":
            return Promise.resolve(data.dataset?.testid || null);
          case "id":
            return Promise.resolve(data.id || null);
          case "title":
            return Promise.resolve(data.title || null);
          case "placeholder":
            return Promise.resolve(data.placeholder || null);
          case "type":
            return Promise.resolve(data.type || null);
          case "href":
            return Promise.resolve(data.href || null);
          case "name":
            return Promise.resolve(data.name || null);
          case "role":
            return Promise.resolve(data.role || null);
          default:
            return Promise.resolve(null);
        }
      }),
    };
  }

  // Create mock locator
  function createMockLocator(selector: string) {
    const cleanSelector = selector.replace(/:visible/g, "").trim();

    let elements: any[] = [];

    // Match selectors to mock data - Button-related selectors
    if (
      cleanSelector === "button" ||
      cleanSelector === '[role="button"]' ||
      cleanSelector.includes('[class*="button"]') ||
      cleanSelector.includes('[class*="btn"]') ||
      cleanSelector === "a.btn" ||
      cleanSelector === "a.button" ||
      cleanSelector === 'input[type="button"]' ||
      cleanSelector === 'input[type="submit"]' ||
      cleanSelector === "[onclick]"
    ) {
      elements = mockButtons;
    } else if (
      cleanSelector === "input" ||
      cleanSelector === 'input:not([type="button"]):not([type="submit"])' ||
      cleanSelector === 'input[type="text"]' ||
      cleanSelector === 'input[type="number"]' ||
      cleanSelector === 'input[type="email"]' ||
      cleanSelector === 'input[type="password"]' ||
      cleanSelector === 'input[type="search"]' ||
      cleanSelector === 'input[type="tel"]' ||
      cleanSelector === 'input[type="url"]' ||
      cleanSelector === 'input[type="date"]' ||
      cleanSelector === 'input[type="time"]' ||
      cleanSelector === 'input[type="datetime-local"]' ||
      cleanSelector === 'input[type="checkbox"]' ||
      cleanSelector === 'input[type="radio"]' ||
      cleanSelector === 'input[type="range"]'
    ) {
      elements = mockInputs;
    } else if (cleanSelector === "textarea") {
      elements = mockTextareas;
    } else if (cleanSelector === "select") {
      elements = mockSelects;
    } else if (cleanSelector === "a[href]") {
      elements = mockLinks;
    } else if (cleanSelector === "[data-testid]") {
      elements = mockTestIds;
    } else if (cleanSelector.includes(".container-a")) {
      // Return a special locator for container tests
      const containerMockLocator = {
        all: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(1),
        first: vi.fn().mockReturnValue(null),
        locator: vi.fn().mockImplementation((childSelector: string) => {
          if (childSelector.includes("button")) {
            return {
              all: vi
                .fn()
                .mockResolvedValue([
                  createMockElement({ tagName: "BUTTON", textContent: "Container Button 1" }),
                  createMockElement({ tagName: "BUTTON", textContent: "Container Button 2" }),
                ]),
            };
          } else if (childSelector.includes("input")) {
            return {
              all: vi.fn().mockResolvedValue([
                createMockElement({
                  tagName: "INPUT",
                  type: "text",
                  placeholder: "Container Input",
                }),
              ]),
            };
          }
          return { all: vi.fn().mockResolvedValue([]) };
        }),
      };
      return containerMockLocator;
    } else if (cleanSelector.includes('[role="menu"]') || cleanSelector.includes("nav")) {
      elements = [
        { tagName: "NAV", role: "navigation" },
        { tagName: "UL", role: "menu" },
      ];
    } else if (cleanSelector.includes('[role="tab"]')) {
      elements = [
        { tagName: "BUTTON", role: "tab", textContent: "Tab 1" },
        { tagName: "BUTTON", role: "tab", textContent: "Tab 2" },
      ];
    } else if (cleanSelector.includes("select") || cleanSelector.includes("dropdown")) {
      elements = mockSelects;
    }

    return {
      all: vi.fn().mockResolvedValue(elements.map(createMockElement)),
      count: vi.fn().mockResolvedValue(elements.length),
      first: vi.fn().mockReturnValue(elements.length > 0 ? createMockElement(elements[0]) : null),
    };
  }

  beforeEach(() => {
    let selectorCounter = 0;

    mockPage = {
      url: vi.fn().mockReturnValue("http://localhost:3000"),
      goto: vi.fn().mockResolvedValue(undefined),
      waitForLoadState: vi.fn().mockResolvedValue(undefined),
      locator: vi.fn().mockImplementation(createMockLocator),
      evaluate: vi.fn().mockImplementation((fn: (...args: any[]) => any) => {
        if (fn.toString().includes("getComputedStyle")) {
          return Promise.resolve({ visibility: "visible" });
        }
        return Promise.resolve(`selector-${++selectorCounter}`);
      }),
      $$: vi.fn().mockImplementation((selector: string) => {
        if (selector === ".container-a") {
          return Promise.resolve([{}]);
        }
        if (selector === ".non-existent") {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      }),
    };

    discoveryService = new DiscoveryService(mockPage);
    vi.clearAllMocks();
  });

  describe("Method Availability", () => {
    it("should have all optimized discovery methods", () => {
      expect(discoveryService.discoverEssentials).toBeDefined();
      expect(typeof discoveryService.discoverEssentials).toBe("function");
      expect(discoveryService.discoverButtons).toBeDefined();
      expect(typeof discoveryService.discoverButtons).toBe("function");
      expect(discoveryService.discoverInputs).toBeDefined();
      expect(typeof discoveryService.discoverInputs).toBe("function");
      expect(discoveryService.discoverInContainer).toBeDefined();
      expect(typeof discoveryService.discoverInContainer).toBe("function");
      expect(discoveryService.discoverNavigation).toBeDefined();
      expect(typeof discoveryService.discoverNavigation).toBe("function");
    });

    it("should return promises from all discovery methods", async () => {
      expect(discoveryService.discoverEssentials()).toBeInstanceOf(Promise);
      expect(discoveryService.discoverButtons()).toBeInstanceOf(Promise);
      expect(discoveryService.discoverInputs()).toBeInstanceOf(Promise);
      expect(discoveryService.discoverNavigation()).toBeInstanceOf(Promise);
      expect(discoveryService.discoverInContainer(".test")).toBeInstanceOf(Promise);
    });
  });

  describe("discoverEssentials()", () => {
    it("should discover essential interactive elements", async () => {
      const features = await discoveryService.discoverEssentials();

      expect(features).toBeDefined();
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBeGreaterThan(0);

      features.forEach((feature) => {
        expect(feature.confidence).toBeDefined();
        expect(feature.confidence).toBeGreaterThanOrEqual(0);
        expect(feature.confidence).toBeLessThanOrEqual(1);
      });
    });

    it("should find elements with data-testid", async () => {
      const features = await discoveryService.discoverEssentials();
      const submitBtn = features.find((f) => f.text === "Submit");
      expect(submitBtn).toBeDefined();
      expect(submitBtn?.confidence).toBe(1.0);
    });

    it("should find buttons and inputs", async () => {
      const features = await discoveryService.discoverEssentials();
      const buttons = features.filter((f) => f.type === "button");
      const inputs = features.filter((f) => f.type === "input");

      expect(buttons.length).toBeGreaterThan(0);
      expect(inputs.length).toBeGreaterThan(0);
    });

    it("should complete quickly", async () => {
      const startTime = Date.now();
      await discoveryService.discoverEssentials();
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100);
    });
  });

  describe("discoverButtons()", () => {
    it("should discover only button elements", async () => {
      const buttons = await discoveryService.discoverButtons();

      expect(buttons).toBeDefined();
      expect(Array.isArray(buttons)).toBe(true);
      expect(buttons.length).toBe(6);

      buttons.forEach((button) => {
        expect(button.type).toBe("button");
      });
    });

    it("should find specific button types", async () => {
      const buttons = await discoveryService.discoverButtons();

      const buyBtn = buttons.find((b) => b.text === "Buy");
      const sellBtn = buttons.find((b) => b.text === "Sell");
      const newOrderBtn = buttons.find((b) => b.text === "New Order");

      expect(buyBtn).toBeDefined();
      expect(sellBtn).toBeDefined();
      expect(newOrderBtn).toBeDefined();
    });

    it("should find timeframe buttons", async () => {
      const buttons = await discoveryService.discoverButtons();
      const timeframes = buttons.filter((b) => ["M1", "M5", "H1"].includes(b.text || ""));
      expect(timeframes.length).toBe(3);
    });
  });

  describe("discoverInputs()", () => {
    it("should discover input elements", async () => {
      const inputs = await discoveryService.discoverInputs();

      expect(inputs).toBeDefined();
      expect(Array.isArray(inputs)).toBe(true);
      expect(inputs.length).toBe(5);

      inputs.forEach((input) => {
        expect(input.type).toBe("input");
      });
    });

    it("should include input metadata", async () => {
      const inputs = await discoveryService.discoverInputs();

      const volumeInput = inputs.find(
        (i) => i.attributes?.placeholder === "Volume" || i.name === "Volume",
      );
      const priceInput = inputs.find(
        (i) => i.attributes?.placeholder === "Price" || i.name === "Price",
      );

      expect(volumeInput).toBeDefined();
      expect(priceInput).toBeDefined();
    });

    it("should discover different input types", async () => {
      const inputs = await discoveryService.discoverInputs();

      expect(inputs.length).toBeGreaterThan(3);

      const inputNames = inputs.map((i) => i.name);
      const hasVolumeInput = inputNames.some((name) => name?.includes("Volume"));
      const hasPriceInput = inputNames.some((name) => name?.includes("Price"));
      const hasComments = inputNames.some((name) => name?.includes("Comments"));

      expect(hasVolumeInput).toBe(true);
      expect(hasPriceInput).toBe(true);
      expect(hasComments).toBe(true);
    });
  });

  describe("discoverNavigation()", () => {
    it("should discover navigation elements", async () => {
      const navElements = await discoveryService.discoverNavigation();

      expect(navElements).toBeDefined();
      expect(Array.isArray(navElements)).toBe(true);

      const validTypes = ["menu", "dropdown", "tab", "navigation"];
      navElements.forEach((element) => {
        expect(validTypes).toContain(element.type);
      });
    });
  });

  describe("discoverInContainer()", () => {
    it("should discover elements within a container", async () => {
      const elements = await discoveryService.discoverInContainer(".container-a");

      expect(elements).toBeDefined();
      expect(Array.isArray(elements)).toBe(true);
      expect(elements.length).toBe(3);

      const containerButtons = elements.filter((e) => e.type === "button");
      const containerInputs = elements.filter((e) => e.type === "input");

      expect(containerButtons.length).toBe(2);
      expect(containerInputs.length).toBe(1);
    });

    it("should return empty array for non-existent container", async () => {
      const elements = await discoveryService.discoverInContainer(".non-existent");
      expect(elements).toEqual([]);
    });
  });

  describe("Confidence Scoring", () => {
    it("should assign highest confidence to data-testid selectors", async () => {
      const features = await discoveryService.discoverEssentials();
      const withTestId = features.filter((f) => f.selector.includes("[data-testid="));

      withTestId.forEach((feature) => {
        expect(feature.confidence).toBe(1.0);
      });
    });

    it("should assign high confidence to id selectors", async () => {
      const features = await discoveryService.discoverEssentials();
      const withId = features.filter((f) => f.selector.startsWith("#"));

      withId.forEach((feature) => {
        expect(feature.confidence).toBeGreaterThanOrEqual(0.9);
      });
    });

    it("should assign lower confidence to text-based selectors", async () => {
      const features = await discoveryService.discoverEssentials();
      const textBased = features.filter(
        (f) =>
          f.selector.includes(":has-text") &&
          !f.selector.includes("[data-testid=") &&
          !f.selector.startsWith("#"),
      );

      textBased.forEach((feature) => {
        expect(feature.confidence).toBeLessThanOrEqual(0.7);
      });
    });
  });

  describe("Performance", () => {
    it("should handle parallel discovery efficiently", async () => {
      const startTime = Date.now();

      const [buttons, inputs, nav] = await Promise.all([
        discoveryService.discoverButtons(),
        discoveryService.discoverInputs(),
        discoveryService.discoverNavigation(),
      ]);

      const duration = Date.now() - startTime;

      expect(buttons.length).toBeGreaterThan(0);
      expect(inputs.length).toBeGreaterThan(0);
      expect(nav).toBeDefined();
      expect(duration).toBeLessThan(200);
    });

    it("should not degrade with repeated calls", async () => {
      const durations: number[] = [];

      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await discoveryService.discoverEssentials();
        durations.push(Date.now() - start);
      }

      const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
      const lastDuration = durations[durations.length - 1];

      // Allow some variance in test timing
      expect(lastDuration).toBeLessThan(avgDuration * 2);
    });
  });
});
