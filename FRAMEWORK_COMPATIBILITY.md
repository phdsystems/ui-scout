# Framework Compatibility Guide

UI Scout is **framework-agnostic** and works with all major web frameworks by analyzing the rendered DOM rather than source code.

## ✅ Supported Frameworks

### React Ecosystem
- **React** (all versions) - Full support
- **Next.js** - SSR/SSG compatible
- **Gatsby** - Static site generation support
- **Create React App** - Standard React apps

**Component Libraries:**
- Material-UI / MUI
- Ant Design
- Chakra UI
- React Bootstrap
- Semantic UI React

### Vue Ecosystem  
- **Vue 2** - Full support
- **Vue 3** - Full support with Composition API
- **Nuxt.js** - SSR/SSG compatible
- **Quasar** - Cross-platform apps

**Component Libraries:**
- Vuetify
- Element UI/Plus
- Ant Design Vue
- Quasar Framework
- PrimeVue

### Angular Ecosystem
- **Angular** (all versions) - Full support
- **Angular Universal** - SSR compatible
- **Ionic** - Mobile/hybrid apps

**Component Libraries:**
- Angular Material
- Ng-Bootstrap
- Ng-Zorro (Ant Design)
- PrimeNG
- DevExtreme

### Other Frameworks
- **Svelte/SvelteKit** - Full support
- **Solid.js** - Full support  
- **Lit** - Web components support
- **Vanilla JS** - Native HTML/CSS/JS

## 🎯 How It Works

### DOM-Based Analysis
UI Scout uses browser automation (Playwright/Puppeteer) to analyze the **final rendered HTML**, making it framework-agnostic:

```typescript
// Discovers elements regardless of framework
const buttonSelectors = [
  "button",                    // Native HTML
  '[role="button"]',           // ARIA roles
  '[class*="button"]',         // CSS classes
  '[class*="btn"]',           // Common patterns
  'input[type="submit"]',      // Form inputs
]
```

### Universal Patterns
Recognizes common UI patterns across all frameworks:

#### Buttons
```html
<!-- React -->
<Button variant="primary">Submit</Button>
<!-- Vue -->
<el-button type="primary">Submit</el-button>  
<!-- Angular -->
<button mat-button>Submit</button>
<!-- All detected by class patterns -->
```

#### Navigation
```html
<!-- React Router -->
<Link to="/dashboard" className="nav-link">Dashboard</Link>
<!-- Vue Router -->
<router-link to="/dashboard" class="nav-link">Dashboard</router-link>
<!-- Angular Router -->
<a routerLink="/dashboard" class="nav-link">Dashboard</a>
<!-- All detected by navigation patterns -->
```

#### Forms
```html
<!-- React -->
<input type="email" className="form-control" />
<!-- Vue -->
<el-input v-model="email" type="email" />
<!-- Angular -->
<mat-form-field><input matInput type="email" /></mat-form-field>
<!-- All detected by input patterns -->
```

## 🚀 Framework-Specific Examples

### React with Material-UI
```jsx
import { Button, TextField, AppBar } from '@mui/material';

function App() {
  return (
    <>
      <AppBar position="static">              {/* ✅ Detected as navigation */}
        <Button color="inherit">Login</Button> {/* ✅ Detected as button */}
      </AppBar>
      <TextField                              {/* ✅ Detected as input */}
        label="Email"
        type="email"
        variant="outlined"
      />
      <Button variant="contained">Submit</Button> {/* ✅ Detected as button */}
    </>
  );
}
```

### Vue with Vuetify
```vue
<template>
  <v-app>
    <v-navigation-drawer>                    <!-- ✅ Detected as navigation -->
      <v-list>
        <v-list-item @click="navigate">      <!-- ✅ Detected as clickable -->
          Dashboard
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    
    <v-main>
      <v-text-field                          <!-- ✅ Detected as input -->
        v-model="email"
        label="Email"
        type="email"
      />
      <v-btn @click="submit">Submit</v-btn>  <!-- ✅ Detected as button -->
    </v-main>
  </v-app>
</template>
```

### Angular with Material
```typescript
@Component({
  template: `
    <mat-toolbar>                            <!-- ✅ Detected as navigation -->
      <button mat-button>Home</button>       <!-- ✅ Detected as button -->
    </mat-toolbar>
    
    <mat-form-field>                         <!-- ✅ Detected as form field -->
      <input matInput 
             type="email" 
             placeholder="Email">            <!-- ✅ Detected as input -->
    </mat-form-field>
    
    <button mat-raised-button 
            (click)="submit()">Submit</button> <!-- ✅ Detected as button -->
  `
})
export class AppComponent { }
```

