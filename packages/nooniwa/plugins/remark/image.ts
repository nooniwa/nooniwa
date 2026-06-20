import path from "node:path";

const IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".bmp",
  ".avif",
];

export function isImageFile(filename: string): boolean {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return false;
  return IMAGE_EXTENSIONS.includes(filename.slice(lastDot).toLowerCase());
}

export function computeRelativeImagePath(
  mdContentRelPath: string,
  imageContentRelPath: string,
): string {
  const mdDir = path.posix.dirname(mdContentRelPath);
  const relative = path.posix.relative(mdDir, imageContentRelPath);

  if (!relative.startsWith("../") && !relative.startsWith("./")) {
    return `./${relative}`;
  }
  return relative;
}
