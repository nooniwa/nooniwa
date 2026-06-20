import { slugToUrl } from "./slug";

export interface TreeNode {
  name: string;
  url?: string;
  title?: string;
  isFolder: boolean;
  children: TreeNode[];
  sortKey: string;
}

interface PageEntry {
  id: string;
  data: {
    title?: string | undefined;
  };
}

export function buildFolderTree(entries: PageEntry[]): TreeNode[] {
  const root: TreeNode = {
    name: "root",
    isFolder: true,
    children: [],
    sortKey: "",
  };

  for (const entry of entries) {
    const pathParts = entry.id.replace(/\.md$/, "").split("/");
    const url = slugToUrl(entry.id);
    const title =
      entry.data.title ?? pathParts[pathParts.length - 1] ?? entry.id;

    let current = root;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (!part) continue;
      const isLast = i === pathParts.length - 1;

      if (isLast) {
        const matchingFolder = current.children.find(
          (child) => child.isFolder && child.name === part,
        );
        if (matchingFolder) {
          matchingFolder.children.push({
            name: part,
            url,
            title,
            isFolder: false,
            children: [],
            sortKey: "0_",
          });
        } else {
          const isIndex = part.toLowerCase() === "index";
          current.children.push({
            name: part,
            url,
            title,
            isFolder: false,
            children: [],
            sortKey: isIndex ? "0_" : `2_${part.toLowerCase()}`,
          });
        }
      } else {
        let folder = current.children.find(
          (child) => child.isFolder && child.name === part,
        );

        if (!folder) {
          folder = {
            name: part,
            isFolder: true,
            children: [],
            sortKey: `1_${part.toLowerCase()}`,
          };
          current.children.push(folder);
        }

        current = folder;
      }
    }
  }

  relocateIndexFiles(root);

  sortTree(root);

  return root.children;
}

function relocateIndexFiles(node: TreeNode): void {
  const toRemove: number[] = [];

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (!child) continue;
    if (child.isFolder) continue;

    const matchingFolder = node.children.find(
      (sibling) => sibling.isFolder && sibling.name === child.name,
    );
    if (matchingFolder) {
      matchingFolder.children.push({ ...child, sortKey: "0_" });
      toRemove.push(i);
    }
  }

  for (let i = toRemove.length - 1; i >= 0; i--) {
    const idx = toRemove[i];
    if (idx !== undefined) {
      node.children.splice(idx, 1);
    }
  }

  for (const child of node.children) {
    if (child.isFolder) {
      relocateIndexFiles(child);
    }
  }
}

function sortTree(node: TreeNode): void {
  node.children.sort((a, b) => {
    if (!a.isFolder && a.name.toLowerCase() === node.name.toLowerCase()) {
      return -1;
    }
    if (!b.isFolder && b.name.toLowerCase() === node.name.toLowerCase()) {
      return 1;
    }

    return a.sortKey.localeCompare(b.sortKey, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  for (const child of node.children) {
    if (child.isFolder) {
      sortTree(child);
    }
  }
}

export function shouldBeOpen(folderPath: string, currentPath: string): boolean {
  if (!currentPath) return false;

  const normalizedFolder = folderPath.toLowerCase();
  const normalizedCurrent = currentPath.replace(/^\//, "").toLowerCase();

  return (
    normalizedCurrent === normalizedFolder ||
    normalizedCurrent.startsWith(normalizedFolder + "/")
  );
}