## 📋 Component Library Support Matrix

| Library | Framework | Buttons | Inputs | Navigation | Forms | Modals |
|---------|-----------|---------|--------|------------|-------|--------|
| Material-UI | React | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ant Design | React | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chakra UI | React | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vuetify | Vue | ✅ | ✅ | ✅ | ✅ | ✅ |
| Element UI | Vue | ✅ | ✅ | ✅ | ✅ | ✅ |
| Quasar | Vue | ✅ | ✅ | ✅ | ✅ | ✅ |
| Angular Material | Angular | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ng-Bootstrap | Angular | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bootstrap | Any | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tailwind CSS | Any | ✅ | ✅ | ✅ | ✅ | ✅ |

## 🔧 Configuration Examples

### React/Next.js Setup
```javascript
// ui-scout.config.js
export default {
  baseUrl: 'http://localhost:3000',
  framework: 'react',
  testFramework: 'playwright',
  componentLibrary: 'mui', // or 'antd', 'chakra'
  customSelectors: {
    buttons: ['.MuiButton-root', '.ant-btn'],
    inputs: ['.MuiTextField-root', '.ant-input']
  }
}
```

### Vue/Nuxt Setup
```javascript
// ui-scout.config.js  
export default {
  baseUrl: 'http://localhost:3000',
  framework: 'vue',
  testFramework: 'playwright',
  componentLibrary: 'vuetify', // or 'element', 'quasar'
  customSelectors: {
    buttons: ['.v-btn', '.el-button'],
    inputs: ['.v-text-field', '.el-input']
  }
}
```

### Angular Setup
```javascript
// ui-scout.config.js
export default {
  baseUrl: 'http://localhost:4200',
  framework: 'angular', 
  testFramework: 'playwright',
  componentLibrary: 'material', // or 'ng-bootstrap'
  customSelectors: {
    buttons: ['.mat-button', '.btn'],
    inputs: ['.mat-form-field', '.form-control']
  }
}
```

## ⚡ Performance Considerations

### Server-Side Rendering (SSR)
- **Next.js**: Waits for hydration before analysis
- **Nuxt.js**: Handles both SSR and client-side routing
- **Angular Universal**: Compatible with server-rendered content

### Single Page Applications (SPA)
- **Client-side routing**: Detects route changes automatically
- **Dynamic content**: Waits for elements to load
- **Lazy loading**: Handles code-split components

### Static Site Generation (SSG)
- **Gatsby**: Works with static builds
- **Next.js Static**: Compatible with `next export`
- **Nuxt Generate**: Handles static generation

## 🚨 Limitations

### Framework-Specific Testing
UI Scout excels at **integration/E2E testing** but doesn't replace:

- **React**: Hook testing, component unit tests
- **Vue**: Composition API unit tests, component isolation
- **Angular**: Service testing, dependency injection

### Dynamic Content
May need additional configuration for:
- Heavy AJAX applications
- Real-time updates (WebSocket)
- Complex state management patterns

## 🎯 Best Practices

### 1. Use Semantic HTML
```html
<!-- Good: Semantic and accessible -->
<button type="submit" aria-label="Submit form">Submit</button>
<nav role="navigation" aria-label="Main navigation">

<!-- Better than: Non-semantic -->
<div class="button" onclick="submit()">Submit</div>
```

### 2. Consistent Class Naming
```html
<!-- Good: Consistent patterns -->
<button class="btn btn-primary">
<button class="btn btn-secondary">

<!-- Good: BEM methodology -->
<button class="button button--primary">
```

### 3. ARIA Attributes
```html
<!-- Enhances detection accuracy -->
<div role="button" aria-label="Close dialog">×</div>
<input type="email" aria-describedby="email-help">
```

### 4. Data Attributes
```html
<!-- Ideal for testing -->
<button data-testid="submit-button">Submit</button>
<form data-testid="login-form">
```

## 📚 Related Documentation

- [Getting Started Guide](./README.md)
- [Configuration Options](./docs/configuration.md)
- [Custom Selectors](./docs/custom-selectors.md)
- [Testing Strategies](./docs/testing-strategies.md)