import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AnalysisService } from "../src/AnalysisService";

describe("AnalysisService - Comprehensive Tests", () => {
  let mockPage: any;
  let analysisService: AnalysisService;

  beforeEach(() => {
    // Create a mock page object that matches Playwright's Page interface
    mockPage = {
      locator: vi.fn().mockReturnValue({
        count: vi.fn().mockResolvedValue(0),
      }),
      title: vi.fn().mockResolvedValue("Test Page"),
      url: vi.fn().mockReturnValue("https://test.com"),
      goto: vi.fn(),
      waitForTimeout: vi.fn(),
      evaluate: vi.fn(),
    };

    analysisService = new AnalysisService(mockPage);
    vi.clearAllMocks();
    
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Constructor and Initialization", () => {
    it("should initialize with page reference", () => {
      const service = new AnalysisService(mockPage);
      expect(service).toBeDefined();
      expect(service["page"]).toBe(mockPage);
    });

    it("should handle null/undefined page", () => {
      expect(() => new AnalysisService(null as any)).not.toThrow();
      expect(() => new AnalysisService(undefined as any)).not.toThrow();
    });
  });

  describe("analyzePageStructure", () => {
    it("should analyze complete page structure", async () => {
      mockPage.title.mockResolvedValue("Test Page");
      
      const mockCounts = {
        'main, [role="main"], #main, .main': 1,
        'header, [role="banner"], .header': 1,
        'footer, [role="contentinfo"], .footer': 1,
        'nav, [role="navigation"], .nav': 2,
        'aside, [role="complementary"], .sidebar': 1,
        'form': 2,
        'button, [role="button"], input[type="button"]': 5,
        'a[href]': 10,
        'input, textarea, select': 3
      };

      mockPage.locator.mockImplementation((selector: string) => ({
        count: vi.fn().mockResolvedValue(mockCounts[selector] || 0)
      }));

      const structure = await analysisService.analyzePageStructure();

      expect(structure).toBeDefined();
      expect(structure.title).toBe("Test Page");
      expect(structure.layout).toBeDefined();
      expect(structure.interactive).toBeDefined();
      
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Analyzing page structure"));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Page title: Test Page"));
    });

    it("should handle different page structures", async () => {
      mockPage.title.mockResolvedValue("Complex Page");
      
      const mockCounts = {
        'main, [role="main"], #main, .main': 2,
        'header, [role="banner"], .header': 3,
        'footer, [role="contentinfo"], .footer': 1,
        'nav, [role="navigation"], .nav': 4,
        'aside, [role="complementary"], .sidebar': 2,
        'form': 5,
        'button, [role="button"], input[type="button"]': 15,
        'a[href]': 25,
        'input, textarea, select': 8
      };

      mockPage.locator.mockImplementation((selector: string) => ({
        count: vi.fn().mockResolvedValue(mockCounts[selector] || 0)
      }));

      const structure = await analysisService.analyzePageStructure();

      expect(structure.layout.mainContent).toBe(2);
      expect(structure.layout.headers).toBe(3);
      expect(structure.layout.footers).toBe(1);
      expect(structure.layout.navs).toBe(4);
      expect(structure.layout.asides).toBe(2);
      
      expect(structure.interactive.forms).toBe(5);
      expect(structure.interactive.buttons).toBe(15);
      expect(structure.interactive.links).toBe(25);
      expect(structure.interactive.inputs).toBe(8);
    });

    it("should handle empty page structure", async () => {
      mockPage.title.mockResolvedValue("Empty Page");
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(0)
      }));

      const structure = await analysisService.analyzePageStructure();

      expect(structure.layout.mainContent).toBe(0);
      expect(structure.layout.headers).toBe(0);
      expect(structure.layout.footers).toBe(0);
      expect(structure.layout.navs).toBe(0);
      expect(structure.layout.asides).toBe(0);
      
      expect(structure.interactive.forms).toBe(0);
      expect(structure.interactive.buttons).toBe(0);
      expect(structure.interactive.links).toBe(0);
      expect(structure.interactive.inputs).toBe(0);
    });

    it("should handle title retrieval errors", async () => {
      mockPage.title.mockRejectedValue(new Error("Title error"));
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(1)
      }));

      const structure = await analysisService.analyzePageStructure();

      expect(structure.title).toBe("Unknown");
    });

    it("should handle locator count errors", async () => {
      mockPage.title.mockResolvedValue("Test Page");
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockRejectedValue(new Error("Count error"))
      }));

      await expect(analysisService.analyzePageStructure()).rejects.toThrow();
    });
  });

  describe("analyzeAccessibility", () => {
    it("should analyze accessibility features", async () => {
      const mockCounts = {
        '[aria-label]': 5,
        '[role]': 8,
        'img[alt]': 3,
        '[tabindex]': 2
      };

      mockPage.locator.mockImplementation((selector: string) => ({
        count: vi.fn().mockResolvedValue(mockCounts[selector] || 0)
      }));

      const analysis = await analysisService.analyzeAccessibility();

      expect(analysis.ariaLabels).toBe(5);
      expect(analysis.ariaRoles).toBe(8);
      expect(analysis.altTexts).toBe(3);
      expect(analysis.tabindexElements).toBe(2);
      expect(analysis.score).toBeGreaterThan(50); // Should be better than base score

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Analyzing accessibility"));
    });

    it("should handle zero accessibility elements", async () => {
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(0)
      }));

      const analysis = await analysisService.analyzeAccessibility();

      expect(analysis.ariaLabels).toBe(0);
      expect(analysis.ariaRoles).toBe(0);
      expect(analysis.altTexts).toBe(0);
      expect(analysis.tabindexElements).toBe(0);
      expect(analysis.score).toBe(50); // Base score is 50
    });

    it("should handle accessibility count errors", async () => {
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector === '[aria-label]') {
          throw new Error("Selector error");
        }
        return {
          count: vi.fn().mockResolvedValue(0)
        };
      });

      await expect(analysisService.analyzeAccessibility()).rejects.toThrow();
    });

    it("should calculate accessibility score based on features", async () => {
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(2)
      }));

      const analysis = await analysisService.analyzeAccessibility();

      expect(analysis.ariaLabels).toBe(2);
      expect(analysis.ariaRoles).toBe(2);
      expect(analysis.altTexts).toBe(2);
      expect(analysis.tabindexElements).toBe(2);
      expect(analysis.score).toBeGreaterThan(50);
    });
  });

  describe("calculateAccessibilityScore (private method)", () => {
    it("should calculate score based on accessibility features", () => {
      // Test via public method
      const score1 = analysisService["calculateAccessibilityScore"](0, 0, 0);
      expect(score1).toBe(50); // Base score is 50

      const score2 = analysisService["calculateAccessibilityScore"](10, 10, 10);
      expect(score2).toBeGreaterThan(0);
      expect(score2).toBeLessThanOrEqual(100);

      const score3 = analysisService["calculateAccessibilityScore"](15, 15, 10);
      expect(score3).toBeGreaterThan(0);
    });

    it("should never exceed maximum score", () => {
      const maxScore = analysisService["calculateAccessibilityScore"](100, 100, 100);
      expect(maxScore).toBeLessThanOrEqual(100);
    });

    it("should provide different scores for different inputs", () => {
      const lowScore = analysisService["calculateAccessibilityScore"](1, 1, 1);
      const mediumScore = analysisService["calculateAccessibilityScore"](6, 6, 3);
      const highScore = analysisService["calculateAccessibilityScore"](15, 15, 10);

      expect(lowScore).toBeLessThan(mediumScore);
      expect(mediumScore).toBeLessThan(highScore);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle page not ready errors", async () => {
      mockPage.title.mockRejectedValue(new Error("Page not ready"));
      mockPage.locator.mockImplementation(() => {
        throw new Error("Page not ready");
      });

      await expect(analysisService.analyzePageStructure()).rejects.toThrow();
    });

    it("should handle network timeout errors", async () => {
      mockPage.title.mockRejectedValue(new Error("Timeout"));
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockRejectedValue(new Error("Timeout"))
      }));

      await expect(analysisService.analyzePageStructure()).rejects.toThrow();
    });

    it("should handle large page analysis", async () => {
      // Mock very large page
      mockPage.title.mockResolvedValue("Large Page");
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(1000)
      }));

      const startTime = Date.now();
      const structure = await analysisService.analyzePageStructure();
      const duration = Date.now() - startTime;

      expect(structure).toBeDefined();
      expect(structure.interactive.buttons).toBe(1000);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it("should handle concurrent analysis calls", async () => {
      mockPage.title.mockResolvedValue("Concurrent Test");
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(5)
      }));

      // Run multiple analyses concurrently
      const promises = [
        analysisService.analyzePageStructure(),
        analysisService.analyzeAccessibility()
      ];

      const [structure, accessibility] = await Promise.all(promises);

      expect(structure).toBeDefined();
      expect(accessibility).toBeDefined();
    });

    it("should handle malformed selector errors", async () => {
      mockPage.title.mockResolvedValue("Malformed Test");
      mockPage.locator.mockImplementation((selector: string) => {
        if (selector.includes('main')) {
          throw new Error("Invalid selector");
        }
        return {
          count: vi.fn().mockResolvedValue(1)
        };
      });

      await expect(analysisService.analyzePageStructure()).rejects.toThrow("Invalid selector");
    });
  });

  describe("Integration with Page API", () => {
    it("should use correct selectors for structure analysis", async () => {
      mockPage.title.mockResolvedValue("Selector Test");
      const mockLocator = vi.fn().mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(1)
      }));
      mockPage.locator = mockLocator;

      await analysisService.analyzePageStructure();

      // Verify correct selectors were used
      expect(mockLocator).toHaveBeenCalledWith('main, [role="main"], #main, .main');
      expect(mockLocator).toHaveBeenCalledWith('header, [role="banner"], .header');
      expect(mockLocator).toHaveBeenCalledWith('footer, [role="contentinfo"], .footer');
      expect(mockLocator).toHaveBeenCalledWith('nav, [role="navigation"], .nav');
      expect(mockLocator).toHaveBeenCalledWith('aside, [role="complementary"], .sidebar');
    });

    it("should use correct selectors for accessibility analysis", async () => {
      const mockLocator = vi.fn().mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(1)
      }));
      mockPage.locator = mockLocator;

      await analysisService.analyzeAccessibility();

      // Verify accessibility selectors
      expect(mockLocator).toHaveBeenCalledWith('[aria-label]');
      expect(mockLocator).toHaveBeenCalledWith('[role]');
      expect(mockLocator).toHaveBeenCalledWith('img[alt]');
      expect(mockLocator).toHaveBeenCalledWith('[tabindex]');
    });
  });

  describe("Analysis Results Structure", () => {
    it("should return properly structured page analysis", async () => {
      mockPage.title.mockResolvedValue("Structure Test");
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(1)
      }));

      const structure = await analysisService.analyzePageStructure();

      expect(structure).toMatchObject({
        title: expect.any(String),
        layout: {
          headers: expect.any(Number),
          navs: expect.any(Number),
          mainContent: expect.any(Number),
          asides: expect.any(Number),
          footers: expect.any(Number)
        },
        interactive: {
          forms: expect.any(Number),
          buttons: expect.any(Number),
          links: expect.any(Number),
          inputs: expect.any(Number)
        }
      });
    });

    it("should return properly structured accessibility analysis", async () => {
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(1)
      }));

      const accessibility = await analysisService.analyzeAccessibility();

      expect(accessibility).toMatchObject({
        ariaLabels: expect.any(Number),
        ariaRoles: expect.any(Number),
        altTexts: expect.any(Number),
        tabindexElements: expect.any(Number),
        score: expect.any(Number)
      });
    });
  });

  describe("Performance and Optimization", () => {
    it("should handle rapid successive calls", async () => {
      mockPage.title.mockResolvedValue("Performance Test");
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(1)
      }));

      const promises = Array.from({ length: 10 }, () => 
        analysisService.analyzePageStructure()
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.title).toBe("Performance Test");
      });
    });

    it("should handle memory-intensive operations", async () => {
      mockPage.title.mockResolvedValue("Memory Test");
      mockPage.locator.mockImplementation(() => ({
        count: vi.fn().mockResolvedValue(10000)
      }));

      const structure = await analysisService.analyzePageStructure();

      expect(structure.interactive.buttons).toBe(10000);
      expect(structure.interactive.links).toBe(10000);
    });
  });
});