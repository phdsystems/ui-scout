import type { Page } from "@playwright/test";
import type { DiscoveredFeature, TestCase, DiscoveryOptions } from "./types";
import { DiscoveryService } from "./DiscoveryService";
import { TestingService } from "./TestingService";
import { AnalysisService } from "./AnalysisService";
import { ReportGenerator } from "./ReportGenerator";
import type { TestExecutionResult } from "./TestExecutor";

/**
 * Lightweight coordinator that delegates to specialized services
 * Single Responsibility: Coordinate between independent services
 *
 * This replaces the previous FeatureDiscoveryOrchestrator with better SRP
 */
export class FeatureDiscoveryCoordinator {
  private discoveryService: DiscoveryService;
  private testingService: TestingService;
  private analysisService: AnalysisService;
  private reportGenerator: ReportGenerator;

  constructor(
    private page: Page,
    private options: DiscoveryOptions = {},
  ) {
    this.discoveryService = new DiscoveryService(page);
    this.testingService = new TestingService(page, options.screenshotPath);
    this.analysisService = new AnalysisService(page);
    this.reportGenerator = new ReportGenerator();
  }

  /**
   * Discovery ONLY - no test execution
   */
  async discoverFeatures(): Promise<DiscoveryResult> {
    const features = await this.discoveryService.discoverAllFeatures();
    const dynamicFeatures = await this.discoveryService.discoverDynamicFeatures(features);
    const allFeatures = [...features, ...dynamicFeatures];

    return {
      features: allFeatures,
      count: allFeatures.length,
      byType: this.groupFeaturesByType(allFeatures),
    };
  }

  /**
   * Test generation ONLY - no execution
   */
  async generateTests(features: DiscoveredFeature[]): Promise<TestCase[]> {
    return await this.testingService.generateTestCases(features);
  }

  /**
   * Test execution ONLY - requires test cases
   */
  async executeTests(testCases: TestCase[]): Promise<TestExecutionResult[]> {
    return await this.testingService.executeTestCases(testCases);
  }

  /**
   * Analysis ONLY - page structure and accessibility
   */
  async analyzePage(): Promise<AnalysisResult> {
    const [structure, accessibility] = await Promise.all([
      this.analysisService.analyzePageStructure(),
      this.analysisService.analyzeAccessibility(),
    ]);

    return {
      structure,
      accessibility,
      url: this.page.url(),
    };
  }

  /**
   * Report generation ONLY
   */
  async generateReports(
    features: DiscoveredFeature[],
    testCases: TestCase[],
    testResults: TestExecutionResult[],
  ): Promise<void> {
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

  /**
   * Convenience method for complete flow
   * Delegates to individual services in sequence
   */
  async runComplete(): Promise<CompleteResult> {
    // 1. Discovery
    const discoveryResult = await this.discoverFeatures();

    // 2. Analysis
    const analysisResult = await this.analyzePage();

    // 3. Test Generation
    const testCases = await this.generateTests(discoveryResult.features);

    // 4. Optional Test Execution
    let testResults: TestExecutionResult[] = [];
    if (this.options.includeTestExecution !== false) {
      testResults = await this.executeTests(testCases);
    }

    // 5. Report Generation
    await this.generateReports(discoveryResult.features, testCases, testResults);

    return {
      discovery: discoveryResult,
      analysis: analysisResult,
      testing: {
        testCases,
        testResults,
        executed: this.options.includeTestExecution !== false,
      },
    };
  }

  private groupFeaturesByType(features: DiscoveredFeature[]): Record<string, number> {
    const byType: Record<string, number> = {};

    for (const feature of features) {
      byType[feature.type] = (byType[feature.type] || 0) + 1;
    }

    return byType;
  }
}

// Result interfaces
interface DiscoveryResult {
  features: DiscoveredFeature[];
  count: number;
  byType: Record<string, number>;
}

interface AnalysisResult {
  structure: any;
  accessibility: any;
  url: string;
}

interface CompleteResult {
  discovery: DiscoveryResult;
  analysis: AnalysisResult;
  testing: {
    testCases: TestCase[];
    testResults: TestExecutionResult[];
    executed: boolean;
  };
}

// Extend DiscoveryOptions
declare module "./types" {
  interface DiscoveryOptions {
    includeTestExecution?: boolean;
  }
}
