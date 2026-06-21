import type { GraphData } from "../utils/graph";
import type { TagData } from "../utils/tag-data";

export interface SiteData {
  graph: GraphData;
  tags: TagData;
}

const SITE_DATA_URL = `${import.meta.env.BASE_URL}_nooniwa/site-data.json`;

let cache: Promise<SiteData> | null = null;

export function loadSiteData(): Promise<SiteData> {
  if (!cache) {
    cache = fetch(SITE_DATA_URL).then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load site data: ${res.status}`);
      }
      return res.json() as Promise<SiteData>;
    });
    cache.catch(() => {
      cache = null;
    });
  }
  return cache;
}
