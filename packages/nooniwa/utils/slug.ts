import { slug as githubSlug } from "github-slugger";

export function getContentRelativePath(
  filePath: string | undefined,
): string | undefined {
  if (!filePath) return undefined;
  const match = filePath.replace(/\\/g, "/").match(/content\/(.+)$/);
  return match?.[1];
}

export function filePathToSlug(filePath: string): string {
  return filePath
    .replace(/\.md$/, "")
    .split("/")
    .map((segment) => githubSlug(segment))
    .join("/");
}

export function getSlugPath(filePath: string | undefined): string | undefined {
  const contentRel = getContentRelativePath(filePath);
  return contentRel ? "/" + filePathToSlug(contentRel) : undefined;
}

export function slugToUrl(slug: string): string {
  const id = slug.replace(/\/index$/, "");
  if (id === "index" || id === "") return "/";
  return `/${id}/`;
}

export function headingToAnchor(heading: string): string {
  return githubSlug(heading);
}
