import { compareTagPagesByPath } from "../utils/tag-data";
import { createFocusTrap } from "./focus-trap";
import { loadSiteData } from "./site-data";
import { setScrollLock } from "./scroll-lock";

interface TagPageInfo {
  title: string;
  path: string;
}

interface TagData {
  [tag: string]: TagPageInfo[];
}

const modalState = {
  handlers: null as {
    handleTagClick: (e: Event) => void;
    handleCloseClick: () => void;
    handleBackdropClick: (e: Event) => void;
    handleKeydown: (e: KeyboardEvent) => void;
  } | null,
};

export function initTagModal(): void {
  const modal = document.getElementById("tag-modal");
  const closeBtn = document.getElementById("tag-modal-close");
  const backdrop = document.getElementById("tag-modal-backdrop");
  const titleTag = document.getElementById("tag-modal-tag");
  const pagesList = document.getElementById("tag-modal-pages");

  if (!modal || !titleTag || !pagesList) return;

  const modalEl = modal;
  const titleTagEl = titleTag;
  const pagesListEl = pagesList;

  const focusTrap = createFocusTrap(modalEl);

  if (modalState.handlers) {
    document.removeEventListener("click", modalState.handlers.handleTagClick);
    closeBtn?.removeEventListener(
      "click",
      modalState.handlers.handleCloseClick,
    );
    backdrop?.removeEventListener(
      "click",
      modalState.handlers.handleBackdropClick,
    );
    document.removeEventListener("keydown", modalState.handlers.handleKeydown);
  }

  async function openModal(
    tag: string,
    trigger: HTMLElement | null,
  ): Promise<void> {
    const normalizedTag = tag.toLowerCase();

    titleTagEl.textContent = `#${tag}`;

    modalEl.classList.add("visible");
    modalEl.setAttribute("aria-hidden", "false");

    setScrollLock("tag-modal", true);

    pagesListEl.innerHTML = "";
    try {
      const tagData: TagData = (await loadSiteData()).tags;
      const pages = getMatchingPages(normalizedTag, tagData);
      if (pages.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No pages found";
        li.style.fontStyle = "italic";
        li.style.color = "var(--color-foreground-muted)";
        pagesListEl.appendChild(li);
      } else {
        for (const page of pages) {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = page.path;
          a.textContent = page.title;
          li.appendChild(a);
          pagesListEl.appendChild(li);
        }
      }
    } catch {
      const li = document.createElement("li");
      li.textContent = "Failed to load tags";
      li.style.fontStyle = "italic";
      li.style.color = "var(--color-foreground-muted)";
      pagesListEl.appendChild(li);
    }

    focusTrap.activate(trigger);
  }

  function closeModal(): void {
    modalEl.classList.remove("visible");
    modalEl.setAttribute("aria-hidden", "true");
    setScrollLock("tag-modal", false);

    focusTrap.deactivate();
  }

  modalState.handlers = {
    handleTagClick: (e: Event) => {
      const target = e.target as HTMLElement;

      const tagButton = target.closest<HTMLElement>(".tag");
      if (tagButton) {
        e.preventDefault();
        const tag = tagButton.getAttribute("data-tag");
        if (tag) {
          void openModal(tag, tagButton);
        }
      }
    },
    handleCloseClick: () => closeModal(),
    handleBackdropClick: (e: Event) => {
      e.preventDefault();
      closeModal();
    },
    handleKeydown: (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalEl.classList.contains("visible")) {
        closeModal();
      }
    },
  };

  document.addEventListener("click", modalState.handlers.handleTagClick);
  closeBtn?.addEventListener("click", modalState.handlers.handleCloseClick);
  backdrop?.addEventListener("click", modalState.handlers.handleBackdropClick);
  document.addEventListener("keydown", modalState.handlers.handleKeydown);
}

function getMatchingPages(tag: string, tagData: TagData): TagPageInfo[] {
  const result: TagPageInfo[] = [];
  const seenPaths = new Set<string>();

  for (const [dataTag, pages] of Object.entries(tagData)) {
    if (dataTag === tag || dataTag.startsWith(tag + "/")) {
      for (const page of pages) {
        if (!seenPaths.has(page.path)) {
          seenPaths.add(page.path);
          result.push(page);
        }
      }
    }
  }

  result.sort(compareTagPagesByPath);

  return result;
}
