import { describe, test, expect } from "vitest";
import { buildFolderTree, shouldBeOpen } from "../../utils/folder-tree";

describe("buildFolderTree", () => {
  test("empty input returns an empty array", () => {
    expect(buildFolderTree([])).toEqual([]);
  });

  test("mixed files and folders nest into a tree (folder kept)", () => {
    const tree = buildFolderTree([
      { id: "a", data: {} },
      { id: "folder/b", data: {} },
    ]);
    expect(tree).toHaveLength(2);
    const folder = tree.find((n) => n.isFolder);
    expect(folder?.name).toBe("folder");
    expect(folder?.children).toHaveLength(1);
    expect(folder?.children[0]?.name).toBe("b");
  });

  test("folders sort before files at the same level", () => {
    const tree = buildFolderTree([
      { id: "aaa", data: {} },
      { id: "zzz/x", data: {} },
    ]);
    expect(tree.map((n) => n.name)).toEqual(["zzz", "aaa"]);
    expect(tree[0]?.isFolder).toBe(true);
    expect(tree[1]?.isFolder).toBe(false);
  });

  test("a folder-named file (index-derived) is moved into the folder's top", () => {
    const tree = buildFolderTree([
      { id: "docs", data: {} },
      { id: "docs/page", data: {} },
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0]?.name).toBe("docs");
    expect(tree[0]?.isFolder).toBe(true);
    expect(tree[0]?.children).toHaveLength(2);
  });
});

describe("shouldBeOpen", () => {
  test("a current path under the folder opens it (true)", () => {
    expect(shouldBeOpen("tech", "/tech/astro")).toBe(true);
    expect(shouldBeOpen("tech", "/tech")).toBe(true);
  });

  test("a path outside the folder, or empty, does not open it (false)", () => {
    expect(shouldBeOpen("tech", "/other/x")).toBe(false);
    expect(shouldBeOpen("tech", "")).toBe(false);
  });
});
