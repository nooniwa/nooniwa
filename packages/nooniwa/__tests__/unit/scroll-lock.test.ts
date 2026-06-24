import { describe, test, expect, vi, beforeEach } from "vitest";

function stubDom() {
  const bodyStyle = { position: "", top: "", left: "", right: "" };
  vi.stubGlobal("document", { body: { style: bodyStyle } });
  vi.stubGlobal("window", { scrollY: 0, scrollTo: vi.fn() });
  return { bodyStyle };
}

describe("setScrollLock (owner-based scroll lock)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  test("a single owner locks the body to position:fixed", async () => {
    const { bodyStyle } = stubDom();
    const { setScrollLock } = await import("../../scripts/scroll-lock");

    setScrollLock("graph-modal", true);

    expect(bodyStyle.position).toBe("fixed");
  });

  test("releasing one owner keeps the lock while another remains, clears on the last", async () => {
    const { bodyStyle } = stubDom();
    const { setScrollLock } = await import("../../scripts/scroll-lock");

    setScrollLock("sidebar-left", true);
    setScrollLock("graph-modal", true);
    setScrollLock("sidebar-left", false);
    expect(bodyStyle.position).toBe("fixed");

    setScrollLock("graph-modal", false);
    expect(bodyStyle.position).toBe("");
  });
});
