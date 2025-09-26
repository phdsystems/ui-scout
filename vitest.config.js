"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
const path_1 = __importDefault(require("path"));
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true,
        environment: "node",
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
            "@": path_1.default.resolve(__dirname, "./src"),
            "@interfaces": path_1.default.resolve(__dirname, "./src/interfaces"),
            "@adapters": path_1.default.resolve(__dirname, "./src/adapters"),
            "@services": path_1.default.resolve(__dirname, "./src/services"),
            "@utils": path_1.default.resolve(__dirname, "./src/utils"),
            "@types": path_1.default.resolve(__dirname, "./src/types"),
        },
    },
});
//# sourceMappingURL=vitest.config.js.map