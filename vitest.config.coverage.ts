import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/**/*.test.ts", "src/**/types.ts", "src/**/interfaces/**"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
      all: true, // Include files with no tests
      clean: true, // Clean coverage results before running tests
      reportsDirectory: "./coverage",
      watermarks: {
        statements: [95, 100],
        functions: [95, 100],
        branches: [95, 100],
        lines: [95, 100],
      },
    },
  },
});
