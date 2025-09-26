# 🔍 UI Scout

Automated UI element discovery and test generation for web applications. Scout your UI, generate tests automatically.

## ✨ Features

- **Framework Agnostic**: Works with Playwright, Puppeteer, Selenium, and custom adapters
- **Comprehensive Discovery**: Finds buttons, inputs, forms, navigation, modals, tables, charts, and more  
- **Test Generation**: Automatically generates test cases from discovered elements
- **Multiple Outputs**: JSON, HTML, and Markdown reports
- **TypeScript**: Full type safety and IntelliSense support
- **Zero Configuration**: Works out of the box with sensible defaults

## 📚 Documentation

- [📋 Overview](./docs/overview/) - What UI Scout does and architecture
- [🚀 Quick Start](./docs/overview/QUICK-START.md) - Get started in 5 minutes
- [📖 Complete Guide](./docs/technical/COMPLETE-GUIDE.md) - In-depth technical documentation
- [🔌 API Reference](./docs/api/CORE.md) - Complete API documentation
- [💼 Use Cases](./docs/business/USE-CASES.md) - Business scenarios and benefits
- [🛠️ Examples](./docs/development/EXAMPLES.md) - Real-world usage examples

## 🚀 Quick Start

```bash
bun add ui-scout
```

```typescript
import { createDiscoverySystem } from 'ui-scout';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://your-app.com');

const discoveryService = createDiscoverySystem(page, 'playwright');
const features = await discoveryService.discoverAllFeatures();

console.log(`Found ${features.length} UI features`);
```

## 🔧 Development

```bash
bun install
bun run dev
bun test
```

See [development examples](./docs/development/EXAMPLES.md) for detailed usage patterns.

## 📖 License

MIT