const MAX_FOCUS_ATTEMPTS = 5;

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export interface FocusTrap {
  activate(trigger: HTMLElement | null): void;

  deactivate(): void;
}

export function createFocusTrap(container: HTMLElement): FocusTrap {
  let trigger: HTMLElement | null = null;
  let inertedElements: Element[] = [];
  let active = false;

  function getFocusable(): HTMLElement[] {
    return Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((el) => el.getClientRects().length > 0);
  }

  function setInertOutside(on: boolean): void {
    if (on) {
      inertedElements = [];
      let el: HTMLElement | null = container;
      while (el && el !== document.body) {
        const parent: HTMLElement | null = el.parentElement;
        if (!parent) break;
        for (const sibling of Array.from(parent.children)) {
          if (sibling !== el && !sibling.hasAttribute("inert")) {
            sibling.setAttribute("inert", "");
            inertedElements.push(sibling);
          }
        }
        el = parent;
      }
    } else {
      for (const sibling of inertedElements) sibling.removeAttribute("inert");
      inertedElements = [];
    }
  }

  function focusFirst(): void {
    const focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0]!.focus();
    } else {
      if (!container.hasAttribute("tabindex")) {
        container.setAttribute("tabindex", "-1");
      }
      container.focus();
    }
  }

  function focusIntoModal(attempt: number): void {
    if (!active) return;
    focusFirst();
    if (
      container.contains(document.activeElement) ||
      attempt >= MAX_FOCUS_ATTEMPTS
    ) {
      setInertOutside(true);
    } else {
      requestAnimationFrame(() => focusIntoModal(attempt + 1));
    }
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key !== "Tab") return;

    const focusable = getFocusable();
    if (focusable.length === 0) {
      e.preventDefault();
      container.focus();
      return;
    }

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    const activeEl = document.activeElement;

    if (e.shiftKey) {
      if (activeEl === first || !container.contains(activeEl)) {
        e.preventDefault();
        last.focus();
      }
    } else if (activeEl === last || !container.contains(activeEl)) {
      e.preventDefault();
      first.focus();
    }
  }

  return {
    activate(t: HTMLElement | null): void {
      if (active) return;
      active = true;
      trigger = t;

      document.addEventListener("keydown", handleKeydown, true);

      focusIntoModal(0);
    },

    deactivate(): void {
      if (!active) return;
      active = false;

      document.removeEventListener("keydown", handleKeydown, true);

      setInertOutside(false);

      const t = trigger;
      trigger = null;
      if (t && document.contains(t)) {
        t.focus();
      }
    },
  };
}
