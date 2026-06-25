import { describe, test, expect, vi } from "vitest";
import { memoizeForBuild } from "../../utils/memoize";

describe("memoizeForBuild (shares a result only during a build)", () => {
  test("enabled=true computes once and returns the same instance", () => {
    const compute = vi.fn(() => ({ value: Math.random() }));
    const memoized = memoizeForBuild(compute, true);

    const first = memoized();
    const second = memoized();

    expect(compute).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  test("enabled=false recomputes every call and returns a new instance", () => {
    const compute = vi.fn(() => ({ value: Math.random() }));
    const memoized = memoizeForBuild(compute, false);

    const first = memoized();
    const second = memoized();

    expect(compute).toHaveBeenCalledTimes(2);
    expect(second).not.toBe(first);
  });

  test("a Promise-returning compute shares the same in-flight Promise", async () => {
    const compute = vi.fn(async () => ({ value: 1 }));
    const memoized = memoizeForBuild(compute, true);

    const p1 = memoized();
    const p2 = memoized();

    expect(compute).toHaveBeenCalledTimes(1);
    expect(p2).toBe(p1);
    await expect(p1).resolves.toEqual({ value: 1 });
  });
});
