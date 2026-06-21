import { renderIconHtml } from "../icons";

const HEADING_LINK_ICON = renderIconHtml("link", 16);

export function initHeadingAnchors() {
  const headings = document.querySelectorAll(
    "#page-body h2[id], #page-body h3[id], #page-body h4[id], #page-body h5[id], #page-body h6[id]",
  );

  headings.forEach((heading) => {
    if (heading.querySelector(".heading-anchor")) return;

    const id = heading.getAttribute("id");
    if (!id) return;

    const anchor = document.createElement("a");
    anchor.href = `#${id}`;
    anchor.className = "heading-anchor";
    anchor.setAttribute("aria-label", "Copy link to this heading");
    anchor.innerHTML = HEADING_LINK_ICON;

    anchor.addEventListener("click", (e) => {
      e.preventDefault();
      const scrollPos = window.scrollY;
      window.location.hash = id;
      window.scrollTo(0, scrollPos);
      navigator.clipboard.writeText(window.location.href);
    });

    heading.appendChild(anchor);
  });
}
