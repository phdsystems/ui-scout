# 🚀 Quick Start Guide

Get started with the UI Discovery System in 5 minutes!

## Prerequisites

- Node.js 16+ or Bun
- TypeScript 4.5+
- A web application to test

## Installation

### NPM
```bash
npm install ui-scout
```

### Bun
```bash
bun add ui-scout
```

### From Source
```bash
git clone https://github.com/your-org/ui-discovery.git
cd ui-discovery
npm install
npm run build
```

## Basic Usage

### 1. Simple Discovery (Playwright)

```typescript
import { chromium } from 'playwright';
import { DiscoveryService, PlaywrightPageDriver } from 'ui-scout';

async function discoverFeatures() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://your-app.com');
  
  // Create page driver and discovery service
  const pageDriver = new PlaywrightPageDriver(page);
  const discoveryService = new DiscoveryService(pageDriver);
  
  // Run discovery
  const features = await discoveryService.discoverAllFeatures();
  
  console.log(`Found ${features.length} features`);
  features.forEach(feature => {
    console.log(`- ${feature.name} (${feature.type})`);
  });
  
  await browser.close();
}

discoverFeatures();
```

### 2. With Test Generation

```typescript
import { FeatureDiscoveryCoordinator } from 'ui-scout';

// Note: FeatureDiscoveryCoordinator currently works directly with Playwright Page
const coordinator = new FeatureDiscoveryCoordinator(page);

const result = await coordinator.runComplete();

// Access test results
console.log(`Generated ${result.testing?.testCases.length || 0} test cases`);
console.log(`Passed: ${result.testing?.passed || 0}/${result.testing?.executed || 0}`);
```

### 3. Custom Discovery Only

```typescript
// Just discover features, no testing
const features = await discoveryService.discoverAllFeatures();

console.log('Features found:');
features.forEach(feature => {
  console.log(`- ${feature.name} (${feature.type})`);
});
```

### 4. With Different Frameworks

#### Puppeteer
```typescript
import { PuppeteerPageDriver } from 'ui-scout';

const pageDriver = new PuppeteerPageDriver(puppeteerPage);
const discoveryService = new DiscoveryService(pageDriver);
```

#### Using Factory Function
```typescript
import { createDiscoverySystem } from 'ui-scout';

// Automatically creates appropriate adapter
const discoveryService = createDiscoverySystem(page, 'playwright');
// or
const discoveryService = createDiscoverySystem(puppeteerPage, 'puppeteer');
```

## Configuration Options

```typescript
const coordinator = new FeatureDiscoveryCoordinator(adapter, {
  // Include test execution
  includeTestExecution: true,
  
  // Screenshot directory
  screenshotPath: './test-screenshots',
  
  // Discovery depth
  maxDepth: 3,
  
  // Timeout for operations
  timeout: 30000,
  
  // Include hidden elements
  includeHidden: false,
  
  // Parallel discovery
  parallel: true
});
```

## Output Format

The system generates multiple report formats:

```typescript
// JSON Report
{
  "discovery": {
    "count": 45,
    "features": [...],
    "byType": { "button": 12, "input": 8, ... }
  },
  "analysis": {
    "structure": { ... },
    "accessibility": { "score": 92, ... }
  },
  "testing": {
    "testCases": [...],
    "results": [...],
    "passed": 40,
    "failed": 5
  }
}
```

## Next Steps

- [Architecture Overview](./ARCHITECTURE.md) - Understand the system design
- [API Reference](../api/CORE.md) - Complete API documentation
- [Examples](../development/EXAMPLES.md) - More usage examples
- [Configuration](../deployment/CONFIGURATION.md) - Advanced configuration