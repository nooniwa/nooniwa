import { describe, test, expect } from "vitest";

import {
  wrapIndex,
  optionId,
  comboboxAriaState,
  resultsAnnouncement,
  isImeEnter,
} from "../../scripts/search-combobox";

describe("wrapIndex", () => {
  test("returns an in-range index unchanged", () => {
    expect(wrapIndex(2, 5)).toBe(2);
  });

  test("wraps past the end back to 0", () => {
    expect(wrapIndex(5, 5)).toBe(0);
  });

  test("wraps a negative index to the end", () => {
    expect(wrapIndex(-1, 5)).toBe(4);
  });

  test("returns -1 (no selection) when there are 0 candidates", () => {
    expect(wrapIndex(0, 0)).toBe(-1);
  });
});

describe("optionId", () => {
  test("returns a search-option-N id", () => {
    expect(optionId(0)).toBe("search-option-0");
    expect(optionId(3)).toBe("search-option-3");
  });
});

describe("comboboxAriaState", () => {
  test("closed: expanded=false and activedescendant null", () => {
    expect(
      comboboxAriaState({ open: false, activeIndex: 0, count: 3 }),
    ).toEqual({ expanded: "false", activeDescendant: null });
  });

  test("open with a selection: expanded=true and points at the option id", () => {
    expect(comboboxAriaState({ open: true, activeIndex: 1, count: 3 })).toEqual(
      {
        expanded: "true",
        activeDescendant: "search-option-1",
      },
    );
  });

  test("open but unselected (-1): activedescendant null", () => {
    expect(
      comboboxAriaState({ open: true, activeIndex: -1, count: 3 }),
    ).toEqual({ expanded: "true", activeDescendant: null });
  });

  test("activeIndex beyond the count: activedescendant null", () => {
    expect(comboboxAriaState({ open: true, activeIndex: 3, count: 3 })).toEqual(
      {
        expanded: "true",
        activeDescendant: null,
      },
    );
  });
});

describe("resultsAnnouncement", () => {
  test("returns 'No results found' for 0", () => {
    expect(resultsAnnouncement(0)).toBe("No results found");
  });

  test("uses the singular 'result' for 1", () => {
    expect(resultsAnnouncement(1)).toBe("1 result found");
  });

  test("uses the plural 'results' for many", () => {
    expect(resultsAnnouncement(5)).toBe("5 results found");
  });
});

describe("isImeEnter", () => {
  test("guards when the composing flag is set", () => {
    expect(isImeEnter({ isComposing: false, keyCode: 13 }, true)).toBe(true);
  });

  test("guards when e.isComposing is true (Chrome/FF composing keydown)", () => {
    expect(isImeEnter({ isComposing: true, keyCode: 229 }, false)).toBe(true);
  });

  test("guards when keyCode is 229 (Safari commit keydown)", () => {
    expect(isImeEnter({ isComposing: false, keyCode: 229 }, false)).toBe(true);
  });

  test("does not guard a plain Enter (keyCode 13, not composing)", () => {
    expect(isImeEnter({ isComposing: false, keyCode: 13 }, false)).toBe(false);
  });
});
