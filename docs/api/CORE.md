# 📡 Core API Reference

## FeatureDiscoveryCoordinator

The main orchestrator for the discovery process.

### Constructor

```typescript
constructor(
  pageDriver: IPageDriver,
  options?: CoordinatorOptions
)
```

#### Parameters

- `pageDriver`: Framework adapter implementing IPageDriver
- `options`: Optional configuration

#### Options

```typescript
interface CoordinatorOptions {
  includeTestExecution?: boolean;  // Execute generated tests
  screenshotPath?: string;         // Directory for screenshots
  maxDepth?: number;               // Discovery depth (default: 3)
  timeout?: number;                // Operation timeout (default: 30000)
  includeHidden?: boolean;         // Include hidden elements
  parallel?: boolean;              // Parallel discovery (default: true)
}
```

### Methods

#### runComplete()

Run the complete discovery, testing, and reporting pipeline.

```typescript
async runComplete(): Promise<CompleteResult>
```

**Returns:**
```typescript
interface CompleteResult {
  discovery: DiscoveryResult;
  analysis: AnalysisResult;
  testing: TestingResult;
  reports: ReportResult[];
}
```

#### discoverFeatures()

Discover UI features only.

```typescript
async discoverFeatures(): Promise<DiscoveryResult>
```

**Returns:**
```typescript
interface DiscoveryResult {
  count: number;
  features: Feature[];
  byType: Record<string, number>;
  duration: number;
}
```

#### generateTests()

Generate test cases from discovered features.

```typescript
async generateTests(features: Feature[]): Promise<TestCase[]>
```

#### executeTests()

Execute generated test cases.

```typescript
async executeTests(testCases: TestCase[]): Promise<TestResult[]>
```

#### analyzePage()

Analyze page structure and accessibility.

```typescript
async analyzePage(): Promise<AnalysisResult>
```

#### generateReports()

Generate reports in multiple formats.

```typescript
async generateReports(
  features: Feature[],
  testCases: TestCase[],
  results: TestResult[]
): Promise<ReportResult[]>
```

## IPageDriver Interface

Abstract interface for framework adapters.

```typescript
interface IPageDriver {
  // Navigation
  goto(url: string): Promise<void>;
  getCurrentUrl(): Promise<string>;
  
  // Element queries
  querySelector(selector: string): Promise<ElementHandle | null>;
  querySelectorAll(selector: string): Promise<ElementHandle[]>;
  
  // Element interactions
  click(selector: string): Promise<void>;
  type(selector: string, text: string): Promise<void>;
  
  // Element properties
  getAttribute(element: ElementHandle, attr: string): Promise<string | null>;
  getText(element: ElementHandle): Promise<string>;
  isVisible(element: ElementHandle): Promise<boolean>;
  isEnabled(element: ElementHandle): Promise<boolean>;
  
  // Utilities
  waitForSelector(selector: string, timeout?: number): Promise<ElementHandle | null>;
  screenshot(path: string): Promise<void>;
  evaluate<T>(fn: Function, ...args: any[]): Promise<T>;
}
```

## Feature Type

Represents a discovered UI feature.

```typescript
interface Feature {
  id: string;                    // Unique identifier
  name: string;                   // Human-readable name
  type: FeatureType;             // Feature type
  selector: string;              // CSS selector
  attributes: Record<string, any>; // HTML attributes
  text?: string;                 // Element text content
  interactions: Interaction[];   // Possible interactions
  metadata: FeatureMetadata;     // Additional metadata
}

type FeatureType = 
  | 'button' 
  | 'input' 
  | 'link' 
  | 'navigation' 
  | 'form'
  | 'table'
  | 'panel'
  | 'modal'
  | 'dropdown'
  | 'component';
```

## TestCase Type

Represents a generated test case.

```typescript
interface TestCase {
  id: string;                    // Unique identifier
  name: string;                   // Test name
  description: string;           // Test description
  feature: Feature;              // Target feature
  steps: TestStep[];            // Test steps
  assertions: Assertion[];       // Expected outcomes
  priority: Priority;           // Test priority
}

interface TestStep {
  action: 'click' | 'type' | 'navigate' | 'wait' | 'hover';
  target?: string;              // Selector or URL
  value?: any;                  // Input value
  description: string;          // Step description
}

interface Assertion {
  type: 'exists' | 'visible' | 'enabled' | 'text' | 'attribute';
  target: string;               // Selector
  expected?: any;               // Expected value
  description: string;          // Assertion description
}
```

## TestResult Type

Represents test execution results.

```typescript
interface TestResult {
  testCase: TestCase;           // Original test case
  passed: boolean;              // Pass/fail status
  duration: number;             // Execution time (ms)
  error?: Error;               // Error if failed
  screenshot?: string;         // Screenshot path
  steps: StepResult[];        // Individual step results
}

interface StepResult {
  step: TestStep;             // Original step
  passed: boolean;            // Step status
  duration: number;           // Step duration
  error?: Error;             // Step error
}
```

## Service APIs

### DiscoveryService

```typescript
class DiscoveryService {
  constructor(driver: IPageDriver, options?: DiscoveryOptions);
  
  async discover(): Promise<Feature[]>;
  async discoverByType(type: FeatureType): Promise<Feature[]>;
  async discoverInteractive(): Promise<Feature[]>;
}
```

### TestingService

```typescript
class TestingService {
  constructor(driver: IPageDriver, options?: TestingOptions);
  
  async generateTestCases(features: Feature[]): Promise<TestCase[]>;
  async executeTestCase(testCase: TestCase): Promise<TestResult>;
  async executeTestCases(testCases: TestCase[]): Promise<TestResult[]>;
}
```

### AnalysisService

```typescript
class AnalysisService {
  constructor(driver: IPageDriver);
  
  async analyzePage(): Promise<AnalysisResult>;
  async analyzeAccessibility(): Promise<AccessibilityResult>;
  async analyzePerformance(): Promise<PerformanceResult>;
}
```

### ReportGenerator

```typescript
class ReportGenerator {
  async generateJSON(data: any): Promise<void>;
  async generateHTML(data: any): Promise<void>;
  async generateMarkdown(data: any): Promise<void>;
}
```

## Error Handling

All methods may throw these errors:

```typescript
class DiscoveryError extends Error {
  constructor(message: string, cause?: Error);
}

class TestExecutionError extends Error {
  constructor(message: string, testCase: TestCase, cause?: Error);
}

class AdapterError extends Error {
  constructor(message: string, operation: string, cause?: Error);
}
```

## Usage Examples

### Basic Discovery

```typescript
const coordinator = new FeatureDiscoveryCoordinator(adapter);
const result = await coordinator.discoverFeatures();
console.log(`Found ${result.count} features`);
```

### With Error Handling

```typescript
try {
  const result = await coordinator.runComplete();
  console.log('Discovery successful:', result);
} catch (error) {
  if (error instanceof DiscoveryError) {
    console.error('Discovery failed:', error.message);
  } else if (error instanceof TestExecutionError) {
    console.error('Test failed:', error.testCase.name);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Custom Configuration

```typescript
const coordinator = new FeatureDiscoveryCoordinator(adapter, {
  includeTestExecution: true,
  maxDepth: 5,
  timeout: 60000,
  parallel: true,
  screenshotPath: './test-screenshots'
});

const result = await coordinator.runComplete();
```