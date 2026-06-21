import { renderIconHtml } from "../icons";
import { triggerHashHighlight } from "./hash-highlight";
import { attachScrollGuard, shouldBlockPopoverScroll } from "./wheel-guard";

const showDelayMs = 300;
const hideDelayMs = 200;

export function footnoteIdFromHref(href: string): string | null {
  const id = href.startsWith("#") ? href.slice(1) : "";
  return id || null;
}

export function initFootnotePopover() {
  const mobileMediaQuery = window.matchMedia("(max-width: 767px)");
  if (mobileMediaQuery.matches) return;

  const refs = document.querySelectorAll<HTMLAnchorElement>(
    "a[data-footnote-ref]",
  );
  if (refs.length === 0) return;

  const popover = createPopoverElement();
  const contentEl = popover.querySelector(
    ".page-preview-content",
  ) as HTMLElement;
  const linkEl = popover.querySelector(
    ".page-preview-link",
  ) as HTMLButtonElement;

  let showTimeout: ReturnType<typeof setTimeout> | null = null;
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;
  let currentRef: HTMLAnchorElement | null = null;

  function cancelShow() {
    if (showTimeout) {
      clearTimeout(showTimeout);
      showTimeout = null;
    }
  }

  function cancelHide() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  }

  function hide() {
    cancelShow();
    currentRef = null;
    popover.classList.remove("visible");
  }

  function scheduleHide() {
    cancelHide();
    hideTimeout = setTimeout(hide, hideDelayMs);
  }

  function show(ref: HTMLAnchorElement) {
    const href = ref.getAttribute("href");
    if (!href) return;
    const id = footnoteIdFromHref(href);
    if (!id) return;
    const def = document.getElementById(id);
    if (!def) return;
    contentEl.innerHTML = def.innerHTML;
    contentEl
      .querySelectorAll("[data-footnote-backref]")
      .forEach((el) => el.remove());
    linkEl.onclick = () => {
      triggerHashHighlight(id);
    };
    positionPopover(popover, ref);
    updateScrollState(popover, contentEl);
    popover.classList.add("visible");
  }

  refs.forEach((ref) => {
    ref.addEventListener("mouseenter", () => {
      if (mobileMediaQuery.matches) return;
      cancelHide();
      currentRef = ref;
      cancelShow();
      showTimeout = setTimeout(() => {
        if (currentRef === ref) show(ref);
      }, showDelayMs);
    });
    ref.addEventListener("mouseleave", () => {
      cancelShow();
      scheduleHide();
    });
  });

  popover.addEventListener("mouseenter", cancelHide);
  popover.addEventListener("mouseleave", scheduleHide);
}

function createPopoverElement(): HTMLElement {
  const popover = document.createElement("div");
  popover.className = "page-preview footnote-popover print:hidden";
  popover.setAttribute("data-depth", "0");
  popover.setAttribute("aria-hidden", "true");
  popover.style.zIndex = "90";

  const linkBtn = document.createElement("button");
  linkBtn.type = "button";
  linkBtn.className = "page-preview-link";
  linkBtn.setAttribute("aria-label", "Open footnote");
  linkBtn.innerHTML = renderIconHtml("link", 14);

  const content = document.createElement("div");
  content.className =
    "page-preview-content prose prose-nooniwa prose-headings:scroll-mt-3 prose-a:text-(--color-accent) prose-a:no-underline prose-a:hover:underline max-w-none";

  popover.append(linkBtn, content);

  attachScrollGuard(popover, (_deltaY, target) =>
    shouldBlockPopoverScroll(content.contains(target as Node), content),
  );
  document.body.appendChild(popover);
  return popover;
}

function updateScrollState(popover: HTMLElement, contentEl: HTMLElement) {
  if (contentEl.scrollHeight > contentEl.clientHeight) {
    popover.classList.add("has-scroll");
  } else {
    popover.classList.remove("has-scroll");
  }
}

function positionPopover(popover: HTMLElement, ref: Element) {
  const rect = ref.getBoundingClientRect();
  const padding = 12;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const availableWidth = Math.max(240, viewportWidth - padding * 2);
  const popoverWidth = Math.min(360, availableWidth);

  popover.style.width = `${popoverWidth}px`;

  let left = rect.left;
  const minLeft = padding;
  const maxLeft = viewportWidth - popoverWidth - padding;
  left = Math.min(Math.max(left, minLeft), maxLeft);

  const popoverHeight = popover.offsetHeight;
  const below = rect.bottom + padding;
  const fitsBelow = below + popoverHeight <= viewportHeight - padding;
  const top = fitsBelow
    ? below
    : Math.max(padding, rect.top - padding - popoverHeight);

  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
}
