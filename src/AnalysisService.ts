import type { Page } from "@playwright/test";

/**
 * Service responsible ONLY for page structure analysis
 * Single Responsibility: Analyze and report on page structure and layout
 */
export class AnalysisService {
  constructor(private page: Page) {}

  async analyzePageStructure(): Promise<PageStructureAnalysis> {
    console.log("📐 Analyzing page structure...");

    let title: string;
    try {
      title = await this.page.title();
    } catch (error) {
      title = "Unknown";
    }
    console.log(`  Page title: ${title}`);

    // Count major structural elements
    const [mainContent, headers, footers, navs, asides] = await Promise.all([
      this.page.locator('main, [role="main"], #main, .main').count(),
      this.page.locator('header, [role="banner"], .header').count(),
      this.page.locator('footer, [role="contentinfo"], .footer').count(),
      this.page.locator('nav, [role="navigation"], .nav').count(),
      this.page.locator('aside, [role="complementary"], .sidebar').count(),
    ]);

    // Count interactive elements
    const [forms, buttons, links, inputs] = await Promise.all([
      this.page.locator("form").count(),
      this.page.locator('button, [role="button"], input[type="button"]').count(),
      this.page.locator("a[href]").count(),
      this.page.locator("input, textarea, select").count(),
    ]);

    const structure: PageStructureAnalysis = {
      title,
      layout: {
        headers,
        navs,
        mainContent,
        asides,
        footers,
      },
      interactive: {
        forms,
        buttons,
        links,
        inputs,
      },
    };

    console.log(
      `  Structure: ${headers} headers, ${navs} navs, ${mainContent} main areas, ${asides} sidebars, ${footers} footers`,
    );
    console.log(
      `  Interactive: ${buttons} buttons, ${links} links, ${inputs} inputs, ${forms} forms`,
    );

    return structure;
  }

  async analyzeAccessibility(): Promise<AccessibilityAnalysis> {
    console.log("♿ Analyzing accessibility...");

    const [ariaLabels, ariaRoles, altTexts, tabindexElements] = await Promise.all([
      this.page.locator("[aria-label]").count(),
      this.page.locator("[role]").count(),
      this.page.locator("img[alt]").count(),
      this.page.locator("[tabindex]").count(),
    ]);

    const analysis: AccessibilityAnalysis = {
      ariaLabels,
      ariaRoles,
      altTexts,
      tabindexElements,
      score: this.calculateAccessibilityScore(ariaLabels, ariaRoles, altTexts),
    };

    console.log(`  Accessibility score: ${analysis.score}/100`);

    return analysis;
  }

  private calculateAccessibilityScore(
    ariaLabels: number,
    ariaRoles: number,
    altTexts: number,
  ): number {
    // Simple scoring algorithm
    let score = 50; // Base score

    if (ariaLabels > 10) score += 15;
    else if (ariaLabels > 5) score += 10;
    else if (ariaLabels > 0) score += 5;

    if (ariaRoles > 10) score += 15;
    else if (ariaRoles > 5) score += 10;
    else if (ariaRoles > 0) score += 5;

    if (altTexts > 5) score += 20;
    else if (altTexts > 0) score += 10;

    return Math.min(score, 100);
  }
}

export interface PageStructureAnalysis {
  title: string;
  layout: {
    headers: number;
    navs: number;
    mainContent: number;
    asides: number;
    footers: number;
  };
  interactive: {
    forms: number;
    buttons: number;
    links: number;
    inputs: number;
  };
}

export interface AccessibilityAnalysis {
  ariaLabels: number;
  ariaRoles: number;
  altTexts: number;
  tabindexElements: number;
  score: number;
}
