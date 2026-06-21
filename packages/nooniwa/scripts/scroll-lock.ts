const owners = new Set<string>();

let savedScrollY = 0;

function applyLock(): void {
  savedScrollY = window.scrollY;
  const { style } = document.body;
  style.position = "fixed";
  style.top = `-${savedScrollY}px`;
  style.left = "0";
  style.right = "0";
}

function releaseLock(): void {
  const { style } = document.body;
  style.position = "";
  style.top = "";
  style.left = "";
  style.right = "";
  window.scrollTo(0, savedScrollY);
}

export function setScrollLock(owner: string, locked: boolean): void {
  const wasLocked = owners.size > 0;
  if (locked) owners.add(owner);
  else owners.delete(owner);
  const nowLocked = owners.size > 0;

  if (nowLocked && !wasLocked) applyLock();
  else if (!nowLocked && wasLocked) releaseLock();
}
