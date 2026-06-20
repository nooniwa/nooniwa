import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "@astrojs/markdown-remark";
import type { AstroIntegrationLogger } from "astro";
import { filePathToSlug } from "./slug";
import { isImageFile } from "../plugins/remark/image";
import { blue } from "./terminal";
import {
  addPageEntry,
  addImageEntry,
  type ResolutionMap,
} from "./resolution-map";

export interface ContentMaps {
  pageUrlMap: ResolutionMap;
  imageFileMap: ResolutionMap;
  publishedSlugs: Set<string>;
}

export function buildContentMaps(
  contentDir: URL,
  logger: AstroIntegrationLogger,
): ContentMaps {
  const contentPath = fileURLToPath(contentDir);

  function buildPageUrlMap(): {
    pageUrlMap: ResolutionMap;
    publishedSlugs: Set<string>;
  } {
    const pageUrlMap: ResolutionMap = {};
    const publishedSlugs = new Set<string>();

    function walkDir(dir: string, relativePath = "") {
      if (!fs.existsSync(dir)) return;

      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        const relPath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;

        if (entry.isDirectory()) {
          walkDir(fullPath, relPath);
        } else if (entry.name.endsWith(".md")) {
          const content = fs.readFileSync(fullPath, "utf-8");

          let frontmatter: Record<string, unknown>;
          try {
            frontmatter = parseFrontmatter(content).frontmatter;
          } catch {
            continue;
          }

          const slug = filePathToSlug(relPath);
          addPageEntry(pageUrlMap, slug);

          const isPublished = frontmatter["publish"] === true;
          if (isPublished) publishedSlugs.add(slug);

          const slugValue = frontmatter["slug"];
          if (isPublished && slugValue != null && slugValue !== "") {
            const location = blue(path.relative(process.cwd(), fullPath));
            logger.warn(
              `\`slug:\` frontmatter is ignored — pages are addressed by file path (${location})`,
            );
          }
        }
      }
    }

    walkDir(contentPath);
    return { pageUrlMap, publishedSlugs };
  }

  function buildImageFileMap(): ResolutionMap {
    const imageFileMap: ResolutionMap = {};

    function walkDir(dir: string, relativePath = "") {
      if (!fs.existsSync(dir)) return;

      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        const relPath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;

        if (entry.isDirectory()) {
          walkDir(fullPath, relPath);
        } else if (isImageFile(entry.name)) {
          addImageEntry(imageFileMap, relPath);
        }
      }
    }

    walkDir(contentPath);
    return imageFileMap;
  }

  const { pageUrlMap, publishedSlugs } = buildPageUrlMap();
  const imageFileMap = buildImageFileMap();

  logger.info(
    `Content scanned: ${Object.keys(pageUrlMap).length} page entries (${publishedSlugs.size} published), ${Object.keys(imageFileMap).length} image entries`,
  );

  return { pageUrlMap, imageFileMap, publishedSlugs };
}
