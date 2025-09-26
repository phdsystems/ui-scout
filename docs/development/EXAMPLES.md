# 🛠️ Usage Examples

Real-world examples of using UI Scout in different scenarios.

## Basic Examples

### 1. Simple Feature Discovery

```typescript
import { createDiscoverySystem } from 'ui-scout';
import { chromium } from 'playwright';

async function basicDiscovery() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  
  const discoveryService = createDiscoverySystem(page, 'playwright');
  const features = await discoveryService.discoverAllFeatures();
  
  console.log('Features found:', features.length);
  console.log('By type:', features.reduce((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1;
    return acc;
  }, {}));
  
  await browser.close();
}
```

### 2. Discovery with Test Generation & Execution

```typescript
import { FeatureDiscoveryCoordinator } from 'ui-scout';
import { chromium } from 'playwright';

async function discoveryWithTests() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://your-app.com');
  
  const coordinator = new FeatureDiscoveryCoordinator(page);
  const result = await coordinator.runComplete();
  
  // Check results
  const { discovery, testing, analysis } = result;
  
  console.log(`
    Discovery Results:
    - Features: ${discovery.count}
    - Interactive: ${discovery.features.filter(f => f.actions?.length > 0).length}
    
    Testing Results:
    - Test Cases: ${testing?.testCases.length || 0}
    - Passed: ${testing?.successRate || 0}%
    
    Analysis Results:
    - Page Title: ${analysis?.pageTitle || 'Unknown'}
  `);
  
  await browser.close();
}
```

### 3. Manual Test Generation

```typescript
import { 
  createDiscoverySystem, 
  TestCaseGenerator, 
  TestExecutor,
  ReportGenerator 
} from 'ui-scout';

async function manualTesting() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://your-app.com');

  // Discover features
  const discoveryService = createDiscoverySystem(page, 'playwright');
  const features = await discoveryService.discoverAllFeatures();

  // Generate test cases
  const generator = new TestCaseGenerator();
  const testCases = await generator.generateFromFeatures(features);

  // Execute tests
  const executor = new TestExecutor(page);
  const results = await executor.executeTestCases(testCases);

  // Generate reports
  const reportGenerator = new ReportGenerator();
  await reportGenerator.generateHTMLReport(features, testCases, results, 'test-report.html');
  await reportGenerator.generateMarkdownSummary(features, testCases, results, 'summary.md');

  console.log(`Generated ${testCases.length} tests, ${results.filter(r => r.success).length} passed`);
  
  await browser.close();
}
```

## Framework Examples

### Playwright Integration

```typescript
// tests/ui-discovery.spec.ts
import { test, expect } from '@playwright/test';
import { createDiscoverySystem } from 'ui-scout';

test('UI discovery integration', async ({ page }) => {
  await page.goto('/dashboard');
  
  const discoveryService = createDiscoverySystem(page, 'playwright');
  const features = await discoveryService.discoverAllFeatures();
  
  // Verify expected features exist
  expect(features.length).toBeGreaterThan(0);
  
  const loginButton = features.find(f => f.name.toLowerCase().includes('login'));
  expect(loginButton).toBeDefined();
  
  const forms = features.filter(f => f.type === 'input');
  expect(forms.length).toBeGreaterThan(0);
});
```

### Puppeteer Integration

```typescript
import { createDiscoverySystem } from 'ui-scout';
import puppeteer from 'puppeteer';

async function puppeteerExample() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://your-app.com');

  const discoveryService = createDiscoverySystem(page, 'puppeteer');
  const features = await discoveryService.discoverAllFeatures();

  console.log(`Puppeteer discovered ${features.length} features`);
  
  await browser.close();
}
```

### Multi-Page Discovery

```typescript
async function discoverMultiplePages(urls: string[]) {
  const browser = await chromium.launch();
  
  const results = await Promise.all(
    urls.map(async (url) => {
      const page = await browser.newPage();
      await page.goto(url);
      
      const discoveryService = createDiscoverySystem(page, 'playwright');
      const features = await discoveryService.discoverAllFeatures();
      
      await page.close();
      return { url, features: features.length };
    })
  );
  
  console.log('Multi-page results:', results);
  await browser.close();
}

// Usage
discoverMultiplePages([
  'https://myapp.com/',
  'https://myapp.com/dashboard',
  'https://myapp.com/settings'
]);
```

## Advanced Usage

### Custom Discovery with Filtering

```typescript
import { DiscoveryService, PlaywrightPageDriver } from 'ui-scout';

async function customDiscovery() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://your-app.com');

  const pageDriver = new PlaywrightPageDriver(page);
  const discoveryService = new DiscoveryService(pageDriver);

  // Discover specific types only
  const buttons = await discoveryService.discoverButtons();
  const inputs = await discoveryService.discoverInputs();
  
  // Filter by criteria
  const primaryButtons = buttons.filter(b => 
    b.attributes?.class?.includes('primary') || 
    b.attributes?.type === 'submit'
  );

  console.log(`Found ${primaryButtons.length} primary buttons`);
  
  await browser.close();
}
```

### CI/CD Integration

