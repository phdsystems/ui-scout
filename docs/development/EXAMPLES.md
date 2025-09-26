# 💻 Code Examples

Practical examples of using the UI Discovery System.

## Basic Examples

### 1. Simple Feature Discovery

```typescript
import { FeatureDiscoveryCoordinator } from '@your-org/ui-discovery';
import { PlaywrightAdapter } from '@your-org/ui-discovery/adapters';
import { chromium } from 'playwright';

async function basicDiscovery() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  
  const coordinator = new FeatureDiscoveryCoordinator(
    new PlaywrightAdapter(page)
  );
  
  const discovery = await coordinator.discoverFeatures();
  
  console.log('Features found:', discovery.count);
  console.log('By type:', discovery.byType);
  
  await browser.close();
}
```

### 2. Discovery with Test Execution

```typescript
async function discoveryWithTests() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://your-app.com');
  
  const coordinator = new FeatureDiscoveryCoordinator(
    new PlaywrightAdapter(page),
    {
      includeTestExecution: true,
      screenshotPath: './screenshots',
      timeout: 60000
    }
  );
  
  const result = await coordinator.runComplete();
  
  // Check results
  const { discovery, testing, analysis } = result;
  
  console.log(`
    Discovery Results:
    - Features: ${discovery.count}
    - Interactive: ${discovery.features.filter(f => f.interactions.length > 0).length}
    
    Testing Results:
    - Test Cases: ${testing.testCases.length}
    - Passed: ${testing.passed}
    - Failed: ${testing.failed}
    
    Analysis Results:
    - Accessibility Score: ${analysis.accessibility.score}/100
    - Page Title: ${analysis.structure.title}
  `);
  
  await browser.close();
}
```

## Advanced Examples

### 3. Custom Discovery Module

```typescript
import { BaseDiscovery } from '@your-org/ui-discovery';

class VideoPlayerDiscovery extends BaseDiscovery {
  async discover(driver: IPageDriver): Promise<Feature[]> {
    const features: Feature[] = [];
    
    // Find all video players
    const videos = await driver.querySelectorAll('video');
    
    for (const video of videos) {
      const id = await driver.getAttribute(video, 'id');
      const src = await driver.getAttribute(video, 'src');
      
      features.push({
        id: id || `video-${features.length}`,
        name: `Video Player ${features.length + 1}`,
        type: 'video-player',
        selector: `video[src="${src}"]`,
        attributes: { src },
        interactions: [
          { type: 'play', description: 'Play video' },
          { type: 'pause', description: 'Pause video' },
          { type: 'seek', description: 'Seek to position' }
        ],
        metadata: {
          category: 'media',
          importance: 'high'
        }
      });
    }
    
    return features;
  }
}

// Use custom discovery
const discoveryService = new DiscoveryService(adapter);
discoveryService.registerModule(new VideoPlayerDiscovery());
const features = await discoveryService.discover();
```

### 4. Parallel Discovery Across Multiple Pages

```typescript
async function discoverMultiplePages(urls: string[]) {
  const browser = await chromium.launch();
  
  // Run discovery in parallel for all URLs
  const results = await Promise.all(
    urls.map(async (url) => {
      const page = await browser.newPage();
      await page.goto(url);
      
      const coordinator = new FeatureDiscoveryCoordinator(
        new PlaywrightAdapter(page)
      );
      
      const result = await coordinator.runComplete();
      await page.close();
      
      return { url, result };
    })
  );
  
  // Aggregate results
  const totalFeatures = results.reduce(
    (sum, { result }) => sum + result.discovery.count,
    0
  );
  
  console.log(`Discovered ${totalFeatures} features across ${urls.length} pages`);
  
  // Generate combined report
  const report = {
    timestamp: new Date().toISOString(),
    pages: results.map(({ url, result }) => ({
      url,
      features: result.discovery.count,
      tests: result.testing.testCases.length,
      accessibility: result.analysis.accessibility.score
    })),
    summary: {
      totalPages: urls.length,
      totalFeatures,
      averageAccessibility: 
        results.reduce((sum, { result }) => 
          sum + result.analysis.accessibility.score, 0
        ) / urls.length
    }
  };
  
  await browser.close();
  return report;
}
```

### 5. CI/CD Integration

```typescript
// ci-discovery.ts
import { FeatureDiscoveryCoordinator } from '@your-org/ui-discovery';
import { PlaywrightAdapter } from '@your-org/ui-discovery/adapters';

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
  
  const coordinator = new FeatureDiscoveryCoordinator(
    new PlaywrightAdapter(page),
    {
      includeTestExecution: true,
      parallel: true
    }
  );
  
  const result = await coordinator.runComplete();
  
  // Compare with baseline
  if (baseline) {
    const regressions = [];
    
    // Check for missing features
    if (result.discovery.count < baseline.discovery.count) {
      regressions.push(
        `Feature count decreased: ${baseline.discovery.count} → ${result.discovery.count}`
      );
    }
    
    // Check test pass rate
    const passRate = (result.testing.passed / result.testing.executed) * 100;
    const baselinePassRate = (baseline.testing.passed / baseline.testing.executed) * 100;
    
    if (passRate < baselinePassRate - 5) {
      regressions.push(
        `Test pass rate decreased: ${baselinePassRate.toFixed(1)}% → ${passRate.toFixed(1)}%`
      );
    }
    
    // Check accessibility
    if (result.analysis.accessibility.score < baseline.analysis.accessibility.score - 5) {
      regressions.push(
        `Accessibility score decreased: ${baseline.analysis.accessibility.score} → ${result.analysis.accessibility.score}`
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

### 6. Custom Report Generation

```typescript
import { ReportGenerator } from '@your-org/ui-discovery';

