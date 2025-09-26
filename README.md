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

- [Complete Documentation](./docs/README.md) - Full documentation index
- [Quick Start Guide](./docs/overview/QUICK-START.md) - Get started in 5 minutes
- [API Reference](./docs/api/CORE.md) - Complete API documentation
- [Examples](./docs/development/EXAMPLES.md) - Real-world usage examples

## 🚀 Installation

```bash
npm install ui-scout
# or
bun add ui-scout
```

## ⚡ Quick Examples

### Basic Discovery with Playwright

```typescript
import { DiscoveryService, PlaywrightPageDriver } from 'ui-scout';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://your-app.com');

const pageDriver = new PlaywrightPageDriver(page);
const discoveryService = new DiscoveryService(pageDriver);

const features = await discoveryService.discoverAllFeatures();
console.log(`Found ${features.length} UI features`);

await browser.close();
```

### Using the Factory Function

```typescript
import { createDiscoverySystem } from 'ui-scout';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://your-app.com');

// Automatically detects framework and creates appropriate adapter
const discoveryService = createDiscoverySystem(page, 'playwright');
const features = await discoveryService.discoverAllFeatures();

console.log(`Discovered ${features.length} features:`);
features.forEach(feature => {
  console.log(`- ${feature.name} (${feature.type})`);
});
```

### Full Discovery with Coordinator

```typescript
import { FeatureDiscoveryCoordinator } from 'ui-scout';

// Note: FeatureDiscoveryCoordinator currently works directly with Playwright Page
const coordinator = new FeatureDiscoveryCoordinator(page);

const result = await coordinator.runComplete();

console.log(`Discovery Results:`);
console.log(`- Found ${result.discovery.count} features`);
console.log(`- Generated ${result.testing?.testCases.length || 0} test cases`);
console.log(`- Test success rate: ${result.testing?.successRate || 0}%`);
```

### Different Framework Adapters

```typescript
// Puppeteer
import { PuppeteerPageDriver } from 'ui-scout';
const pageDriver = new PuppeteerPageDriver(puppeteerPage);

// Custom adapter (implement IPageDriver interface)
class CustomAdapter implements IPageDriver {
  // Implement required methods
}
const pageDriver = new CustomAdapter(yourDriver);
```

## 🧪 Testing Features

The library includes built-in test generation and execution:

```typescript
import { TestCaseGenerator, TestExecutor } from 'ui-scout';

// Generate test cases from discovered features  
const generator = new TestCaseGenerator();
const testCases = await generator.generateFromFeatures(features);

// Execute the generated tests
const executor = new TestExecutor(page);
const results = await executor.executeTestCases(testCases);

console.log(`Executed ${results.length} tests`);
const passed = results.filter(r => r.success).length;
console.log(`Success rate: ${(passed/results.length*100).toFixed(1)}%`);
```

## 📊 Report Generation

Generate comprehensive reports in multiple formats:

```typescript
import { ReportGenerator } from 'ui-scout';

const generator = new ReportGenerator();

// JSON report
await generator.generateJSONReport(features, 'report.json');

// HTML report  
await generator.generateHTMLReport(features, 'report.html');

// Markdown report
await generator.generateMarkdownReport(features, 'report.md');
```

## 🔧 Project Structure

```
src/
├── adapters/           # Framework-specific adapters
├── interfaces/         # TypeScript interfaces
├── services/           # Core discovery services  
├── generators/         # Report and test generators
├── utils/             # Utility functions
└── types.ts           # Type definitions
```

## 🧩 Supported Elements

- **Buttons**: `<button>`, `[role="button"]`, input buttons
- **Inputs**: Text, email, password, number, file, etc.
- **Forms**: Form containers and submission handling
- **Navigation**: Menus, dropdowns, tabs, breadcrumbs
- **Components**: Modals, tables, charts, panels
- **Interactive**: Links, clickable elements, hover targets

## 🔧 Development Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Build** | `bun run build` | Compile TypeScript to JavaScript in `dist/` |
| **Development** | `bun run dev` | Watch mode development with hot reload |
| **Start** | `bun run start` | Run the compiled application from `dist/` |
| **Testing** | `bun run test` | Run all tests with Vitest |
| **Test UI** | `bun run test:ui` | Run tests with interactive Vitest UI |
| **Coverage** | `bun run test:coverage` | Generate test coverage report |
| **Lint** | `bun run lint` | Check code style with ESLint |
| **Lint Fix** | `bun run lint:fix` | Automatically fix ESLint errors |
| **Format** | `bun run format` | Format code with Prettier |
| **Format Check** | `bun run format:check` | Check if code is properly formatted |
| **Type Check** | `bun run typecheck` | Validate TypeScript types without building |
| **Clean** | `bun run clean` | Remove `dist/` and `coverage/` directories |

### Quick Development Workflow

```bash
# Install dependencies
bun install

# Start development with watch mode
bun run dev

# Run tests in watch mode  
bun run test

# Check everything before commit
bun run lint && bun run typecheck && bun run test

# Build for production
bun run build
```

## 📖 License

MIT