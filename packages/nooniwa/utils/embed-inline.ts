import fs from "node:fs";
import path from "node:path";
import { parse, HTMLElement } from "node-html-parser";

const PARSE_OPTIONS = {
  blockTextElements: { script: true, noscript: true, style: true, pre: true },
} as const;

function distPathForUrl(distDir: string, url: string): string {
  const rel = url.replace(/^\/+/, "").replace(/\/+$/, "");
  return rel
    ? path.join(distDir, rel, "index.html")
    : path.join(distDir, "index.html");
}

function headingLevel(el: HTMLElement): number {
  const m = /^H([1-6])$/.exec(el.tagName ?? "");
  return m ? Number(m[1]) : 0;
}

function getPageBody(root: HTMLElement): HTMLElement | null {
  return root.querySelector("#page-body");
}

function findById(scope: HTMLElement, id: string): HTMLElement | null {
  for (const el of scope.querySelectorAll("[id]")) {
    if (el.getAttribute("id") === id) return el;
  }
  return null;
}

export function extractFragment(
  pageBody: HTMLElement,
  anchorType: string,
  anchorId: string,
): string | null {
  if (anchorType === "full") return pageBody.innerHTML;

  const target = anchorId ? findById(pageBody, anchorId) : null;
  if (!target) return null;

  if (anchorType === "block") return target.outerHTML;

  const level = headingLevel(target);
  const parts: string[] = [target.outerHTML];
  let sib = target.nextElementSibling;
  while (sib) {
    if (headingLevel(sib) > 0 && headingLevel(sib) <= level) break;
    parts.push(sib.outerHTML);
    sib = sib.nextElementSibling;
  }
  return parts.join("\n");
}

export function namespaceIds(frag: HTMLElement, token: string): void {
  const idMap = new Map<string, string>();
  for (const el of frag.querySelectorAll("[id]")) {
    const old = el.getAttribute("id");
    if (!old) continue;
    const renamed = `${token}-${old}`;
    el.setAttribute("id", renamed);
    idMap.set(old, renamed);
  }
  for (const a of frag.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href");
    if (!href || !href.startsWith("#")) continue;
    const renamed = idMap.get(href.slice(1));
    if (renamed) a.setAttribute("href", `#${renamed}`);
  }
}

export interface InlineEmbedsResult {
  filesScanned: number;
  filesModified: number;
  embedsFilled: number;
}

export function inlineEmbeds(distDir: string): InlineEmbedsResult {
  const htmlFiles: string[] = [];
  for (const entry of fs.readdirSync(distDir, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (entry.isFile() && entry.name.endsWith(".html")) {
      htmlFiles.push(path.join(entry.parentPath, entry.name));
    }
  }
  const rawByUrlPath = new Map<string, string>();
  for (const file of htmlFiles) {
    rawByUrlPath.set(file, fs.readFileSync(file, "utf-8"));
  }

  let counter = 0;
  const nextToken = () => `embed-${counter++}`;

  const embedError = (message: string) =>
    `<div class="embed-error">${message}</div>`;

  function resolveEmbed(
    src: string,
    anchorType: string,
    anchorId: string,
    visited: Set<string>,
  ): string {
    const key = `${src}#${anchorType}:${anchorId}`;
    if (visited.has(key)) return embedError("Embed loop detected");

    const srcPath = distPathForUrl(distDir, src);
    const srcHtml = rawByUrlPath.get(srcPath);
    if (srcHtml === undefined)
      return embedError(`Embed source not found: ${src}`);

    const pageBody = getPageBody(parse(srcHtml, PARSE_OPTIONS));
    if (!pageBody) return embedError(`Embed source has no content: ${src}`);

    const fragmentHtml = extractFragment(pageBody, anchorType, anchorId);
    if (fragmentHtml === null)
      return embedError(`Embed section not found: ${src}#${anchorId}`);

    const frag = parse(fragmentHtml, PARSE_OPTIONS);

    namespaceIds(frag, nextToken());

    visited.add(key);
    for (const ph of frag.querySelectorAll(".embed")) {
      const content = ph.querySelector(".embed-content");
      if (!content) continue;
      content.innerHTML = resolveEmbed(
        ph.getAttribute("data-embed-src") ?? "",
        ph.getAttribute("data-embed-anchor-type") ?? "full",
        ph.getAttribute("data-embed-anchor-id") ?? "",
        visited,
      );
    }
    visited.delete(key);

    return frag.toString();
  }

  let filesModified = 0;
  let embedsFilled = 0;
  for (const file of htmlFiles) {
    const html = rawByUrlPath.get(file)!;
    if (!html.includes("data-embed-src")) continue;

    const root = parse(html, PARSE_OPTIONS);
    const placeholders = root.querySelectorAll(".embed[data-embed-src]");
    let changed = false;
    for (const ph of placeholders) {
      const content = ph.querySelector(".embed-content");
      if (!content) continue;
      content.innerHTML = resolveEmbed(
        ph.getAttribute("data-embed-src") ?? "",
        ph.getAttribute("data-embed-anchor-type") ?? "full",
        ph.getAttribute("data-embed-anchor-id") ?? "",
        new Set<string>(),
      );
      changed = true;
      embedsFilled++;
    }

    if (changed) {
      const doctype = /^\s*<!doctype[^>]*>/i.exec(html)?.[0] ?? "";
      let out = root.toString();
      if (doctype && !/^\s*<!doctype/i.test(out)) out = `${doctype}\n${out}`;
      fs.writeFileSync(file, out, "utf-8");
      filesModified++;
    }
  }

  return { filesScanned: htmlFiles.length, filesModified, embedsFilled };
}
