# 🚀 Quick Start Guide

Get started with UI Scout in 5 minutes!

## Prerequisites

- Node.js 18+ or Bun
- TypeScript 4.5+
- A testing framework (Playwright, Puppeteer, or Selenium)

## Installation

### Core Package
```bash
# Using Bun (recommended)
bun add ui-scout

# Using npm
npm install ui-scout
```

### Framework Dependencies
Choose **one** testing framework:

```bash
# Playwright (recommended)
bun add playwright

# Puppeteer
bun add puppeteer

# Selenium WebDriver
bun add selenium-webdriver
```

## Basic Usage

### 1. Simple Discovery (Playwright)

```typescript
import { createDiscoverySystem } from 'ui-scout';
import { chromium } from 'playwright';

async function discoverFeatures() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://your-app.com');
  
  // Auto-detects framework and creates appropriate adapter
  const discoveryService = createDiscoverySystem(page, 'playwright');
  
  // Run discovery
  const features = await discoveryService.discoverAllFeatures();
  
  console.log(`Found ${features.length} UI features:`);
  features.forEach(feature => {
    console.log(`- ${feature.name} (${feature.type})`);
  });
  
  await browser.close();
}

discoverFeatures();
```

### 2. Complete Discovery with Testing

```typescript
import { FeatureDiscoveryCoordinator } from 'ui-scout';
import { chromium } from 'playwright';

async function fullDiscovery() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://your-app.com');

  const coordinator = new FeatureDiscoveryCoordinator(page);
  
  // Run complete discovery + testing + reporting
  const result = await coordinator.runComplete();

  console.log(`Discovery Results:`);
  console.log(`- Found ${result.discovery.count} features`);
  console.log(`- Generated ${result.testing?.testCases.length || 0} test cases`);
  console.log(`- Test success rate: ${result.testing?.successRate || 0}%`);

  await browser.close();
}
```

### 3. Framework-Specific Examples

#### Puppeteer
```typescript
import { createDiscoverySystem } from 'ui-scout';
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://your-app.com');

const discoveryService = createDiscoverySystem(page, 'puppeteer');
const features = await discoveryService.discoverAllFeatures();
```

#### Selenium WebDriver
```typescript
import { DiscoveryService } from 'ui-scout';
import { Builder } from 'selenium-webdriver';

const driver = await new Builder().forBrowser('chrome').build();
await driver.get('https://your-app.com');

// Note: Selenium adapter coming soon
// const discoveryService = createDiscoverySystem(driver, 'selenium');
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