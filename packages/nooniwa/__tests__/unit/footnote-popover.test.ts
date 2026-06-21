import { describe, test, expect } from "vitest";

import { footnoteIdFromHref } from "../../scripts/footnote-popover";

describe("footnoteIdFromHref", () => {
  test("returns the id without the leading # for a normal ref", () => {
    expect(footnoteIdFromHref("#user-content-fn-note")).toBe(
      "user-content-fn-note",
    );
  });

  test("returns null when the href is just # (empty id)", () => {
    expect(footnoteIdFromHref("#")).toBe(null);
  });

  test("returns null when the href has no #", () => {
    expect(footnoteIdFromHref("")).toBe(null);
  });
});
