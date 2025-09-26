import type { Page } from "@playwright/test";
import type { DiscoveredFeature, TestCase, DiscoveryOptions } from "./types";
import { ButtonDiscovery } from "./ButtonDiscovery";
import { InputDiscovery } from "./InputDiscovery";
import { ComponentDiscovery } from "./ComponentDiscovery";
import { NavigationDiscovery } from "./NavigationDiscovery";
import { TestCaseGenerator } from "./TestCaseGenerator";
import type { TestExecutionResult } from "./TestExecutor";
import { TestExecutor } from "./TestExecutor";
import { ReportGenerator } from "./ReportGenerator";

/**
 * Main orchestrator class that coordinates all discovery services
 * Single Responsibility: Orchestration and coordination of discovery process
 */
export class FeatureDiscoveryOrchestrator {
  private buttonDiscovery: ButtonDiscovery;
  private inputDiscovery: InputDiscovery;
  private componentDiscovery: ComponentDiscovery;
  private navigationDiscovery: NavigationDiscovery;
  private testCaseGenerator: TestCaseGenerator;
  private testExecutor: TestExecutor;
  private reportGenerator: ReportGenerator;

  constructor(
    private page: Page,
    private options: DiscoveryOptions = {},
  ) {
    this.buttonDiscovery = new ButtonDiscovery(page);
    this.inputDiscovery = new InputDiscovery(page);
    this.componentDiscovery = new ComponentDiscovery(page);
    this.navigationDiscovery = new NavigationDiscovery(page);
    this.testCaseGenerator = new TestCaseGenerator(this.inputDiscovery);
    this.testExecutor = new TestExecutor(page, options.screenshotPath);
    this.reportGenerator = new ReportGenerator();
  }

  async runCompleteDiscovery(): Promise<DiscoveryResult> {
    console.log("🔍 Starting comprehensive feature discovery...\n");

    // Phase 1: Discover all features
    const features = await this.discoverAllFeatures();

    // Phase 2: Analyze page structure
    await this.analyzePageStructure();

    // Phase 3: Discover dynamic features
    await this.discoverDynamicFeatures(features);

    // Phase 4: Generate test cases
    const testCases = await this.testCaseGenerator.generateTestCases(features);

    // Phase 5: Execute tests (optional)
    let testResults: TestExecutionResult[] = [];
    if (this.options.includeTestExecution !== false) {
      testResults = await this.testExecutor.executeTestCases(testCases);
    }

    // Phase 6: Generate reports
    await this.generateAllReports(features, testCases, testResults);

    return {
      features,
      testCases,
      testResults,
      statistics: this.calculateStatistics(features, testResults),
    };
  }

  private async discoverAllFeatures(): Promise<DiscoveredFeature[]> {
    console.log("📋 Discovering all UI features...\n");

    const allFeatures: DiscoveredFeature[] = [];

    // Discover different types of elements in parallel for better performance
    const [
      buttons,
      inputs,
      charts,
      panels,
      modals,
      tables,
      customComponents,
      menus,
      dropdowns,
      tabs,
    ] = await Promise.all([
      this.buttonDiscovery.discoverButtons(),
      this.inputDiscovery.discoverInputs(),
      this.componentDiscovery.discoverCharts(),
      this.componentDiscovery.discoverPanels(),
      this.componentDiscovery.discoverModals(),
      this.componentDiscovery.discoverTables(),
      this.componentDiscovery.discoverCustomComponents(),
      this.navigationDiscovery.discoverMenus(),
      this.navigationDiscovery.discoverDropdowns(),
      this.navigationDiscovery.discoverTabs(),
    ]);

    // Combine all discovered features
    allFeatures.push(
      ...buttons,
      ...inputs,
      ...charts,
      ...panels,
      ...modals,
      ...tables,
      ...customComponents,
      ...menus,
      ...dropdowns,
      ...tabs,
    );

    console.log(`\n✅ Discovery complete! Found ${allFeatures.length} features total\n`);
    return allFeatures;
  }

