import { describe, test, expect } from "vitest";

import {
  serializeSidebarScroll,
  parseSidebarScroll,
  shouldGateSidebar,
  SIDEBAR_SCROLL_KEY,
} from "../../scripts/sidebar-scroll";

describe("serializeSidebarScroll", () => {
  test("rounds a fractional scrollTop to an integer string", () => {
    expect(serializeSidebarScroll(120.6)).toBe("121");
  });

  test("clamps a negative scrollTop to 0", () => {
    expect(serializeSidebarScroll(-5)).toBe("0");
  });

  test('serializes 0 as "0"', () => {
    expect(serializeSidebarScroll(0)).toBe("0");
  });
});

describe("parseSidebarScroll", () => {
  test("parses a positive numeric string to a number", () => {
    expect(parseSidebarScroll("121")).toBe(121);
  });

  test("returns 0 when the value is null", () => {
    expect(parseSidebarScroll(null)).toBe(0);
  });

  test("returns 0 for a non-numeric string", () => {
    expect(parseSidebarScroll("abc")).toBe(0);
  });

  test("returns 0 for a negative value", () => {
    expect(parseSidebarScroll("-10")).toBe(0);
  });

  test("returns 0 for an empty string", () => {
    expect(parseSidebarScroll("")).toBe(0);
  });
});

describe("shouldGateSidebar", () => {
  test("gates when a positive position is stored", () => {
    expect(shouldGateSidebar("121")).toBe(true);
  });

  test("does not gate when null", () => {
    expect(shouldGateSidebar(null)).toBe(false);
  });

  test("does not gate when 0 is stored", () => {
    expect(shouldGateSidebar("0")).toBe(false);
  });
});

describe("round-trip", () => {
  test("parsing a serialized value yields the rounded scrollTop", () => {
    expect(parseSidebarScroll(serializeSidebarScroll(248.6))).toBe(249);
  });
});

describe("SIDEBAR_SCROLL_KEY", () => {
  test("follows the shared nooniwa storage namespace", () => {
    expect(SIDEBAR_SCROLL_KEY).toBe("nooniwa:sidebar-scroll");
  });
});
