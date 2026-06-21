export function initCalloutFold() {
  document.querySelectorAll(".callout.is-collapsible").forEach((callout) => {
    const title = callout.querySelector(".callout-header");
    if (!title) return;

    title.addEventListener("click", () => {
      callout.classList.toggle("is-collapsed");
    });
  });
}