class JUnitReporter extends ReportGenerator {
  async generate(data: any): Promise<void> {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="UI Discovery Tests" tests="${data.testing.executed}" failures="${data.testing.failed}">
  <testsuite name="Feature Tests" tests="${data.testing.executed}" failures="${data.testing.failed}">
    ${data.testing.results.map(result => `
    <testcase name="${result.testCase.name}" classname="${result.testCase.feature.type}" time="${result.duration / 1000}">
      ${!result.passed ? `<failure message="${result.error?.message}">${result.error?.stack}</failure>` : ''}
    </testcase>
    `).join('')}
  </testsuite>
</testsuites>`;
    
    await fs.promises.writeFile('junit-report.xml', xml);
  }
}

// Use custom reporter
const coordinator = new FeatureDiscoveryCoordinator(adapter);
const result = await coordinator.runComplete();

const junitReporter = new JUnitReporter();
await junitReporter.generate(result);
```

### 7. Feature Comparison

```typescript
async function compareVersions(v1Url: string, v2Url: string) {
  const browser = await chromium.launch();
  
  // Discover v1
  const page1 = await browser.newPage();
  await page1.goto(v1Url);
  const v1Coordinator = new FeatureDiscoveryCoordinator(
    new PlaywrightAdapter(page1)
  );
  const v1Result = await v1Coordinator.discoverFeatures();
  await page1.close();
  
  // Discover v2
  const page2 = await browser.newPage();
  await page2.goto(v2Url);
  const v2Coordinator = new FeatureDiscoveryCoordinator(
    new PlaywrightAdapter(page2)
  );
  const v2Result = await v2Coordinator.discoverFeatures();
  await page2.close();
  
  // Compare features
  const v1Ids = new Set(v1Result.features.map(f => f.id));
  const v2Ids = new Set(v2Result.features.map(f => f.id));
  
  const added = v2Result.features.filter(f => !v1Ids.has(f.id));
  const removed = v1Result.features.filter(f => !v2Ids.has(f.id));
  const unchanged = v2Result.features.filter(f => v1Ids.has(f.id));
  
  console.log(`
    Feature Comparison:
    - Added: ${added.length}
    - Removed: ${removed.length}
    - Unchanged: ${unchanged.length}
    
    Added Features:
    ${added.map(f => `  + ${f.name} (${f.type})`).join('\\n')}
    
    Removed Features:
    ${removed.map(f => `  - ${f.name} (${f.type})`).join('\\n')}
  `);
  
  await browser.close();
  
  return { added, removed, unchanged };
}
```

### 8. Interactive Mode

```typescript
import * as readline from 'readline';

async function interactiveDiscovery() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt: string) => new Promise<string>(resolve => {
    rl.question(prompt, resolve);
  });
  
  while (true) {
    const url = await question('Enter URL (or "quit" to exit): ');
    
    if (url === 'quit') break;
    
    await page.goto(url);
    
    const coordinator = new FeatureDiscoveryCoordinator(
      new PlaywrightAdapter(page)
    );
    
    const action = await question('Choose action (discover/test/analyze/all): ');
    
    switch (action) {
      case 'discover':
        const discovery = await coordinator.discoverFeatures();
        console.log('Found features:', discovery.features.map(f => f.name));
        break;
        
      case 'test':
        const features = await coordinator.discoverFeatures();
        const tests = await coordinator.generateTests(features.features);
        const results = await coordinator.executeTests(tests.slice(0, 5));
        console.log('Test results:', results.map(r => 
          `${r.testCase.name}: ${r.passed ? '✅' : '❌'}`
        ));
        break;
        
      case 'analyze':
        const analysis = await coordinator.analyzePage();
        console.log('Page analysis:', analysis);
        break;
        
      case 'all':
        const complete = await coordinator.runComplete();
        console.log('Complete results:', complete);
        break;
    }
  }
  
  rl.close();
  await browser.close();
}
```

## Framework-Specific Examples

### Next.js Integration

```typescript
// pages/api/discovery.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { FeatureDiscoveryCoordinator } from '@your-org/ui-discovery';
import { PlaywrightAdapter } from '@your-org/ui-discovery/adapters';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { url } = req.body;
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  
  const coordinator = new FeatureDiscoveryCoordinator(
    new PlaywrightAdapter(page)
  );
  
  const result = await coordinator.runComplete();
  
  await browser.close();
  
  res.status(200).json(result);
}
```

### React Component Testing

```typescript
// ComponentDiscovery.test.tsx
import { render } from '@testing-library/react';
import { FeatureDiscoveryCoordinator } from '@your-org/ui-discovery';
import { JSDOMAdapter } from '@your-org/ui-discovery/adapters';

describe('Component Discovery', () => {
  it('discovers all interactive elements', async () => {
    const { container } = render(<MyComplexForm />);
    
    const coordinator = new FeatureDiscoveryCoordinator(
      new JSDOMAdapter(container)
    );
    
    const result = await coordinator.discoverFeatures();
    
    expect(result.byType.input).toBe(5);
    expect(result.byType.button).toBe(2);
    expect(result.byType.dropdown).toBe(1);
  });
});
```

## Next Steps

- [API Reference](../api/CORE.md) - Complete API documentation
- [Testing Guide](./TESTING.md) - Testing the discovery system
- [Contributing](./CONTRIBUTING.md) - How to contribute