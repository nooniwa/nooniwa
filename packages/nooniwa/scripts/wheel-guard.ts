interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

export function isScrollable(scrollEl: ScrollMetrics): boolean {
  return scrollEl.scrollHeight - scrollEl.clientHeight > 0;
}

export function shouldPreventWheel(
  deltaY: number,
  scrollEl: ScrollMetrics,
): boolean {
  const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;
  if (maxScroll <= 0) return true;
  const atTop = scrollEl.scrollTop <= 0;
  const atBottom = scrollEl.scrollTop >= maxScroll;
  return (deltaY < 0 && atTop) || (deltaY > 0 && atBottom);
}

export function shouldBlockPopoverScroll(
  inContent: boolean,
  scrollEl: ScrollMetrics,
): boolean {
  if (!inContent) return true;
  return !isScrollable(scrollEl);
}

export function shouldBlockDrawerScroll(
  isOverlay: boolean,
  deltaY: number,
  scrollEl: ScrollMetrics,
): boolean {
  return isOverlay && shouldPreventWheel(deltaY, scrollEl);
}

export function attachScrollGuard(
  listenEl: HTMLElement,
  shouldBlock: (deltaY: number, target: EventTarget | null) => boolean,
): void {
  if (listenEl.dataset.scrollGuard === "true") return;
  listenEl.dataset.scrollGuard = "true";

  listenEl.addEventListener(
    "wheel",
    (event) => {
      if (shouldBlock(event.deltaY, event.target)) event.preventDefault();
    },
    { passive: false },
  );

  let startY = 0;
  listenEl.addEventListener(
    "touchstart",
    (event) => {
      startY = event.touches[0]?.clientY ?? 0;
    },
    { passive: true },
  );
  listenEl.addEventListener(
    "touchmove",
    (event) => {
      const currentY = event.touches[0]?.clientY ?? startY;
      const deltaY = startY - currentY;
      if (shouldBlock(deltaY, event.target)) event.preventDefault();
    },
    { passive: false },
  );
}
