import { describe, test, expect } from "vitest";
import { parse } from "node-html-parser";
import { extractFragment, namespaceIds } from "../../utils/embed-inline";

const SOURCE_HTML =
  `<p>Intro.</p>` +
  `<h2 id="sec-a">Section A</h2><p>A body.</p>` +
  `<h2 id="sec-b">Section B</h2><p>B body.</p>` +
  `<h3 id="sec-b-sub">B subheading</h3><p>Sub body.</p>` +
  `<h2 id="sec-c">Section C</h2><p id="blk">Block paragraph.</p>`;

const pageBody = parse(SOURCE_HTML);

describe("extractFragment", () => {
  test('"full" returns the whole body innerHTML', () => {
    expect(extractFragment(pageBody, "full", "")).toBe(pageBody.innerHTML);
  });

  test('"heading" returns the heading up to the next same-level heading (nested subheadings included)', () => {
    const frag = extractFragment(pageBody, "heading", "sec-b");
    expect(frag).not.toBeNull();
    expect(frag).toContain('<h2 id="sec-b">Section B</h2>');
    expect(frag).toContain("<p>B body.</p>");
    expect(frag).toContain('<h3 id="sec-b-sub">B subheading</h3>');
    expect(frag).toContain("<p>Sub body.</p>");
    expect(frag).not.toContain('id="sec-c"');
    expect(frag).not.toContain('id="blk"');
    expect(frag).toBe(
      '<h2 id="sec-b">Section B</h2>\n' +
        "<p>B body.</p>\n" +
        '<h3 id="sec-b-sub">B subheading</h3>\n' +
        "<p>Sub body.</p>",
    );
  });

  test('"heading" on the last heading includes the trailing siblings to the end', () => {
    const frag = extractFragment(pageBody, "heading", "sec-c");
    expect(frag).toBe(
      '<h2 id="sec-c">Section C</h2>\n<p id="blk">Block paragraph.</p>',
    );
  });

  test('"block" returns only that id\'s element outerHTML', () => {
    expect(extractFragment(pageBody, "block", "blk")).toBe(
      '<p id="blk">Block paragraph.</p>',
    );
  });

  test('"heading" with a missing id returns null', () => {
    expect(extractFragment(pageBody, "heading", "no-such")).toBeNull();
  });

  test('"block" with a missing id returns null', () => {
    expect(extractFragment(pageBody, "block", "no-such")).toBeNull();
  });
});

describe("namespaceIds", () => {
  test("prefixes ids and follows internal #href (external/absolute URLs unchanged)", () => {
    const frag = parse(
      '<h2 id="sec-b">B</h2>' +
        '<a href="#sec-b">jump</a>' +
        '<a href="/ext/">ext</a>' +
        '<a href="https://x.com/#frag">abs</a>',
    );

    namespaceIds(frag, "embed-0");

    expect(frag.querySelector("h2")?.getAttribute("id")).toBe("embed-0-sec-b");
    expect(frag.querySelector('a[href="#embed-0-sec-b"]')).not.toBeNull();
    expect(frag.querySelector('a[href="/ext/"]')).not.toBeNull();
    expect(frag.querySelector('a[href="https://x.com/#frag"]')).not.toBeNull();
  });
});
