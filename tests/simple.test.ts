import { describe, it, expect } from "vitest";

describe("Simple Test Suite", () => {
  it("should pass basic arithmetic test", () => {
    expect(2 + 2).toBe(4);
  });

  it("should pass string test", () => {
    expect("hello" + " world").toBe("hello world");
  });

  it("should pass array test", () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr[0]).toBe(1);
  });

  it("should pass object test", () => {
    const obj = { name: "test", value: 42 };
    expect(obj.name).toBe("test");
    expect(obj.value).toBe(42);
  });

  it("should pass async test", async () => {
    const promise = Promise.resolve("success");
    await expect(promise).resolves.toBe("success");
  });
});
