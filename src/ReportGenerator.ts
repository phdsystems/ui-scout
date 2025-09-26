import * as fs from "fs";
import type { DiscoveredFeature, TestCase, DiscoveryReport } from "./types";

/**
 * Service class for generating discovery and test reports
 * Single Responsibility: Report generation, statistics calculation, and file output
 */
export class ReportGenerator {
  async generateDiscoveryReport(
    url: string,
    features: DiscoveredFeature[],
    testCases: TestCase[],
    filename: string,
  ): Promise<void> {
    const report: DiscoveryReport = {
      timestamp: new Date().toISOString(),
      url: url,
      featuresDiscovered: features.length,
      features: features,
      testCases: testCases,
      statistics: this.calculateStatistics(features),
    };

    await this.saveJsonReport(report, filename);
    console.log(`\n📄 Discovery report saved to ${filename}`);
  }

  async generateHtmlReport(
    features: DiscoveredFeature[],
    testCases: TestCase[],
    testResults: TestExecutionResult[],
    filename: string,
  ): Promise<void> {
    const html = this.createHtmlReport(features, testCases, testResults);
    await fs.promises.writeFile(filename, html);
    console.log(`📄 HTML report saved to ${filename}`);
  }

  async generateMarkdownSummary(
    features: DiscoveredFeature[],
    testCases: TestCase[],
    testResults: TestExecutionResult[],
    filename: string,
  ): Promise<void> {
    const markdown = this.createMarkdownReport(features, testCases, testResults);
    await fs.promises.writeFile(filename, markdown);
    console.log(`📄 Markdown report saved to ${filename}`);
  }

  private calculateStatistics(features: DiscoveredFeature[]) {
    return {
      byType: this.getFeatureStatsByType(features),
      interactive: features.filter((f) => f.actions && f.actions.length > 0).length,
      withText: features.filter((f) => f.text).length,
      withAttributes: features.filter((f) => f.attributes && Object.keys(f.attributes).length > 0)
        .length,
    };
  }

  private getFeatureStatsByType(features: DiscoveredFeature[]): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const feature of features) {
      stats[feature.type] = (stats[feature.type] || 0) + 1;
    }

    return stats;
  }

  private async saveJsonReport(report: DiscoveryReport, filename: string): Promise<void> {
    await fs.promises.writeFile(filename, JSON.stringify(report, null, 2));
  }

  private createHtmlReport(
    features: DiscoveredFeature[],
    testCases: TestCase[],
    testResults: TestExecutionResult[],
  ): string {
    const stats = this.calculateStatistics(features);
    const passed = testResults.filter((r) => r.passed).length;
    const failed = testResults.filter((r) => !r.passed).length;
    const successRate =
      testResults.length > 0 ? ((passed / testResults.length) * 100).toFixed(1) : "0";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feature Discovery Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; color: #007cba; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
        .feature-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fff; }
        .feature-type { display: inline-block; padding: 4px 8px; background: #007cba; color: white; border-radius: 4px; font-size: 0.8em; }
        .test-results { margin: 20px 0; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Feature Discovery Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${features.length}</div>
            <div>Features Discovered</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${testCases.length}</div>
            <div>Test Cases Generated</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${successRate}%</div>
            <div>Success Rate</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.interactive}</div>
            <div>Interactive Elements</div>
        </div>
    </div>

    <h2>📊 Feature Types</h2>
    <div class="stats">
        ${Object.entries(stats.byType)
          .map(
            ([type, count]) => `
            <div class="stat-card">
                <div class="stat-number">${count}</div>
                <div>${type.charAt(0).toUpperCase() + type.slice(1)}s</div>
            </div>
        `,
          )
          .join("")}
    </div>

    <h2>🧪 Test Results</h2>
    <div class="test-results">
        <p><span class="passed">✅ Passed: ${passed}</span> | <span class="failed">❌ Failed: ${failed}</span></p>
        ${testResults
          .slice(0, 10)
          .map(
            (result) => `
            <div class="feature-card">
                <h4>${result.passed ? "✅" : "❌"} ${result.featureName}</h4>
                ${result.error ? `<p class="failed">Error: ${result.error}</p>` : '<p class="passed">Test passed successfully</p>'}
            </div>
        `,
          )
          .join("")}
    </div>

    <h2>📋 Discovered Features</h2>
    <div class="features-grid">
        ${features
          .slice(0, 20)
          .map(
            (feature) => `
            <div class="feature-card">
                <span class="feature-type">${feature.type}</span>
                <h4>${feature.name}</h4>
                <p><strong>Selector:</strong> <code>${feature.selector}</code></p>
                ${feature.text ? `<p><strong>Text:</strong> ${feature.text}</p>` : ""}
                ${feature.actions ? `<p><strong>Actions:</strong> ${feature.actions.join(", ")}</p>` : ""}
            </div>
        `,
          )
          .join("")}
    </div>
</body>
</html>`;
  }

  private createMarkdownReport(
    features: DiscoveredFeature[],
    testCases: TestCase[],
    testResults: TestExecutionResult[],
  ): string {
    const stats = this.calculateStatistics(features);
    const passed = testResults.filter((r) => r.passed).length;
    const failed = testResults.filter((r) => !r.passed).length;
    const successRate =
      testResults.length > 0 ? ((passed / testResults.length) * 100).toFixed(1) : "0";

    return `# Feature Discovery Report

Generated: ${new Date().toISOString()}

## Summary

| Metric | Value |
|--------|-------|
| Features Discovered | ${features.length} |
| Test Cases Generated | ${testCases.length} |
| Tests Passed | ${passed} |
| Tests Failed | ${failed} |
| Success Rate | ${successRate}% |

## Feature Types

${Object.entries(stats.byType)
  .map(([type, count]) => `- **${type.charAt(0).toUpperCase() + type.slice(1)}**: ${count}`)
  .join("\n")}

## Test Results

### Passed Tests ✅
${testResults
  .filter((r) => r.passed)
  .slice(0, 10)
  .map((r) => `- ${r.featureName}`)
  .join("\n")}

### Failed Tests ❌
${testResults
  .filter((r) => !r.passed)
  .slice(0, 10)
  .map((r) => `- ${r.featureName}: ${r.error}`)
  .join("\n")}

## Discovered Features

${features
  .slice(0, 20)
  .map(
    (feature) => `
### ${feature.name} (${feature.type})
- **Selector**: \`${feature.selector}\`
${feature.text ? `- **Text**: ${feature.text}` : ""}
${feature.actions ? `- **Actions**: ${feature.actions.join(", ")}` : ""}
`,
  )
  .join("\n")}
`;
  }
}

interface TestExecutionResult {
  featureName: string;
  passed: boolean;
  error?: string;
}
