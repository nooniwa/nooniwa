const docCache = new Map<string, Promise<Document | null>>();

let token = 0;

function embedError(message: string): string {
  return `<div class="embed-error">${message}</div>`;
}

function fetchDoc(url: string): Promise<Document | null> {
  let pending = docCache.get(url);
  if (!pending) {
    pending = fetch(url)
      .then((res) => (res.ok ? res.text() : null))
      .then((html) =>
        html ? new DOMParser().parseFromString(html, "text/html") : null,
      )
      .catch(() => null);
    docCache.set(url, pending);
  }
  return pending;
}

function headingLevel(el: Element): number {
  const m = /^H([1-6])$/.exec(el.tagName);
  return m ? Number(m[1]) : 0;
}

function findById(scope: ParentNode, id: string): Element | null {
  for (const el of scope.querySelectorAll("[id]")) {
    if (el.getAttribute("id") === id) return el;
  }
  return null;
}

function extractFragment(
  prose: Element,
  anchorType: string,
  anchorId: string,
): string | null {
  if (anchorType === "full") return prose.innerHTML;

  const target = anchorId ? findById(prose, anchorId) : null;
  if (!target) return null;

  if (anchorType === "block") return target.outerHTML;

  const level = headingLevel(target);
  let html = target.outerHTML;
  let sib = target.nextElementSibling;
  while (sib) {
    const l = headingLevel(sib);
    if (l > 0 && l <= level) break;
    html += sib.outerHTML;
    sib = sib.nextElementSibling;
  }
  return html;
}

async function namespaceAndFill(
  html: string,
  visited: Set<string>,
): Promise<string> {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;

  const prefix = `embed-${token++}`;
  const idMap = new Map<string, string>();
  for (const el of tpl.content.querySelectorAll("[id]")) {
    const old = el.getAttribute("id");
    if (!old) continue;
    const renamed = `${prefix}-${old}`;
    el.setAttribute("id", renamed);
    idMap.set(old, renamed);
  }
  for (const a of tpl.content.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href");
    if (!href || !href.startsWith("#")) continue;
    const renamed = idMap.get(href.slice(1));
    if (renamed) a.setAttribute("href", `#${renamed}`);
  }

  for (const ph of tpl.content.querySelectorAll<HTMLElement>(".embed")) {
    const content = ph.querySelector(".embed-content");
    if (!content) continue;
    content.innerHTML = await resolveEmbed(
      ph.dataset.embedSrc ?? "",
      ph.dataset.embedAnchorType ?? "full",
      ph.dataset.embedAnchorId ?? "",
      visited,
    );
  }

  return tpl.innerHTML;
}

async function resolveEmbed(
  src: string,
  anchorType: string,
  anchorId: string,
  visited: Set<string>,
): Promise<string> {
  const key = `${src}#${anchorType}:${anchorId}`;
  if (visited.has(key)) return embedError("Embed loop detected");

  const doc = await fetchDoc(src);
  if (!doc) return embedError(`Embed source not found: ${src}`);

  const prose = doc.querySelector("#page-body");
  if (!prose) return embedError(`Embed source has no content: ${src}`);

  const fragmentHtml = extractFragment(prose, anchorType, anchorId);
  if (fragmentHtml === null)
    return embedError(`Embed section not found: ${src}#${anchorId}`);

  visited.add(key);
  const out = await namespaceAndFill(fragmentHtml, visited);
  visited.delete(key);
  return out;
}

export function initEmbedFallback() {
  const embeds = document.querySelectorAll<HTMLElement>(
    ".embed[data-embed-src]",
  );
  for (const embed of embeds) {
    const content = embed.querySelector(".embed-content");
    if (!content || !content.querySelector(".embed-fallback")) continue;

    void resolveEmbed(
      embed.dataset.embedSrc ?? "",
      embed.dataset.embedAnchorType ?? "full",
      embed.dataset.embedAnchorId ?? "",
      new Set<string>(),
    ).then((html) => {
      content.innerHTML = html;
      document.dispatchEvent(new CustomEvent("embed:filled"));
    });
  }
}
