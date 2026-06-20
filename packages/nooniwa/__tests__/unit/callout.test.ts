import { describe, test, expect } from "vitest";
import {
  normalizeCalloutType,
  getCalloutTitle,
} from "../../plugins/remark/callout";

describe("normalizeCalloutType", () => {
  test("maps aliases to their canonical type", () => {
    expect(normalizeCalloutType("hint")).toBe("tip");
    expect(normalizeCalloutType("important")).toBe("tip");
    expect(normalizeCalloutType("summary")).toBe("abstract");
    expect(normalizeCalloutType("caution")).toBe("warning");
    expect(normalizeCalloutType("error")).toBe("danger");
  });

  test("is case-insensitive and passes unknown types through", () => {
    expect(normalizeCalloutType("NOTE")).toBe("note");
    expect(normalizeCalloutType("whatever")).toBe("whatever");
  });
});

describe("getCalloutTitle", () => {
  test("capitalizes the type name", () => {
    expect(getCalloutTitle("note")).toBe("Note");
    expect(getCalloutTitle("tip")).toBe("Tip");
  });
});
