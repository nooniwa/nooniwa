import { describe, test, expect } from "vitest";
import { Icons, renderIconHtml } from "../../icons";

describe("renderIconHtml", () => {
  test("wraps the body in a complete svg sized on both width and height", () => {
    const svg = renderIconHtml("chevron-down", 20);
    expect(svg).toContain('width="20"');
    expect(svg).toContain('height="20"');
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain(Icons["chevron-down"]);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
  });
});
