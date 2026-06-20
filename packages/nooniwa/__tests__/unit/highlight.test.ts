import { describe, test, expect } from "vitest";
import { processHighlights } from "../../plugins/remark/highlight";

describe("processHighlights", () => {
  test("splits surrounding text into separate nodes around a mark", () => {
    expect(processHighlights("a ==b== c")).toEqual([
      { type: "text", value: "a " },
      { type: "html", value: '<mark class="text-highlight">b</mark>' },
      { type: "text", value: " c" },
    ]);
  });

  test("escapes the highlighted content", () => {
    expect(processHighlights("==<b>==")).toEqual([
      { type: "html", value: '<mark class="text-highlight">&lt;b&gt;</mark>' },
    ]);
  });

  test("returns the text unchanged when nothing matches", () => {
    expect(processHighlights("== spaced ==")).toEqual([
      { type: "text", value: "== spaced ==" },
    ]);
  });
});
