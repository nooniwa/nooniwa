export const SIDEBAR_SCROLL_KEY = "nooniwa:sidebar-scroll";

export function serializeSidebarScroll(scrollTop: number): string {
  return String(Math.max(0, Math.round(scrollTop)));
}

export function parseSidebarScroll(raw: string | null): number {
  const n = Number(raw);
  return raw != null && Number.isFinite(n) && n > 0 ? n : 0;
}

export function shouldGateSidebar(raw: string | null): boolean {
  return parseSidebarScroll(raw) > 0;
}

export function initSidebarScrollPersist() {
  const nav = document.querySelector<HTMLElement>(".page-left nav");
  if (!nav || nav.hasAttribute("data-scroll-persist")) return;
  nav.setAttribute("data-scroll-persist", "true");

  nav.addEventListener(
    "scroll",
    () => {
      sessionStorage.setItem(
        SIDEBAR_SCROLL_KEY,
        serializeSidebarScroll(nav.scrollTop),
      );
    },
    { passive: true },
  );
}
