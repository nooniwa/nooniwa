import { initCalloutFold } from "./callout";
import { attachScrollGuard, shouldBlockPopoverScroll } from "./wheel-guard";

const previewCache = new Map<string, { title: string; content: string }>();
let previewTimeout: ReturnType<typeof setTimeout> | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
let returnTimeout: ReturnType<typeof setTimeout> | null = null;
let currentPreviewLink: Element | null = null;
let lastMousePosition: { x: number; y: number } | null = null;
const maxPreviewDepth = 5;
const hideDelayMs = 200;
const previewElements = new Map<number, HTMLElement>();
const mobileMediaQuery = window.matchMedia("(max-width: 767px)");
let previewMediaQueryBound = false;

export function initPagePreview() {
  const previewContainerEl = document.getElementById("page-preview-container");
  const basePreviewEl = document.getElementById("page-preview");
  if (!previewContainerEl || !basePreviewEl) return;
  const previewContainer: HTMLElement = previewContainerEl;
  const basePreview: HTMLElement = basePreviewEl;

  if (previewElements.size === 0) {
    basePreview.setAttribute("data-depth", "0");
    basePreview.style.zIndex = "90";
    previewElements.set(0, basePreview);
    attachPreviewHoverHandlers(basePreview, previewContainer);
  }

  if (mobileMediaQuery.matches) {
    return;
  }

  attachPreviewHandlers(document.body);
  attachGlobalPreviewHideGuard(previewContainer);

  document.addEventListener("embed:filled", () => {
    attachPreviewHandlers(document.body);
  });

  function handleMouseEnter(e: Event) {
    if (mobileMediaQuery.matches) return;
    const link = e.currentTarget as Element;
    const hoverPoint =
      e instanceof MouseEvent ? { x: e.clientX, y: e.clientY } : null;
    if (e instanceof MouseEvent) {
      lastMousePosition = { x: e.clientX, y: e.clientY };
    }
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("http")) return;

    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    currentPreviewLink = link;

    const parentPreview = link.closest(".page-preview");
    const parentDepth = parentPreview
      ? Number(parentPreview.getAttribute("data-depth") || "0")
      : -1;
    const depth = parentDepth >= 0 ? parentDepth + 1 : 0;

    hidePreviewsFrom(depth + 1);

    previewTimeout = setTimeout(() => {
      showPreview(link, href, depth, hoverPoint);
    }, 300);
  }

  function handleMouseLeave() {
    if (previewTimeout) {
      clearTimeout(previewTimeout);
      previewTimeout = null;
    }
    currentPreviewLink = null;

    scheduleHideIfIdle(previewContainer);
  }

  async function showPreview(
    link: Element,
    href: string,
    depth: number,
    hoverPoint: { x: number; y: number } | null,
  ) {
    const effectiveDepth = Math.min(depth, maxPreviewDepth);
    const preview = getPreviewForDepth(
      effectiveDepth,
      previewContainer,
      basePreview,
    );
    if (!preview) return;
    const titleEl = preview.querySelector(".page-preview-title");
    const contentEl = preview.querySelector(
      ".page-preview-content",
    ) as HTMLElement | null;
    const linkEl = preview.querySelector(
      ".page-preview-link",
    ) as HTMLButtonElement | null;
    if (!titleEl || !contentEl) return;
    const trimmedHref = href.replace(/#$/, "");
    const targetHref = trimmedHref || href;
    if (linkEl) {
      if (targetHref && targetHref !== "#") {
        linkEl.onclick = () => {
          window.location.assign(targetHref);
        };
      } else {
        linkEl.onclick = () => {};
      }
    }

    preview.classList.toggle("title-only", effectiveDepth >= maxPreviewDepth);

    titleEl.textContent = "Loading...";
    contentEl.innerHTML = '<div class="page-preview-loading">Loading...</div>';

    positionPreview(preview, link, hoverPoint);
    preview.classList.add("visible");
    hidePreviewsFrom(effectiveDepth + 1);

    if (effectiveDepth >= maxPreviewDepth) {
      const linkTitle = link.textContent?.trim() || href;
      titleEl.textContent = linkTitle;
      contentEl.innerHTML = "";
      updatePreviewScrollState(preview, contentEl);
      return;
    }

    if (previewCache.has(href)) {
      const cached = previewCache.get(href)!;
      titleEl.textContent = cached.title;
      contentEl.innerHTML = cached.content;
      attachPreviewHandlers(contentEl);
      initCalloutFold();
      updatePreviewScrollState(preview, contentEl);
      return;
    }

    try {
      const response = await fetch(href);

      if (!response.ok) throw new Error("Failed to fetch page preview.");

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const title = doc.querySelector("h1")?.textContent || doc.title || href;

      const articleContent = doc.querySelector("#page-body");
      let content = "";
      if (articleContent) {
        content = articleContent.innerHTML;
      }

      if (!content) {
        content = "<p>No preview available</p>";
      }

      previewCache.set(href, { title, content });

      if (currentPreviewLink === link) {
        titleEl.textContent = title;
        contentEl.innerHTML = content;
        attachPreviewHandlers(contentEl);
        initCalloutFold();
        updatePreviewScrollState(preview, contentEl);
      }
    } catch {
      if (currentPreviewLink === link && titleEl && contentEl) {
        titleEl.textContent = "Error";
        contentEl.innerHTML = "<p>Could not load preview</p>";
        updatePreviewScrollState(preview, contentEl);
      }
    }
  }

  function hidePreviewsFrom(startDepth: number) {
    previewElements.forEach((element, depthValue) => {
      if (depthValue >= startDepth) {
        element.classList.remove("visible");
      }
    });
  }

  function positionPreview(
    preview: HTMLElement,
    link: Element,
    hoverPoint: { x: number; y: number } | null,
  ) {
    const rect = link.getBoundingClientRect();
    const padding = 12;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const availableWidth = Math.max(240, viewportWidth - padding * 2);
    const previewWidth = Math.min(420, availableWidth);
    const previewHeight = Math.min(560, Math.max(220, viewportHeight * 0.6));

    let left = rect.left;
    let top = rect.bottom + padding;
    let maxHeight = previewHeight;

    const mouse = hoverPoint || lastMousePosition;
    if (mouse) {
      const mouseX = mouse.x;
      const mouseY = mouse.y;
      const availableBelow = viewportHeight - padding - mouseY;
      const availableAbove = mouseY - padding;
      const preferBelow = availableBelow >= previewHeight;
      const useBelow = preferBelow || availableBelow >= availableAbove;

      left = mouseX + padding;
      if (useBelow) {
        maxHeight = Math.min(previewHeight, availableBelow);
        top = mouseY + padding;
        preview.style.bottom = "";
      } else {
        maxHeight = Math.min(previewHeight, availableAbove);
        top = mouseY - maxHeight - padding;
        preview.style.bottom = `${viewportHeight - mouseY + padding}px`;
      }
    }

    const minLeft = padding;
    const maxLeft = viewportWidth - previewWidth - padding;
    left = Math.min(Math.max(left, minLeft), maxLeft);

    if (top + maxHeight > viewportHeight - padding) {
      top = viewportHeight - maxHeight - padding;
    }

    const siteHeader = document.querySelector(
      ".site-header",
    ) as HTMLElement | null;
    const headerHeight = siteHeader?.offsetHeight ?? 0;
    const minTop = padding + headerHeight;
    if (top < minTop) {
      top = minTop;
    }

    preview.style.width = `${previewWidth}px`;
    preview.style.left = `${left}px`;
    if (!preview.style.bottom) {
      preview.style.top = `${top}px`;
    } else {
      preview.style.top = "";
    }
    preview.style.maxHeight = `${maxHeight}px`;
  }

  function handleMouseMove(e: MouseEvent) {
    lastMousePosition = { x: e.clientX, y: e.clientY };
  }

  function isPreviewableLink(link: Element) {
    const href = link.getAttribute("href");
    if (!href) return false;
    if (href.startsWith("#")) return false;
    if (href.startsWith("http")) return false;
    if (href.startsWith("mailto:")) return false;
    if (href.startsWith("tel:")) return false;
    if (link.classList.contains("page-preview-link")) return false;
    if (link.classList.contains("embed-expand")) return false;
    if (link.closest(".site-header")) return false;
    if (link.closest(".page-left")) return false;
    if (link.closest(".page-right")) return false;
    return true;
  }

  function attachPreviewHandlers(root: ParentNode) {
    root.querySelectorAll("a").forEach((link) => {
      if (!isPreviewableLink(link)) return;
      if (link.hasAttribute("data-preview-handler")) return;

      link.setAttribute("data-preview-handler", "true");
      link.addEventListener("mouseenter", handleMouseEnter);
      link.addEventListener("mouseleave", handleMouseLeave);
      link.addEventListener("mousemove", handleMouseMove);
    });
  }

  function attachPreviewHoverHandlers(
    preview: HTMLElement,
    container: HTMLElement,
  ) {
    if (preview.hasAttribute("data-preview-hover")) return;
    preview.setAttribute("data-preview-hover", "true");
    preview.addEventListener("mouseenter", () => {
      cancelHide();
      const depth = Number(preview.getAttribute("data-depth") || "0");
      scheduleReturnCollapse(depth);
    });

    preview.addEventListener("mouseleave", () => {
      currentPreviewLink = null;
      cancelReturnCollapse();
      scheduleHideIfIdle(container);
    });

    preview.addEventListener(
      "mousemove",
      (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (isHoveringPreviewableLink(target)) {
          cancelReturnCollapse();
          return;
        }
        const depth = Number(preview.getAttribute("data-depth") || "0");
        scheduleReturnCollapse(depth);
      },
      { passive: true },
    );

    const contentEl = preview.querySelector<HTMLElement>(
      ".page-preview-content",
    );
    if (contentEl)
      attachScrollGuard(preview, (_deltaY, target) =>
        shouldBlockPopoverScroll(contentEl.contains(target as Node), contentEl),
      );
  }

  function isHoveringAnyPreview(container: HTMLElement) {
    return Boolean(container.querySelector(".page-preview:hover"));
  }

  function isHoveringPreviewableLink(target: Element | null) {
    if (!target) return false;
    return Boolean(target.closest('a[data-preview-handler="true"]'));
  }

  function cancelHide() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  }

  function cancelReturnCollapse() {
    if (returnTimeout) {
      clearTimeout(returnTimeout);
      returnTimeout = null;
    }
  }

  function scheduleReturnCollapse(depth: number) {
    cancelReturnCollapse();
    returnTimeout = setTimeout(() => {
      hidePreviewsFrom(depth + 1);
    }, hideDelayMs);
  }

  function scheduleHideIfIdle(container: HTMLElement) {
    cancelHide();
    hideTimeout = setTimeout(() => {
      const activeElement = document.elementFromPoint(
        lastMousePosition?.x ?? 0,
        lastMousePosition?.y ?? 0,
      );
      const hoveringLink = isHoveringPreviewableLink(activeElement);
      if (!hoveringLink && !isHoveringAnyPreview(container)) {
        hidePreviewsFrom(0);
      }
    }, hideDelayMs);
  }

  function isScrollable(element: HTMLElement) {
    return element.scrollHeight > element.clientHeight;
  }

  function updatePreviewScrollState(
    preview: HTMLElement,
    contentEl: HTMLElement,
  ) {
    if (isScrollable(contentEl)) {
      preview.classList.add("has-scroll");
    } else {
      preview.classList.remove("has-scroll");
    }
  }

  function getPreviewForDepth(
    depth: number,
    container: HTMLElement,
    template: HTMLElement,
  ) {
    const existing = previewElements.get(depth);
    if (existing) return existing;

    const clone = template.cloneNode(true) as HTMLElement;
    clone.setAttribute("data-depth", String(depth));
    clone.removeAttribute("id");
    clone.style.zIndex = String(90 + depth);
    container.appendChild(clone);
    previewElements.set(depth, clone);
    attachPreviewHoverHandlers(clone, container);
    return clone;
  }

  function attachGlobalPreviewHideGuard(container: HTMLElement) {
    if (container.dataset.hideGuard === "true") return;
    container.dataset.hideGuard = "true";

    document.addEventListener(
      "mousemove",
      (event) => {
        lastMousePosition = { x: event.clientX, y: event.clientY };
        const target = event.target instanceof Element ? event.target : null;
        if (isHoveringPreviewableLink(target)) {
          cancelHide();
          cancelReturnCollapse();
          return;
        }
        const preview = target?.closest(".page-preview");
        if (preview) {
          cancelHide();
          const depth = Number(preview.getAttribute("data-depth") || "0");
          scheduleReturnCollapse(depth);
          return;
        }
        scheduleHideIfIdle(container);
      },
      { passive: true },
    );
  }

  if (!previewMediaQueryBound) {
    mobileMediaQuery.addEventListener("change", (event) => {
      if (event.matches) {
        hidePreviewsFrom(0);
      }
    });
    previewMediaQueryBound = true;
  }
}