```typescript
// scripts/ui-audit.ts
import { FeatureDiscoveryCoordinator } from 'ui-scout';
import { chromium } from 'playwright';
import * as fs from 'fs';

async function ciPipeline() {
  const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
  const BASELINE_FILE = './baseline.json';
  
  // Load baseline
  const baseline = fs.existsSync(BASELINE_FILE) 
    ? JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf-8'))
    : null;
  
  // Run discovery
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE_URL);
  
  const coordinator = new FeatureDiscoveryCoordinator(page);
  const result = await coordinator.runComplete();
  
  // Compare with baseline
  if (baseline) {
    const regressions = [];
    
    // Check feature count
    if (result.discovery.count < baseline.discovery.count) {
      regressions.push(
        `Feature count decreased: ${baseline.discovery.count} → ${result.discovery.count}`
      );
    }
    
    // Check test pass rate
    const passRate = result.testing?.successRate || 0;
    const baselinePassRate = baseline.testing?.successRate || 0;
    
    if (passRate < baselinePassRate - 5) {
      regressions.push(
        `Test pass rate decreased: ${baselinePassRate}% → ${passRate}%`
      );
    }
    
    if (regressions.length > 0) {
      console.error('❌ Quality gate failed:');
      regressions.forEach(r => console.error(`  - ${r}`));
      process.exit(1);
    }
  }
  
  // Save as new baseline if requested
  if (process.env.UPDATE_BASELINE === 'true') {
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(result, null, 2));
    console.log('✅ Baseline updated');
  }
  
  console.log('✅ Quality gate passed');
  await browser.close();
}

ciPipeline().catch(console.error);
```

### Report Generation

```typescript
import { ReportGenerator } from 'ui-scout';

async function generateReports(features: any[], testCases: any[], results: any[]) {
  const generator = new ReportGenerator();

  // Generate different report formats
  await generator.generateJSONReport(features, 'discovery.json');
  await generator.generateHTMLReport(features, testCases, results, 'report.html');
  await generator.generateMarkdownSummary(features, testCases, results, 'summary.md');

  console.log('Reports generated successfully');
}
```

## Integration Patterns

### Next.js API Route

```typescript
// pages/api/ui-discovery.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createDiscoverySystem } from 'ui-scout';
import { chromium } from 'playwright';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { url } = req.body;
  
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    
    const discoveryService = createDiscoverySystem(page, 'playwright');
    const features = await discoveryService.discoverAllFeatures();
    
    await browser.close();
    
    res.status(200).json({ 
      success: true, 
      features: features.length,
      data: features 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
```

### Jest Test Integration

```typescript
// __tests__/ui-discovery.test.js
import { createDiscoverySystem } from 'ui-scout';
import { chromium } from 'playwright';

describe('UI Discovery Tests', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  test('should discover login form', async () => {
    await page.goto('http://localhost:3000/login');
    
    const discoveryService = createDiscoverySystem(page, 'playwright');
    const features = await discoveryService.discoverAllFeatures();
    
    const loginInputs = features.filter(f => 
      f.type === 'input' && 
      (f.name.includes('email') || f.name.includes('password'))
    );
    
    expect(loginInputs.length).toBeGreaterThanOrEqual(2);
  });

  test('should discover navigation elements', async () => {
    await page.goto('http://localhost:3000');
    
    const discoveryService = createDiscoverySystem(page, 'playwright');
    const features = await discoveryService.discoverAllFeatures();
    
    const navElements = features.filter(f => f.type === 'menu');
    expect(navElements.length).toBeGreaterThan(0);
  });
});
```

## Error Handling

```typescript
async function robustDiscovery() {
  const browser = await chromium.launch();
  
  try {
    const page = await browser.newPage();
    
    // Set timeout
    page.setDefaultTimeout(30000);
    
    await page.goto('https://your-app.com', { 
      waitUntil: 'networkidle' 
    });
    
    const discoveryService = createDiscoverySystem(page, 'playwright');
    const features = await discoveryService.discoverAllFeatures();
    
    if (features.length === 0) {
      console.warn('No features discovered - page might not be fully loaded');
    }
    
    return features;
    
  } catch (error) {
    console.error('Discovery failed:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}
```

## Performance Optimization

```typescript
async function optimizedDiscovery() {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  
  // Disable unnecessary resources for faster loading
  await page.route('**/*.{png,jpg,jpeg,gif,svg}', route => route.abort());
  await page.route('**/*.{css}', route => route.abort());
  
  await page.goto('https://your-app.com');
  
  const discoveryService = createDiscoverySystem(page, 'playwright');
  const features = await discoveryService.discoverAllFeatures();
  
  await browser.close();
  return features;
}
```

## Monitoring & Alerting

```typescript
async function monitoringSetup() {
  const results = await discoverFeatures();
  
  // Alert if feature count drops significantly
  const expectedMinFeatures = 10;
  if (results.length < expectedMinFeatures) {
    // Send alert (Slack, email, etc.)
    console.error(`⚠️ Low feature count: ${results.length} (expected: ${expectedMinFeatures}+)`);
  }
  
  // Log metrics
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    features_discovered: results.length,
    page_url: 'https://your-app.com',
    status: 'success'
  }));
}
```

## Next Steps

- [API Reference](../api/CORE.md) - Complete API documentation
- [Architecture Overview](../overview/ARCHITECTURE.md) - System design
- [Configuration Guide](../technical/COMPLETE-GUIDE.md) - Advanced configuration