"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)("Example Test Suite", () => {
    (0, vitest_1.beforeEach)(() => {
        // Setup before each test
    });
    (0, vitest_1.it)("should pass basic assertion", () => {
        (0, vitest_1.expect)(1 + 1).toBe(2);
    });
    (0, vitest_1.it)("should handle arrays", () => {
        const arr = [1, 2, 3];
        (0, vitest_1.expect)(arr).toHaveLength(3);
        (0, vitest_1.expect)(arr).toContain(2);
    });
    (0, vitest_1.it)("should handle objects", () => {
        const obj = { name: "test", value: 42 };
        (0, vitest_1.expect)(obj).toHaveProperty("name", "test");
        (0, vitest_1.expect)(obj.value).toBeGreaterThan(40);
    });
});
//# sourceMappingURL=example.test.js.map