  private async analyzePageStructure(): Promise<void> {
    console.log("📐 Analyzing page structure...");

    const title = await this.page.title();
    console.log(`  Page title: ${title}`);

    // Count major structural elements
    const [mainContent, headers, footers, navs, asides] = await Promise.all([
      this.page.locator('main, [role="main"], #main, .main').count(),
      this.page.locator('header, [role="banner"], .header').count(),
      this.page.locator('footer, [role="contentinfo"], .footer').count(),
      this.page.locator('nav, [role="navigation"], .nav').count(),
      this.page.locator('aside, [role="complementary"], .sidebar').count(),
    ]);

    console.log(
      `  Structure: ${headers} headers, ${navs} navs, ${mainContent} main areas, ${asides} sidebars, ${footers} footers`,
    );

    // Count interactive elements
    const [forms, buttons, links, inputs] = await Promise.all([
      this.page.locator("form").count(),
      this.page.locator('button, [role="button"], input[type="button"]').count(),
      this.page.locator("a[href]").count(),
      this.page.locator("input, textarea, select").count(),
    ]);

    console.log(
      `  Interactive: ${buttons} buttons, ${links} links, ${inputs} inputs, ${forms} forms`,
    );
  }

  private async discoverDynamicFeatures(existingFeatures: DiscoveredFeature[]): Promise<void> {
    console.log("\n🔄 Discovering dynamic features through interaction...");

    // Enhance buttons with tooltips
    const buttons = existingFeatures.filter((f) => f.type === "button");
    await this.buttonDiscovery.discoverTooltips(buttons);

    // Try interacting with navigation elements to reveal hidden features
    const navItems = existingFeatures.filter(
      (f) =>
        f.type === "menu" || f.selector.includes("nav") || f.attributes?.class?.includes("nav"),
    );

    for (const nav of navItems.slice(0, 5)) {
      // Limit interactions
      try {
        console.log(`  Interacting with: ${nav.name}`);
        const element = this.page.locator(nav.selector);

        if (await element.isVisible()) {
          await element.hover();
          await this.page.waitForTimeout(500);

          // Check for newly visible elements
          await this.checkForDynamicElements();
        }
      } catch (e) {
        // Continue with other elements
      }
    }
  }

  private async checkForDynamicElements(): Promise<void> {
    const dynamicSelectors = [
      ".dropdown-menu:visible",
      ".submenu:visible",
      '[class*="popup"]:visible',
      '[class*="overlay"]:visible',
      '[class*="modal"]:visible',
    ];

    for (const selector of dynamicSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 500 })) {
          const text = (await element.textContent()) || "";
          console.log(`    Discovered dynamic element: ${text.substring(0, 50)}`);
        }
      } catch (e) {
        // Continue checking other selectors
      }
    }
  }

  private async generateAllReports(
    features: DiscoveredFeature[],
    testCases: TestCase[],
    testResults: TestExecutionResult[],
  ): Promise<void> {
    console.log("\n📊 Generating reports...");

    // Generate all reports in parallel
    await Promise.all([
      this.reportGenerator.generateDiscoveryReport(
        this.page.url(),
        features,
        testCases,
        "feature-discovery-report.json",
      ),
      this.reportGenerator.generateHtmlReport(
        features,
        testCases,
        testResults,
        "intelligent-test-report.html",
      ),
      this.reportGenerator.generateMarkdownSummary(
        features,
        testCases,
        testResults,
        "combined-test-report.md",
      ),
    ]);
  }

  private calculateStatistics(features: DiscoveredFeature[], testResults: TestExecutionResult[]) {
    const byType: Record<string, number> = {};

    for (const feature of features) {
      byType[feature.type] = (byType[feature.type] || 0) + 1;
    }

    const passed = testResults.filter((r) => r.passed).length;
    const failed = testResults.filter((r) => !r.passed).length;

    return {
      featuresDiscovered: features.length,
      testCasesGenerated: testResults.length,
      testsPassed: passed,
      testsFailed: failed,
      successRate:
        testResults.length > 0 ? ((passed / testResults.length) * 100).toFixed(1) + "%" : "0%",
      featuresByType: byType,
      interactiveElements: features.filter((f) => f.actions && f.actions.length > 0).length,
      elementsWithText: features.filter((f) => f.text).length,
    };
  }
}

export interface DiscoveryResult {
  features: DiscoveredFeature[];
  testCases: TestCase[];
  testResults: TestExecutionResult[];
  statistics: {
    featuresDiscovered: number;
    testCasesGenerated: number;
    testsPassed: number;
    testsFailed: number;
    successRate: string;
    featuresByType: Record<string, number>;
    interactiveElements: number;
    elementsWithText: number;
  };
}

// Extend DiscoveryOptions to include test execution
declare module "./types" {
  interface DiscoveryOptions {
    includeTestExecution?: boolean;
  }
}
