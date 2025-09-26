// Core types for feature discovery system
export interface DiscoveredFeature {
  name: string;
  type:
    | "button"
    | "menu"
    | "panel"
    | "input"
    | "chart"
    | "table"
    | "modal"
    | "dropdown"
    | "tab"
    | "other";
  selector: string;
  text?: string;
  attributes?: Record<string, string>;
  children?: DiscoveredFeature[];
  actions?: string[];
  screenshot?: string;
}

export interface TestCase {
  feature: DiscoveredFeature;
  steps: TestStep[];
  assertions: Assertion[];
}

export interface TestStep {
  action:
    | "click"
    | "fill"
    | "hover"
    | "focus"
    | "select"
    | "check"
    | "uncheck"
    | "press"
    | "screenshot";
  selector: string;
  value?: string;
  description: string;
}

export interface Assertion {
  type: "visible" | "hidden" | "enabled" | "disabled" | "text" | "count" | "attribute" | "class";
  selector: string;
  expected?: any;
  description: string;
}

export interface DiscoveryReport {
  timestamp: string;
  url: string;
  featuresDiscovered: number;
  features: DiscoveredFeature[];
  testCases: TestCase[];
  statistics: {
    byType: Record<string, number>;
    interactive: number;
    withText: number;
    withAttributes: number;
  };
}

export interface DiscoveryOptions {
  maxDepth?: number;
  timeout?: number;
  includeHidden?: boolean;
  screenshotPath?: string;
}
