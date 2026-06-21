import { getSiteData } from "../utils/site-data";

export const prerender = true;

export async function GET() {
  const { fullGraphData, tagData } = await getSiteData();

  return new Response(JSON.stringify({ graph: fullGraphData, tags: tagData }), {
    headers: { "content-type": "application/json" },
  });
}
