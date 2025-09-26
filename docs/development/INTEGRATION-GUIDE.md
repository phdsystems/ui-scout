# 🔌 Integration Guide

Complete guide for integrating UI Scout into your project across different frameworks and environments.

## Installation & Setup

### Package Installation

```bash
# Core package
bun add ui-scout

# Choose your testing framework
bun add playwright          # Recommended
bun add puppeteer           # Alternative
bun add selenium-webdriver  # Legacy support
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

## Framework Integrations

### Playwright Integration

#### Basic Setup
```typescript
// tests/ui-discovery.spec.ts
import { test, expect } from '@playwright/test';
import { createDiscoverySystem } from 'ui-scout';

test.describe('UI Discovery', () => {
  test('should discover all UI features', async ({ page }) => {
    await page.goto('/');
    
    const discoveryService = createDiscoverySystem(page, 'playwright');
    const features = await discoveryService.discoverAllFeatures();
    
    expect(features.length).toBeGreaterThan(0);
  });
});
```

#### Playwright Config Integration
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'ui-discovery',
      testMatch: '**/ui-discovery.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        headless: false // For visual discovery
      },
    },
  ],
});
```

### Jest Integration

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
};

// tests/setup.ts
import { chromium } from 'playwright';

let browser;

beforeAll(async () => {
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser?.close();
});

global.browser = browser;
```

```typescript
// tests/ui-discovery.test.ts
import { createDiscoverySystem } from 'ui-scout';

