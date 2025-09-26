/**
 * UI Scout - Main Entry Point
 *
 * Automated UI element discovery and test generation for web applications
 * Works with Playwright, Puppeteer, Selenium, and more
 */

// Core types
export * from "./types";

// Interfaces for abstraction
export * from "./interfaces/IPageDriver";

// Framework adapters
export { PlaywrightPageDriver } from "./adapters/PlaywrightAdapter";
export { PuppeteerPageDriver } from "./adapters/PuppeteerAdapter";

// Generic services (framework-agnostic)
export { GenericDiscoveryService } from "./GenericDiscoveryService";

// Specialized discovery modules
export { ButtonDiscovery } from "./ButtonDiscovery";
export { InputDiscovery } from "./InputDiscovery";
export { ComponentDiscovery } from "./ComponentDiscovery";
export { NavigationDiscovery } from "./NavigationDiscovery";

// Core services
export { DiscoveryService } from "./DiscoveryService";
export { TestingService } from "./TestingService";
export { AnalysisService } from "./AnalysisService";
export { ReportGenerator } from "./ReportGenerator";

// Test operations
export { TestCaseGenerator } from "./TestCaseGenerator";
export { TestExecutor } from "./TestExecutor";

// Utilities
export { SelectorUtils } from "./SelectorUtils";

// Main coordinators
export { FeatureDiscoveryCoordinator } from "./FeatureDiscoveryCoordinator";

import { DiscoveryService } from "./DiscoveryService";
import { PlaywrightPageDriver } from "./adapters/PlaywrightAdapter";
import { PuppeteerPageDriver } from "./adapters/PuppeteerAdapter";

/**
 * Quick start function for easy usage
 */
export function createDiscoverySystem(
  driver: any,
  framework: "playwright" | "puppeteer" | "selenium" | "generic" = "generic",
) {
  let pageDriver;

  switch (framework) {
    case "playwright":
      pageDriver = new PlaywrightPageDriver(driver);
      break;
    case "puppeteer":
      pageDriver = new PuppeteerPageDriver(driver);
      break;
    default:
      // Assume driver already implements IPageDriver
      pageDriver = driver;
  }

  return new DiscoveryService(pageDriver);
}
