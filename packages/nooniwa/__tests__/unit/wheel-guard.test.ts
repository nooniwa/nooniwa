import { describe, test, expect } from "vitest";

import {
  shouldPreventWheel,
  isScrollable,
  shouldBlockPopoverScroll,
  shouldBlockDrawerScroll,
} from "../../scripts/wheel-guard";

const scrollable = (scrollTop: number) => ({
  scrollTop,
  scrollHeight: 200,
  clientHeight: 100,
});

describe("shouldPreventWheel", () => {
  test("returns true for a non-scrollable element scrolling down", () => {
    expect(
      shouldPreventWheel(10, {
        scrollTop: 0,
        scrollHeight: 100,
        clientHeight: 100,
      }),
    ).toBe(true);
  });

  test("returns true for a non-scrollable element scrolling up", () => {
    expect(
      shouldPreventWheel(-10, {
        scrollTop: 0,
        scrollHeight: 100,
        clientHeight: 100,
      }),
    ).toBe(true);
  });

  test("returns true scrolling up at the top edge", () => {
    expect(shouldPreventWheel(-10, scrollable(0))).toBe(true);
  });

  test("returns true scrolling down at the bottom edge", () => {
    expect(shouldPreventWheel(10, scrollable(100))).toBe(true);
  });

  test("returns false in the middle either way (allow in-element scroll)", () => {
    expect(shouldPreventWheel(10, scrollable(50))).toBe(false);
    expect(shouldPreventWheel(-10, scrollable(50))).toBe(false);
  });

  test("returns false scrolling down at the top edge", () => {
    expect(shouldPreventWheel(10, scrollable(0))).toBe(false);
  });

  test("returns false scrolling up at the bottom edge", () => {
    expect(shouldPreventWheel(-10, scrollable(100))).toBe(false);
  });
});

describe("isScrollable", () => {
  test("returns true when content is taller than the box", () => {
    expect(isScrollable(scrollable(0))).toBe(true);
  });

  test("returns false when content fits the box", () => {
    expect(
      isScrollable({ scrollTop: 0, scrollHeight: 100, clientHeight: 100 }),
    ).toBe(false);
  });
});

describe("shouldBlockPopoverScroll", () => {
  test("always blocks outside the content (over chrome)", () => {
    expect(shouldBlockPopoverScroll(false, scrollable(50))).toBe(true);
  });

  test("does not block over scrollable content (let CSS bounce locally)", () => {
    expect(shouldBlockPopoverScroll(true, scrollable(0))).toBe(false);
    expect(shouldBlockPopoverScroll(true, scrollable(100))).toBe(false);
  });

  test("blocks over non-scrollable content (nothing to bounce)", () => {
    expect(
      shouldBlockPopoverScroll(true, {
        scrollTop: 0,
        scrollHeight: 100,
        clientHeight: 100,
      }),
    ).toBe(true);
  });
});

describe("shouldBlockDrawerScroll", () => {
  test("does not block the column band even at the edge", () => {
    expect(shouldBlockDrawerScroll(false, 10, scrollable(100))).toBe(false);
    expect(shouldBlockDrawerScroll(false, -10, scrollable(0))).toBe(false);
  });

  test("blocks the overlay band at the edge (leak prevention)", () => {
    expect(shouldBlockDrawerScroll(true, 10, scrollable(100))).toBe(true);
  });

  test("does not block the overlay band in the middle", () => {
    expect(shouldBlockDrawerScroll(true, 10, scrollable(50))).toBe(false);
  });

  test("blocks the overlay band when non-scrollable", () => {
    expect(
      shouldBlockDrawerScroll(true, 10, {
        scrollTop: 0,
        scrollHeight: 100,
        clientHeight: 100,
      }),
    ).toBe(true);
  });
});