describe('UI Discovery', () => {
  let page;

  beforeEach(async () => {
    page = await global.browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  test('discovers login form', async () => {
    await page.goto('http://localhost:3000/login');
    
    const discoveryService = createDiscoverySystem(page, 'playwright');
    const features = await discoveryService.discoverAllFeatures();
    
    const inputs = features.filter(f => f.type === 'input');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });
});
```

### Vitest Integration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    timeout: 30000,
  },
});

// tests/ui-discovery.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createDiscoverySystem } from 'ui-scout';
import { chromium } from 'playwright';

describe('UI Discovery', () => {
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

  it('should discover features', async () => {
    await page.goto('http://localhost:3000');
    
    const discoveryService = createDiscoverySystem(page, 'playwright');
    const features = await discoveryService.discoverAllFeatures();
    
    expect(features.length).toBeGreaterThan(0);
  });
});
```

## Application Framework Integrations

### Next.js Integration

#### API Route
```typescript
// pages/api/ui-discovery.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createDiscoverySystem } from 'ui-scout';
import { chromium } from 'playwright';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { url } = req.body;
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  
  const discoveryService = createDiscoverySystem(page, 'playwright');
  const features = await discoveryService.discoverAllFeatures();
  
  await browser.close();
  
  res.json({ features });
}
```

#### React Component
```tsx
// components/UIDiscovery.tsx
import { useState } from 'react';

export default function UIDiscovery() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);

  const runDiscovery = async (url: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ui-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      setFeatures(data.features);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => runDiscovery('https://example.com')}>
        Discover Features
      </button>
      {loading && <p>Discovering...</p>}
      <ul>
        {features.map(feature => (
          <li key={feature.selector}>
            {feature.name} ({feature.type})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Express.js Integration

```typescript
// server.ts
import express from 'express';
import { createDiscoverySystem } from 'ui-scout';
import { chromium } from 'playwright';

const app = express();
app.use(express.json());

app.post('/api/discover', async (req, res) => {
  const { url } = req.body;
  
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    
    const discoveryService = createDiscoverySystem(page, 'playwright');
    const features = await discoveryService.discoverAllFeatures();
    
    await browser.close();
    
    res.json({ 
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
});

app.listen(3000);
```

### Vue.js Integration

```vue
<!-- components/UIDiscovery.vue -->
<template>
  <div>
    <input v-model="url" placeholder="Enter URL to discover" />
    <button @click="runDiscovery" :disabled="loading">
      {{ loading ? 'Discovering...' : 'Discover UI' }}
    </button>
    
    <div v-if="features.length">
      <h3>Discovered Features ({{ features.length }})</h3>
      <ul>
        <li v-for="feature in features" :key="feature.selector">
          {{ feature.name }} ({{ feature.type }})
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const url = ref('');
const features = ref([]);
const loading = ref(false);

const runDiscovery = async () => {
  if (!url.value) return;
  
  loading.value = true;
  try {
    const response = await fetch('/api/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.value })
    });
    const data = await response.json();
    features.value = data.features;
  } finally {
    loading.value = false;
  }
};
</script>
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/ui-discovery.yml
name: UI Discovery Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  ui-discovery:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Install dependencies
        run: bun install
        
      - name: Install Playwright
        run: bunx playwright install chromium
        
      - name: Start application
        run: bun run start &
        
      - name: Wait for server
        run: npx wait-on http://localhost:3000
        
      - name: Run UI Discovery
        run: bun run test:ui-discovery
        
      - name: Upload discovery reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: ui-discovery-reports
          path: reports/
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - ui-discovery

ui-discovery:
  stage: ui-discovery
  image: node:18-alpine
  before_script:
    - npm install -g bun
    - bun install
    - bunx playwright install chromium
  script:
    - bun run start &
    - sleep 10
    - bun run ui-discovery
  artifacts:
    paths:
      - reports/
    expire_in: 1 week
  only:
    - merge_requests
    - main
```

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g bun'
                sh 'bun install'
                sh 'bunx playwright install chromium'
            }
        }
        
        stage('Start Application') {
            steps {
                sh 'bun run start &'
                sh 'sleep 10'
            }
        }
        
        stage('UI Discovery') {
            steps {
                sh 'bun run ui-discovery'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'reports/**/*', fingerprint: true
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'reports',
                        reportFiles: '*.html',
                        reportName: 'UI Discovery Report'
                    ])
                }
            }
        }
    }
}
```

## Docker Integration

### Dockerfile
```dockerfile
FROM node:18-alpine

# Install Playwright dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Playwright to use system Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package.json bun.lockb ./
RUN npm install -g bun && bun install

COPY . .
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      
  ui-discovery:
    build: .
    depends_on:
      - app
    environment:
      - TEST_URL=http://app:3000
    command: bun run ui-discovery
    volumes:
      - ./reports:/app/reports
```

## Environment Configuration

### Development Environment
```typescript
// config/development.ts
export const config = {
  discovery: {
    headless: false,
    timeout: 30000,
    screenshotPath: './screenshots',
    reportPath: './reports'
  },
  browser: {
    slowMo: 100,
    devtools: true
  }
};
```

### Production Environment
```typescript
// config/production.ts
export const config = {
  discovery: {
    headless: true,
    timeout: 10000,
    screenshotPath: '/tmp/screenshots',
    reportPath: '/app/reports'
  },
  browser: {
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  }
};
```

### Environment Variables
```bash
# .env
UI_SCOUT_HEADLESS=true
UI_SCOUT_TIMEOUT=30000
UI_SCOUT_SCREENSHOT_PATH=./screenshots
UI_SCOUT_REPORT_PATH=./reports
UI_SCOUT_BROWSER=chromium
```

```typescript
// config/index.ts
export const config = {
  headless: process.env.UI_SCOUT_HEADLESS === 'true',
  timeout: parseInt(process.env.UI_SCOUT_TIMEOUT || '30000'),
  screenshotPath: process.env.UI_SCOUT_SCREENSHOT_PATH || './screenshots',
  reportPath: process.env.UI_SCOUT_REPORT_PATH || './reports',
  browser: process.env.UI_SCOUT_BROWSER || 'chromium'
};
```

## Package.json Scripts

```json
{
  "scripts": {
    "ui-discovery": "tsx scripts/ui-discovery.ts",
    "ui-discovery:ci": "tsx scripts/ui-discovery.ts --ci",
    "ui-discovery:dev": "tsx scripts/ui-discovery.ts --dev",
    "ui-discovery:report": "tsx scripts/generate-report.ts",
    "ui-discovery:baseline": "tsx scripts/ui-discovery.ts --update-baseline"
  }
}
```

## Error Handling & Monitoring

### Robust Discovery Script
```typescript
// scripts/ui-discovery.ts
import { createDiscoverySystem } from 'ui-scout';
import { chromium } from 'playwright';

async function robustDiscovery(url: string) {
  let browser;
  
  try {
    browser = await chromium.launch({
      headless: process.env.CI === 'true',
      args: process.env.CI ? [
        '--no-sandbox',
        '--disable-dev-shm-usage'
      ] : []
    });
    
    const page = await browser.newPage();
    
    // Set reasonable timeouts
    page.setDefaultTimeout(30000);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    const discoveryService = createDiscoverySystem(page, 'playwright');
    const features = await discoveryService.discoverAllFeatures();
    
    if (features.length === 0) {
      console.warn('⚠️ No features discovered - page might not be fully loaded');
      return { success: false, features: [], error: 'No features found' };
    }
    
    return { success: true, features, error: null };
    
  } catch (error) {
    console.error('❌ Discovery failed:', error.message);
    return { success: false, features: [], error: error.message };
  } finally {
    await browser?.close();
  }
}
```

### Monitoring Integration
```typescript
// utils/monitoring.ts
export function logDiscoveryMetrics(result: any) {
  const metrics = {
    timestamp: new Date().toISOString(),
    success: result.success,
    features_count: result.features.length,
    error: result.error,
    execution_time: Date.now() - startTime
  };
  
  // Send to monitoring service
  console.log(JSON.stringify(metrics));
  
  // Alert on failures
  if (!result.success) {
    // Send alert to Slack, PagerDuty, etc.
  }
}
```

## Performance Optimization

### Parallel Discovery
```typescript
async function parallelDiscovery(urls: string[]) {
  const browser = await chromium.launch();
  
  const results = await Promise.all(
    urls.map(async (url) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        await page.goto(url);
        const discoveryService = createDiscoverySystem(page, 'playwright');
        const features = await discoveryService.discoverAllFeatures();
        return { url, features: features.length, success: true };
      } catch (error) {
        return { url, features: 0, success: false, error: error.message };
      } finally {
        await context.close();
      }
    })
  );
  
  await browser.close();
  return results;
}
```

### Resource Optimization
```typescript
async function optimizedDiscovery(url: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Block unnecessary resources
  await page.route('**/*.{png,jpg,jpeg,gif,svg,ico}', route => route.abort());
  await page.route('**/*.{css,woff,woff2}', route => route.abort());
  
  await page.goto(url);
  
  const discoveryService = createDiscoverySystem(page, 'playwright');
  const features = await discoveryService.discoverAllFeatures();
  
  await browser.close();
  return features;
}
```

## Troubleshooting

### Common Issues

1. **Timeout Errors**
   ```typescript
   // Increase timeouts
   page.setDefaultTimeout(60000);
   await page.goto(url, { timeout: 90000 });
   ```

2. **Memory Issues**
   ```typescript
   // Close contexts properly
   const context = await browser.newContext();
   try {
     // ... discovery logic
   } finally {
     await context.close();
   }
   ```

3. **CI/CD Issues**
   ```bash
   # Install browser dependencies
   bunx playwright install-deps chromium
   ```

### Debug Mode
```typescript
const discoveryService = createDiscoverySystem(page, 'playwright', {
  debug: true,
  verbose: true,
  screenshotOnError: true
});
```

This integration guide covers all major scenarios for using UI Scout across different frameworks and environments!