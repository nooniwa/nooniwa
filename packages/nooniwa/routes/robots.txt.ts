import type { APIContext } from "astro";
import config from "virtual:nooniwa/config";

export async function GET(context: APIContext) {
  const lines = ["User-agent: *", "Allow: /"];

  if (config.sitemap && context.site) {
    const sitemapUrl = new URL("/sitemap-index.xml", context.site).href;
    lines.push(`Sitemap: ${sitemapUrl}`);
  }
  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
