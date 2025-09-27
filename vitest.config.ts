import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules",
        "dist",
        "tests",
        "*.config.ts",
        "*.config.js",
        "src/types",
        "src/interfaces",
      ],
    },
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts", "src/**/*.test.ts", "src/**/*.spec.ts"],
    exclude: ["node_modules", "dist"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@interfaces": path.resolve(__dirname, "./src/interfaces"),
      "@adapters": path.resolve(__dirname, "./src/adapters"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@types": path.resolve(__dirname, "./src/types"),
    },
  },
});
