export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return -1;
  return ((index % length) + length) % length;
}

export function optionId(index: number): string {
  return `search-option-${index}`;
}

export interface ComboboxAriaState {
  expanded: "true" | "false";
  activeDescendant: string | null;
}

export function comboboxAriaState(args: {
  open: boolean;
  activeIndex: number;
  count: number;
}): ComboboxAriaState {
  const { open, activeIndex, count } = args;
  const hasActive = open && activeIndex >= 0 && activeIndex < count;
  return {
    expanded: open ? "true" : "false",
    activeDescendant: hasActive ? optionId(activeIndex) : null,
  };
}

export function resultsAnnouncement(count: number): string {
  if (count <= 0) return "No results found";
  return `${count} result${count === 1 ? "" : "s"} found`;
}

export function isImeEnter(
  e: { isComposing: boolean; keyCode: number },
  composing: boolean,
): boolean {
  return e.isComposing || composing || e.keyCode === 229;
}
