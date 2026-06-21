const EXCLUDED_HASH_IDS = new Set(["page-main"]);

let hashHighlightInitialized = false;
let highlightTimerId: number | null = null;

function safeDecodeHash(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/$/, "") : path;
}

function highlightTarget(targetId?: string) {
  if (!targetId) {
    const hash = window.location.hash;
    if (!hash) return;
    targetId = safeDecodeHash(hash.slice(1));
  }

  if (EXCLUDED_HASH_IDS.has(targetId)) return;

  const target = document.getElementById(targetId);
  if (!target) return;

  if (highlightTimerId !== null) {
    clearTimeout(highlightTimerId);
    highlightTimerId = null;
  }

  document.querySelectorAll(".hash-highlight").forEach((el) => {
    el.classList.remove("hash-highlight");
  });

  target.scrollIntoView({ behavior: "smooth", block: "start" });

  target.style.animation = "none";
  void target.offsetWidth;
  target.style.animation = "";
  target.classList.add("hash-highlight");

  highlightTimerId = window.setTimeout(() => {
    target.classList.remove("hash-highlight");
    highlightTimerId = null;
  }, 3000);
}

export function triggerHashHighlight(rawTargetId: string) {
  const targetId = safeDecodeHash(rawTargetId);
  if (EXCLUDED_HASH_IDS.has(targetId)) return;

  const newHash = "#" + rawTargetId;
  if (window.location.hash !== newHash) {
    history.pushState(null, "", newHash);
  }

  highlightTarget(targetId);
}

export function initHashHighlight() {
  if (window.location.hash) {
    setTimeout(() => highlightTarget(), 100);
  }

  if (!hashHighlightInitialized) {
    window.addEventListener("hashchange", () => highlightTarget());
    hashHighlightInitialized = true;
  }

  document.querySelectorAll('a[href*="#"]').forEach((link) => {
    if (link.hasAttribute("data-highlight-handler")) return;

    const href = link.getAttribute("href");
    if (!href) return;

    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) return;

    const pathPart = href.slice(0, hashIndex);
    const currentPath = window.location.pathname;

    if (
      pathPart !== "" &&
      normalizePath(pathPart) !== normalizePath(currentPath)
    )
      return;

    link.setAttribute("data-highlight-handler", "true");

    link.addEventListener("click", (e) => {
      const rawTargetId = href.slice(hashIndex + 1);
      if (EXCLUDED_HASH_IDS.has(safeDecodeHash(rawTargetId))) return;

      e.preventDefault();
      triggerHashHighlight(rawTargetId);
    });
  });
}
