import { describe, it, expect, beforeEach, vi } from "vitest";
import { ComponentDiscovery } from "../src/ComponentDiscovery";
import { createMockPage } from "./mocks/playwright.mock";

describe("ComponentDiscovery", () => {
  let mockPage: any;
  let componentDiscovery: ComponentDiscovery;

  // Helper to create a mock locator with proper chaining support
  const createMockLocatorWithChaining = (elements: any[] = []) => {
    const mockLocatorChain = {
      first: vi.fn().mockReturnThis(),
      textContent: vi.fn().mockResolvedValue(""),
      catch: vi.fn().mockImplementation((_fn) => Promise.resolve("")),
    };

    return {
      all: vi.fn().mockResolvedValue(elements),
      locator: vi.fn().mockReturnValue(mockLocatorChain),
      first: vi.fn().mockReturnThis(),
      textContent: vi.fn().mockResolvedValue(""),
    };
  };

  beforeEach(() => {
    mockPage = createMockPage();
    componentDiscovery = new ComponentDiscovery(mockPage);
    vi.clearAllMocks();
  });

  describe("discoverModals", () => {
    it("should discover modal components", async () => {
      const mockModal = {
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "id") return "login-modal";
          if (attr === "class") return "modal dialog";
          return null;
        }),
        isVisible: () => Promise.resolve(true),
      };

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes("modal") || selector.includes("dialog")) {
          return createMockLocatorWithChaining([mockModal]);
        }
        if (selector === "#login-modal") {
          return createMockLocatorWithChaining();
        }
        return createMockLocatorWithChaining();
      });

      // Mock SelectorUtils
      componentDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("#login-modal"),
      } as any;

      const result = await componentDiscovery.discoverModals();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: "login-modal", // Uses ID as name when no text content
        type: "modal",
        attributes: {
          id: "login-modal",
          class: "modal dialog",
        },
        actions: ["screenshot", "close"],
      });
    });

    it("should handle empty modal lists", async () => {
      mockPage.locator.mockImplementation(() => createMockLocatorWithChaining());

      const result = await componentDiscovery.discoverModals();

      expect(result).toEqual([]);
    });
  });

  describe("discoverTables", () => {
    it("should discover table components", async () => {
      const mockTable = {
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "id") return "data-table";
          if (attr === "class") return "table";
          return null;
        }),
        isVisible: () => Promise.resolve(true),
      };

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes("table") || selector === "table") {
          return createMockLocatorWithChaining([mockTable]);
        }
        return createMockLocatorWithChaining();
      });

      // Mock SelectorUtils
      componentDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("#data-table"),
      } as any;

      const result = await componentDiscovery.discoverTables();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: "data-table", // Uses ID as name
        type: "table",
        attributes: {
          id: "data-table",
          class: "table",
        },
        actions: ["screenshot", "hover"],
      });
    });

    it("should handle empty table lists", async () => {
      mockPage.locator.mockImplementation(() => createMockLocatorWithChaining());

      const result = await componentDiscovery.discoverTables();

      expect(result).toEqual([]);
    });
  });

  describe("discoverCharts", () => {
    it("should discover chart components", async () => {
      const mockChart = {
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "id") return "price-chart";
          if (attr === "class") return "chart-container";
          return null;
        }),
        isVisible: () => Promise.resolve(true),
      };

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes("chart") || selector === "canvas") {
          return createMockLocatorWithChaining([mockChart]);
        }
        return createMockLocatorWithChaining();
      });

      // Mock SelectorUtils
      componentDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("#price-chart"),
      } as any;

      const result = await componentDiscovery.discoverCharts();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: "price-chart",
        type: "chart",
        attributes: {
          id: "price-chart",
          class: "chart-container",
        },
      });
    });

    it("should handle empty chart lists", async () => {
      mockPage.locator.mockImplementation(() => createMockLocatorWithChaining());

      const result = await componentDiscovery.discoverCharts();

      expect(result).toEqual([]);
    });
  });

  describe("discoverPanels", () => {
    it("should discover panel components", async () => {
      const mockPanel = {
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "id") return "sidebar-panel";
          if (attr === "class") return "panel widget";
          return null;
        }),
        isVisible: () => Promise.resolve(true),
      };

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes("panel") || selector.includes("widget") || selector === "aside") {
          return createMockLocatorWithChaining([mockPanel]);
        }
        return createMockLocatorWithChaining();
      });

      // Mock SelectorUtils
      componentDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("#sidebar-panel"),
      } as any;

      const result = await componentDiscovery.discoverPanels();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: "sidebar-panel", // Uses ID as name when no heading found
        type: "panel",
        attributes: {
          id: "sidebar-panel",
          class: "panel widget",
        },
        actions: ["screenshot", "hover"],
      });
    });

    it("should handle empty panel lists", async () => {
      mockPage.locator.mockImplementation(() => createMockLocatorWithChaining());

      const result = await componentDiscovery.discoverPanels();

      expect(result).toEqual([]);
    });
  });

  describe("discoverCustomComponents", () => {
    it("should discover custom components", async () => {
      const mockCustom = {
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "data-testid") return "user-profile-widget";
          if (attr === "id") return "profile-widget";
          if (attr === "class") return "widget component";
          return null;
        }),
        isVisible: () => Promise.resolve(true),
      };

      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes("testid") || selector.includes("component")) {
          return createMockLocatorWithChaining([mockCustom]);
        }
        return createMockLocatorWithChaining();
      });

      // Mock SelectorUtils
      componentDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue('[data-testid="user-profile-widget"]'),
      } as any;

      const result = await componentDiscovery.discoverCustomComponents();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: "profile-widget", // Uses ID as name since testid not prioritized in enhancement
        type: "other",
        attributes: {
          id: "profile-widget",
          class: "widget component",
        },
        actions: ["screenshot", "hover"], // Default actions from analyzeComponent
      });
    });

    it("should handle empty custom component lists", async () => {
      mockPage.locator.mockImplementation(() => createMockLocatorWithChaining());

      const result = await componentDiscovery.discoverCustomComponents();

      expect(result).toEqual([]);
    });
  });

  describe("component filtering", () => {
    it("should filter out hidden components", async () => {
      const hiddenModal = {
        getAttribute: vi.fn().mockReturnValue("hidden-modal"),
        isVisible: () => Promise.resolve(false),
      };

      const visibleModal = {
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "id") return "visible-modal";
          if (attr === "class") return "modal dialog";
          return null;
        }),
        isVisible: () => Promise.resolve(true),
        locator: vi.fn().mockReturnValue({
          first: vi.fn().mockReturnValue({
            textContent: vi.fn().mockResolvedValue(""),
          }),
        }),
      };

      mockPage.locator.mockImplementation(() =>
        createMockLocatorWithChaining([hiddenModal, visibleModal]),
      );

      // Mock SelectorUtils
      componentDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("#visible-modal"),
      } as any;

      const result = await componentDiscovery.discoverModals();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("visible-modal"); // Uses ID as name
    });

    it("should handle duplicate selectors", async () => {
      const firstComponent = {
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "id") return "duplicate-id";
          if (attr === "class") return "chart";
          return null;
        }),
        isVisible: () => Promise.resolve(true),
      };

      const duplicateComponent = {
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "id") return "duplicate-id";
          if (attr === "class") return "chart";
          return null;
        }),
        isVisible: () => Promise.resolve(true),
      };

      mockPage.locator.mockImplementation(() =>
        createMockLocatorWithChaining([firstComponent, duplicateComponent]),
      );

      // Mock SelectorUtils to return the same selector for duplicates
      componentDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("#duplicate-id"),
      } as any;

      const result = await componentDiscovery.discoverCharts();

      // Should only include the first component, not the duplicate
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("duplicate-id");
    });
  });

  describe("error handling", () => {
    it("should handle component analysis errors gracefully", async () => {
      const errorComponent = {
        getAttribute: vi.fn().mockRejectedValue(new Error("getAttribute failed")),
        isVisible: () => Promise.resolve(true),
      };

      mockPage.locator.mockImplementation(() => createMockLocatorWithChaining([errorComponent]));

      const result = await componentDiscovery.discoverCharts();

      // Should skip components that fail analysis
      expect(result).toEqual([]);
    });

    it("should handle selector generation errors", async () => {
      const mockComponent = {
        getAttribute: vi.fn().mockResolvedValue("test-id"),
        isVisible: () => Promise.resolve(true),
      };

      mockPage.locator.mockImplementation(() => createMockLocatorWithChaining([mockComponent]));

      // Mock SelectorUtils to throw error
      componentDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockRejectedValue(new Error("Selector generation failed")),
      } as any;

      const result = await componentDiscovery.discoverPanels();

      // Should skip components where selector generation fails
      expect(result).toEqual([]);
    });

    it("should handle locator creation errors", async () => {
      mockPage.locator.mockImplementation(() => {
        throw new Error("Locator creation failed");
      });

      await expect(componentDiscovery.discoverModals()).rejects.toThrow("Locator creation failed");
    });
  });

  describe("enhancement features", () => {
    it("should enhance tables with structure information", async () => {
      const mockTable = {
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "id") return "enhanced-table";
          if (attr === "class") return "data-table";
          return null;
        }),
        isVisible: () => Promise.resolve(true),
        locator: vi.fn().mockImplementation((selector: string) => {
          if (selector.includes("columnheader") || selector.includes("th")) {
            return {
              allTextContents: vi.fn().mockResolvedValue(["ID", "Name", "Email", "Status"]),
            };
          }
          if (selector.includes("row") || selector.includes("tr")) {
            return {
              count: vi.fn().mockResolvedValue(10),
            };
          }
          return {
            allTextContents: vi.fn().mockResolvedValue([]),
            count: vi.fn().mockResolvedValue(0),
          };
        }),
      };

      // Mock page locator to return an enhanced locator with table methods
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "#enhanced-table") {
          // Return a locator that has methods for table enhancement
          return {
            locator: vi.fn().mockImplementation((innerSelector: string) => {
              if (innerSelector.includes("columnheader") || innerSelector.includes("th")) {
                return {
                  allTextContents: vi.fn().mockResolvedValue(["ID", "Name", "Email", "Status"]),
                };
              }
              if (innerSelector.includes("row") || innerSelector.includes("tr")) {
                return {
                  count: vi.fn().mockResolvedValue(10),
                };
              }
              return {
                allTextContents: vi.fn().mockResolvedValue([]),
                count: vi.fn().mockResolvedValue(0),
              };
            }),
          };
        }
        return createMockLocatorWithChaining([mockTable]);
      });

      componentDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("#enhanced-table"),
      } as any;

      const result = await componentDiscovery.discoverTables();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("ID, Name, Email, Status");
      expect(result[0].attributes?.headers).toBe("ID, Name, Email, Status");
      expect(result[0].attributes?.rows).toBe("10");
    });

    it("should enhance modals with heading information", async () => {
      const mockModal = {
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "id") return "settings-modal";
          if (attr === "class") return "modal";
          return null;
        }),
        isVisible: () => Promise.resolve(true),
        locator: vi.fn().mockReturnValue({
          first: vi.fn().mockReturnValue({
            textContent: vi.fn().mockResolvedValue("Settings Configuration"),
          }),
        }),
      };

      // Mock page locator to return enhanced modal with heading
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "#settings-modal") {
          return {
            locator: vi.fn().mockReturnValue({
              first: vi.fn().mockReturnValue({
                textContent: vi.fn().mockResolvedValue("Settings Configuration"),
                catch: vi.fn().mockImplementation((_fn) => Promise.resolve("")),
              }),
            }),
          };
        }
        return createMockLocatorWithChaining([mockModal]);
      });

      componentDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("#settings-modal"),
      } as any;

      const result = await componentDiscovery.discoverModals();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Settings Configuration");
      expect(result[0].text).toBe("Settings Configuration");
    });

    it("should enhance panels with heading information", async () => {
      const mockPanel = {
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "id") return "info-panel";
          if (attr === "class") return "panel";
          return null;
        }),
        isVisible: () => Promise.resolve(true),
        locator: vi.fn().mockReturnValue({
          first: vi.fn().mockReturnValue({
            textContent: vi.fn().mockResolvedValue("User Information"),
          }),
        }),
      };

      // Mock page locator to return enhanced panel with heading
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === "#info-panel") {
          return {
            locator: vi.fn().mockReturnValue({
              first: vi.fn().mockReturnValue({
                textContent: vi.fn().mockResolvedValue("User Information"),
                catch: vi.fn().mockImplementation((_fn) => Promise.resolve("")),
              }),
            }),
          };
        }
        return createMockLocatorWithChaining([mockPanel]);
      });

      componentDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue("#info-panel"),
      } as any;

      const result = await componentDiscovery.discoverPanels();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("User Information");
      expect(result[0].text).toBe("User Information");
    });

    it("should enhance custom components with test attributes", async () => {
      const mockCustom = {
        getAttribute: vi.fn().mockImplementation((attr: string) => {
          if (attr === "data-testid") return "profile-card";
          if (attr === "id") return "user-profile";
          if (attr === "class") return "component";
          return null;
        }),
        isVisible: () => Promise.resolve(true),
      };

      mockPage.locator.mockImplementation(() => ({
        ...createMockLocatorWithChaining([mockCustom]),
      }));

      componentDiscovery["selectorUtils"] = {
        getUniqueSelector: vi.fn().mockResolvedValue('[data-testid="profile-card"]'),
      } as any;

      const result = await componentDiscovery.discoverCustomComponents();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("user-profile"); // Uses id as name
      expect(result[0].actions).toEqual(["screenshot", "hover"]);
    });
  });
});
