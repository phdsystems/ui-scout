import { describe, it, expect, beforeEach, vi } from "vitest";
import { AnalysisService } from "../src/AnalysisService";
import { createMockPage } from "./mocks/playwright.mock";

describe("AnalysisService", () => {
  let mockPage: any;
  let analysisService: AnalysisService;

  beforeEach(() => {
    mockPage = createMockPage();
    analysisService = new AnalysisService(mockPage);
    vi.clearAllMocks();
  });

  describe("analyzePageStructure", () => {
    it("should analyze basic page structure", async () => {
      // Mock page elements
      mockPage.locator.mockImplementation((selector: string) => {
        const counts: Record<string, number> = {
          'main, [role="main"], #main, .main': 1,
          'header, [role="banner"], .header': 1,
          'footer, [role="contentinfo"], .footer': 1,
          'nav, [role="navigation"], .nav': 1,
          'aside, [role="complementary"], .sidebar': 1,
          form: 2,
          'button, [role="button"], input[type="button"]': 5,
          "a[href]": 3,
          "input, textarea, select": 4,
        };

        return {
          count: vi.fn().mockResolvedValue(counts[selector] || 0),
        };
      });

      mockPage.title.mockResolvedValue("Test Page");

      const result = await analysisService.analyzePageStructure();

      expect(result).toMatchObject({
        title: "Test Page",
        layout: {
          headers: 1,
          navs: 1,
          mainContent: 1,
          asides: 1,
          footers: 1,
        },
        interactive: {
          buttons: 5,
          links: 3,
          inputs: 4,
          forms: 2,
        },
      });
    });

    it("should analyze page layout structure", async () => {
      mockPage.locator.mockImplementation((selector: string) => {
        const counts: Record<string, number> = {
          'main, [role="main"], #main, .main': 0,
          'header, [role="banner"], .header': 0,
          'footer, [role="contentinfo"], .footer': 0,
          'nav, [role="navigation"], .nav': 2,
          'aside, [role="complementary"], .sidebar': 0,
          form: 0,
          'button, [role="button"], input[type="button"]': 1,
          "a[href]": 2,
          "input, textarea, select": 0,
        };

        return {
          count: vi.fn().mockResolvedValue(counts[selector] || 0),
        };
      });

      mockPage.title.mockResolvedValue("Simple Page");

      const result = await analysisService.analyzePageStructure();

      expect(result.title).toBe("Simple Page");
      expect(result.layout.navs).toBe(2);
      expect(result.interactive.buttons).toBe(1);
      expect(result.interactive.links).toBe(2);
    });

    it("should analyze interactive elements", async () => {
      mockPage.locator.mockImplementation((selector: string) => {
        const counts: Record<string, number> = {
          'main, [role="main"], #main, .main': 1,
          'header, [role="banner"], .header': 1,
          'footer, [role="contentinfo"], .footer': 1,
          'nav, [role="navigation"], .nav': 1,
          'aside, [role="complementary"], .sidebar': 0,
          form: 3,
          'button, [role="button"], input[type="button"]': 10,
          "a[href]": 15,
          "input, textarea, select": 8,
        };

        return {
          count: vi.fn().mockResolvedValue(counts[selector] || 0),
        };
      });

      mockPage.title.mockResolvedValue("Interactive Page");

      const result = await analysisService.analyzePageStructure();

      expect(result.title).toBe("Interactive Page");
      expect(result.interactive.buttons).toBe(10);
      expect(result.interactive.links).toBe(15);
      expect(result.interactive.inputs).toBe(8);
      expect(result.interactive.forms).toBe(3);
    });

    it("should handle pages with all layout sections", async () => {
      mockPage.locator.mockImplementation((selector: string) => {
        const counts: Record<string, number> = {
          'main, [role="main"], #main, .main': 1,
          'header, [role="banner"], .header': 2,
          'footer, [role="contentinfo"], .footer': 1,
          'nav, [role="navigation"], .nav': 3,
          'aside, [role="complementary"], .sidebar': 2,
          form: 5,
          'button, [role="button"], input[type="button"]': 20,
          "a[href]": 30,
          "input, textarea, select": 15,
        };

        return {
          count: vi.fn().mockResolvedValue(counts[selector] || 0),
        };
      });

      mockPage.title.mockResolvedValue("Complex Page");

      const result = await analysisService.analyzePageStructure();

      expect(result.title).toBe("Complex Page");
      expect(result.layout.headers).toBe(2);
      expect(result.layout.navs).toBe(3);
      expect(result.layout.mainContent).toBe(1);
      expect(result.layout.asides).toBe(2);
      expect(result.layout.footers).toBe(1);
      expect(result.interactive.buttons).toBe(20);
      expect(result.interactive.links).toBe(30);
    });

    it("should handle empty pages", async () => {
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(0),
      }));

      mockPage.title.mockResolvedValue("Empty Page");

      const result = await analysisService.analyzePageStructure();

      expect(result.title).toBe("Empty Page");
      expect(result.layout.headers).toBe(0);
      expect(result.layout.navs).toBe(0);
      expect(result.interactive.buttons).toBe(0);
      expect(result.interactive.links).toBe(0);
      expect(result.interactive.inputs).toBe(0);
      expect(result.interactive.forms).toBe(0);
    });

    it("should handle pages with mixed layout sections", async () => {
      mockPage.locator.mockImplementation((selector: string) => {
        const counts: Record<string, number> = {
          'main, [role="main"], #main, .main': 2,
          'header, [role="banner"], .header': 1,
          'footer, [role="contentinfo"], .footer': 0,
          'nav, [role="navigation"], .nav': 0,
          'aside, [role="complementary"], .sidebar': 0,
          form: 1,
          'button, [role="button"], input[type="button"]': 5,
          "a[href]": 0,
          "input, textarea, select": 3,
        };

        return {
          count: vi.fn().mockResolvedValue(counts[selector] || 0),
        };
      });

      mockPage.title.mockResolvedValue("Mixed Layout Page");

      const result = await analysisService.analyzePageStructure();

      expect(result.title).toBe("Mixed Layout Page");
      expect(result.layout.headers).toBe(1);
      expect(result.layout.navs).toBe(0);
      expect(result.layout.mainContent).toBe(2);
      expect(result.interactive.buttons).toBe(5);
      expect(result.interactive.links).toBe(0);
      expect(result.interactive.inputs).toBe(3);
    });

    it("should provide consistent structure for all analysis results", async () => {
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(0),
      }));

      mockPage.title.mockResolvedValue("Consistent Page");

      const result = await analysisService.analyzePageStructure();

      expect(result).toHaveProperty("title");
      expect(result).toHaveProperty("layout");
      expect(result).toHaveProperty("interactive");

      expect(result.layout).toHaveProperty("headers");
      expect(result.layout).toHaveProperty("navs");
      expect(result.layout).toHaveProperty("mainContent");
      expect(result.layout).toHaveProperty("asides");
      expect(result.layout).toHaveProperty("footers");

      expect(result.interactive).toHaveProperty("buttons");
      expect(result.interactive).toHaveProperty("links");
      expect(result.interactive).toHaveProperty("inputs");
      expect(result.interactive).toHaveProperty("forms");
    });

    it("should handle title retrieval errors", async () => {
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(5),
      }));

      mockPage.title.mockRejectedValue(new Error("Title retrieval failed"));

      const result = await analysisService.analyzePageStructure();

      expect(result.title).toBe("Unknown");
      expect(result.layout.headers).toBe(5);
      expect(result.interactive.buttons).toBe(5);
    });
  });

  describe("analyzeAccessibility", () => {
    it("should analyze accessibility with high scores", async () => {
      mockPage.locator.mockImplementation((selector: string) => {
        const counts: Record<string, number> = {
          "[aria-label]": 15,
          "[role]": 15,
          "img[alt]": 10,
          "[tabindex]": 5,
        };

        return {
          count: vi.fn().mockResolvedValue(counts[selector] || 0),
        };
      });

      const result = await analysisService.analyzeAccessibility();

      expect(result).toMatchObject({
        ariaLabels: 15,
        ariaRoles: 15,
        altTexts: 10,
        tabindexElements: 5,
        score: 100, // Max score with these values
      });
    });

    it("should analyze accessibility with medium scores", async () => {
      mockPage.locator.mockImplementation((selector: string) => {
        const counts: Record<string, number> = {
          "[aria-label]": 7,
          "[role]": 7,
          "img[alt]": 3,
          "[tabindex]": 2,
        };

        return {
          count: vi.fn().mockResolvedValue(counts[selector] || 0),
        };
      });

      const result = await analysisService.analyzeAccessibility();

      expect(result).toMatchObject({
        ariaLabels: 7,
        ariaRoles: 7,
        altTexts: 3,
        tabindexElements: 2,
        score: 80, // Base 50 + 10 + 10 + 10
      });
    });

    it("should analyze accessibility with low scores", async () => {
      mockPage.locator.mockImplementation((selector: string) => {
        const counts: Record<string, number> = {
          "[aria-label]": 2,
          "[role]": 2,
          "img[alt]": 0,
          "[tabindex]": 0,
        };

        return {
          count: vi.fn().mockResolvedValue(counts[selector] || 0),
        };
      });

      const result = await analysisService.analyzeAccessibility();

      expect(result).toMatchObject({
        ariaLabels: 2,
        ariaRoles: 2,
        altTexts: 0,
        tabindexElements: 0,
        score: 60, // Base 50 + 5 + 5 + 0
      });
    });

    it("should analyze accessibility with zero elements", async () => {
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(0),
      }));

      const result = await analysisService.analyzeAccessibility();

      expect(result).toMatchObject({
        ariaLabels: 0,
        ariaRoles: 0,
        altTexts: 0,
        tabindexElements: 0,
        score: 50, // Base score only
      });
    });
  });

  describe("error handling", () => {
    it("should handle locator errors gracefully", async () => {
      mockPage.locator.mockImplementation(() => {
        throw new Error("Locator failed");
      });

      await expect(analysisService.analyzePageStructure()).rejects.toThrow("Locator failed");
    });

    it("should handle count method failures", async () => {
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockRejectedValue(new Error("Count failed")),
      }));

      await expect(analysisService.analyzePageStructure()).rejects.toThrow("Count failed");
    });
  });
});
