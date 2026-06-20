import { describe, test, expect } from "vitest";
import {
  removeComments,
  removeCode,
  removeCommentsAndCode,
} from "../../utils/remove";

describe("removeComments", () => {
  test("a one-line comment is removed (surrounding spaces stay)", () => {
    expect(removeComments("a %%c%% b")).toBe("a  b");
  });

  test("a multi-line comment is removed across newlines", () => {
    expect(removeComments("a %%line1\nline2%% b")).toBe("a  b");
  });

  test("multiple comments are all removed and plain text stays", () => {
    expect(removeComments("%%a%% x %%b%%")).toBe(" x ");
  });

  test("an unclosed trailing %% stays; only the pair is removed", () => {
    expect(removeComments("pre %%secret%% post %%")).toBe("pre  post %%");
  });
});

describe("removeCode", () => {
  test("inline code is removed wholesale (so [[x]] inside is not scanned)", () => {
    expect(removeCode("pre `[[x]]` post")).not.toContain("[[x]]");
  });

  test("a line-start fenced block is removed; text outside it stays", () => {
    const input = "before\n```\n[[inside]]\n```\nafter [[outside]]";
    const out = removeCode(input);
    expect(out).not.toContain("[[inside]]");
    expect(out).toContain("[[outside]]");
  });

  test("a mid-line ``` is not read as a fence opener (regression guard)", () => {
    const input = [
      "a cell with ``` mid-line, the later [[keep-me]] stays",
      "",
      "```js",
      "const x = 1; // [[ignored-in-code]]",
      "```",
    ].join("\n");
    const out = removeCode(input);
    expect(out).toContain("[[keep-me]]");
    expect(out).not.toContain("[[ignored-in-code]]");
  });
});

describe("removeCommentsAndCode", () => {
  test("both code and comments are removed and plain text stays", () => {
    const out = removeCommentsAndCode("%%hide%% `code` keep [[x]]");
    expect(out).not.toContain("hide");
    expect(out).not.toContain("code");
    expect(out).toContain("[[x]]");
  });
});
