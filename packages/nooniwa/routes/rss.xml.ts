import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import config from "virtual:nooniwa/config";
import { slugToUrl } from "../utils/slug";
import { isListablePage } from "../utils/pages";

export async function GET(context: APIContext) {
  const siteUrl = context.site?.toString().replace(/\/$/, "") ?? "";

  const allPages = await getCollection("pages", isListablePage);

  const sortedPages = allPages.sort((a, b) => {
    const dateA = a.data.updated ?? a.data.created ?? new Date(0);
    const dateB = b.data.updated ?? b.data.created ?? new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  return rss({
    title: config.siteTitle,
    description: config.siteDescription ?? config.siteTitle,
    site: context.site!,
    items: sortedPages.map((page) => {
      const title =
        page.data.title ??
        page.id.split("/").pop()?.replace(/\.md$/, "") ??
        "Untitled";
      const pubDate = page.data.updated ?? page.data.created;

      return {
        title,
        ...(page.data.description && { description: page.data.description }),
        ...(pubDate && { pubDate }),
        link: slugToUrl(page.id),
        categories: page.data.tags ?? [],
      };
    }),
    customData: `
      <language>${config.lang}</language>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    `.trim(),
    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
    },
  });
}
