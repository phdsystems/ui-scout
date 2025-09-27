/**
 * Test Generators Export
 * Provides unified access to all test generation capabilities
 */

export { IntegrationTestGenerator } from "./IntegrationTestGenerator";
export type { IntegrationTestOptions, GeneratedIntegrationTest } from "./IntegrationTestGenerator";

export { E2ETestGenerator } from "./E2ETestGenerator";
export type {
  E2ETestOptions,
  E2ETestScenario,
  E2ETestStep,
  E2EAssertion,
  GeneratedE2ETest,
} from "./E2ETestGenerator";

export { UnifiedTestGenerator } from "./UnifiedTestGenerator";
export type { UnifiedTestOptions, TestGenerationReport } from "./UnifiedTestGenerator";

// Re-export for convenience
export { CoverageAnalyzer } from "../CoverageAnalyzer";
export type { CoverageGap, CoverageReport } from "../CoverageAnalyzer";
